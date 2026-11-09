import type { Metadata } from 'next';
import { IzinCuti, type IzinPreview } from '@/features/karyawan/izin/IzinCuti';

export const metadata: Metadata = { title: 'Izin & Cuti · On-Track' };

type PageProps = { searchParams: Promise<{ state?: string }> };

const previews: IzinPreview[] = ['ajukan', 'kuota', 'terkirim'];

/** KW17. Contoh lewat `?state=`: `ajukan` (KW18), `kuota` (KW20), `terkirim` (KW19). */
export default async function IzinPage({ searchParams }: PageProps) {
  const { state } = await searchParams;
  const preview = previews.find((name) => name === state);
  return <IzinCuti key={preview} preview={preview} />;
}
