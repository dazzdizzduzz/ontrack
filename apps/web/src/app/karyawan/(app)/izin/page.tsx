import type { Metadata } from 'next';
import { IzinCuti, type IzinPreview } from '@/features/karyawan/izin/IzinCuti';

export const metadata: Metadata = { title: 'Izin & Cuti · On-Track' };

type PageProps = { searchParams: Promise<{ state?: string }> };

const previews: IzinPreview[] = ['ajukan', 'tanggal', 'kuota', 'terkirim', 'menu'];

/**
 * KW17. Contoh lewat `?state=`: `ajukan` (KW18), `tanggal` (KW29), `kuota` (KW20), `terkirim` (KW19),
 * `menu` (KW30).
 */
export default async function IzinPage({ searchParams }: PageProps) {
  const { state } = await searchParams;
  const preview = previews.find((name) => name === state);
  return <IzinCuti key={preview} preview={preview} />;
}
