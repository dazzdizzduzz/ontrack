import { NextResponse, type NextRequest } from 'next/server';
import { PROBLEM_CONTENT_TYPE, type Problem } from '@/lib/api/problem';
import type { components } from '@/lib/api/schema';
import { AUTH_COOKIE } from '@/lib/auth/constants';

type LoginRequest = components['schemas']['LoginRequest'];
type LoginResponse = components['schemas']['LoginResponse'];

/** Alamat backend Go. Dibaca di server saja, tidak pernah sampai ke browser. */
const API_URL = (process.env.API_URL ?? 'http://localhost:8080').replace(/\/$/, '');
const UPSTREAM_TIMEOUT_MS = 10_000;

const NO_STORE = { 'Cache-Control': 'no-store' };

function problem(status: number, title: string, detail?: string) {
  const body: Problem = { type: 'about:blank', title, status, ...(detail && { detail }) };
  return NextResponse.json(body, {
    status,
    headers: { ...NO_STORE, 'Content-Type': PROBLEM_CONTENT_TYPE },
  });
}

/** Judul per status. 401 sengaja generik: backend memakai 401 untuk sandi salah dan akun nonaktif. */
const titles: Record<number, string> = {
  400: 'Permintaan tidak valid',
  401: 'Gagal masuk',
  423: 'Akun dikunci sementara',
};

/**
 * Backend saat ini membalas `{ "message": "..." }`, bukan problem+json. Route Handler menerima
 * kedua bentuk dan selalu membalas problem+json ke browser.
 */
async function problemFromUpstream(upstream: Response) {
  let title: string | undefined;
  let detail: string | undefined;
  try {
    const data: unknown = await upstream.json();
    if (typeof data === 'object' && data !== null) {
      const record = data as Record<string, unknown>;
      if (typeof record.title === 'string') title = record.title;
      detail = [record.detail, record.message].find((value): value is string => typeof value === 'string');
    }
  } catch {
    // Badan bukan JSON: pakai judul bawaan.
  }

  if (upstream.status >= 500) {
    // Jangan teruskan pesan internal server.
    return problem(502, 'Server bermasalah', 'Terjadi kesalahan pada server. Coba lagi beberapa saat lagi.');
  }
  return problem(upstream.status, title ?? titles[upstream.status] ?? 'Permintaan gagal', detail);
}

export async function POST(request: NextRequest) {
  // Hanya JSON: permintaan lintas situs lewat <form> biasa tidak bisa mengirim tipe ini.
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    return problem(415, 'Format tidak didukung', 'Kirim data dalam format JSON.');
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return problem(400, titles[400], 'Isi permintaan bukan JSON yang valid.');
  }
  const { email, password } = (payload ?? {}) as Partial<Record<keyof LoginRequest, unknown>>;
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return problem(400, titles[400], 'Email dan kata sandi wajib diisi.');
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: email.trim(), password } satisfies LoginRequest),
      cache: 'no-store',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    return problem(503, 'Server tidak dapat dihubungi', 'Periksa koneksi lalu coba lagi.');
  }

  if (!upstream.ok) return problemFromUpstream(upstream);

  const data = (await upstream.json().catch(() => null)) as Partial<LoginResponse> | null;
  if (!data?.access_token || typeof data.expires_in !== 'number') {
    return problem(502, 'Server bermasalah', 'Respons login dari server tidak lengkap.');
  }

  const secure =
    request.nextUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';

  // Token hanya hidup di cookie httpOnly; badan respons tidak membawanya ke JavaScript browser.
  const response = NextResponse.json({ ok: true }, { headers: NO_STORE });
  response.cookies.set({
    name: AUTH_COOKIE,
    value: data.access_token,
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: data.expires_in,
  });
  return response;
}
