import type { Metadata } from 'next';
import { AccessLog } from '@/features/admin/payroll/AccessLog';

export const metadata: Metadata = { title: 'Log Akses Payroll · On-Track' };

type PageProps = { searchParams: Promise<{ state?: string }> };

/** W68. Contoh lewat `?state=detail` (W101 · detail akses ditolak). */
export default async function AccessLogPage({ searchParams }: PageProps) {
  const { state } = await searchParams;
  const preview = state === 'detail' ? 'detail' : undefined;
  return <AccessLog key={preview} preview={preview} />;
}
