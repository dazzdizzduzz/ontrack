import type { Metadata } from 'next';
import { OvertimeApproval, type OvertimePreview } from '@/features/admin/overtime/OvertimeApproval';

export const metadata: Metadata = { title: 'Persetujuan Lembur · On-Track' };

type PageProps = { searchParams: Promise<{ state?: string }> };

const previews: OvertimePreview[] = ['tolak', 'disetujui', 'ditolak', 'detail', 'divisi'];

/**
 * W34. Contoh lewat `?state=`: `tolak` (W35), `disetujui` (W36), `ditolak` (W93), `detail` (W94),
 * dan `divisi` (W95).
 */
export default async function OvertimePage({ searchParams }: PageProps) {
  const { state } = await searchParams;
  const preview = previews.find((name) => name === state);
  return <OvertimeApproval key={preview} preview={preview} />;
}
