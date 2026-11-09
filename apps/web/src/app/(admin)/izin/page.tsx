import type { Metadata } from 'next';
import { LeaveApproval, type LeavePreview } from '@/features/admin/leave/LeaveApproval';

export const metadata: Metadata = { title: 'Izin & Cuti · On-Track' };

type PageProps = { searchParams: Promise<{ state?: string }> };

const previews: LeavePreview[] = [
  'detail',
  'disetujui',
  'tolak',
  'tolak-kosong',
  'tolak-terisi',
  'ditolak',
];

/**
 * W03. Contoh lewat `?state=`: `detail` (W40), `disetujui` (W41), `tolak` (W04), `tolak-kosong`
 * (W42), `tolak-terisi` (W45), dan `ditolak` (W43).
 */
export default async function LeaveApprovalPage({ searchParams }: PageProps) {
  const { state } = await searchParams;
  const preview = previews.find((name) => name === state);
  return <LeaveApproval key={preview} preview={preview} />;
}
