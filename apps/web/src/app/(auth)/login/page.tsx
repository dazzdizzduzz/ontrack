import { parseLoginPreview } from '@on-track/core';
import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/LoginForm';

export const metadata: Metadata = { title: 'Masuk · On-Track' };

type PageProps = { searchParams: Promise<{ state?: string }> };

/**
 * `?state=salah` (W25) dan `?state=terkunci` (W23) membuka status login untuk
 * ditinjau selama tahap tampilan, sebelum API tersedia.
 */
export default async function LoginPage({ searchParams }: PageProps) {
  const { state } = await searchParams;
  const preview = parseLoginPreview(state);

  return <LoginForm key={preview ?? 'default'} portal="admin" preview={preview} />;
}
