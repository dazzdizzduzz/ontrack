import type { Metadata } from 'next';
import { RekapAbsensi, type RekapPreview } from '@/features/admin/rekap/RekapAbsensi';

export const metadata: Metadata = { title: 'Rekap Absensi · On-Track' };

type PageProps = { searchParams: Promise<{ state?: string }> };

const previews: RekapPreview[] = ['ekspor', 'pratinjau', 'membuat', 'siap'];

/**
 * W05. Contoh lewat `?state=`: `ekspor` (W38), `pratinjau` (W39), `membuat` (W97), dan `siap`
 * (W98, toast PDF siap).
 */
export default async function KehadiranPage({ searchParams }: PageProps) {
  const { state } = await searchParams;
  const preview = previews.find((name) => name === state);
  return <RekapAbsensi key={preview} preview={preview} />;
}
