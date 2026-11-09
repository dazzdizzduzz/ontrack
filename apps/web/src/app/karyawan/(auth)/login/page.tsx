import { parseLoginPreview } from '@on-track/core';
import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/LoginForm';

export const metadata: Metadata = { title: 'Masuk · On-Track' };

type PageProps = { searchParams: Promise<{ state?: string }> };

/**
 * `?state=salah` (KW09) dan `?state=terkunci` (KW02) membuka status login untuk
 * ditinjau selama tahap tampilan, sebelum API tersedia.
 */
export default async function KaryawanLoginPage({ searchParams }: PageProps) {
  const { state } = await searchParams;
  const preview = parseLoginPreview(state);

  return <LoginForm key={preview ?? 'default'} portal="karyawan" preview={preview} />;
}
