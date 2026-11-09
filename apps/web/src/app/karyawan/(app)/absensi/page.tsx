import type { Metadata } from 'next';
import { RiwayatAbsensi } from '@/features/karyawan/riwayat/RiwayatAbsensi';

export const metadata: Metadata = { title: 'Riwayat Absensi · On-Track' };

type PageProps = { searchParams: Promise<{ state?: string }> };

/** KW16 · Riwayat Absensi (Web). `?state=kosong` membuka contoh KW28 (Juni 2026). */
export default async function AbsensiPage({ searchParams }: PageProps) {
  const { state } = await searchParams;
  const preview = state === 'kosong' ? state : undefined;
  return <RiwayatAbsensi key={preview} preview={preview} />;
}
