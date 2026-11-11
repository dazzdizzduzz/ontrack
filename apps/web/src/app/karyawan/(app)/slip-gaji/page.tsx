import type { Metadata } from 'next';
import { SlipGaji, type SlipPreview } from '@/features/karyawan/slip/SlipGaji';

export const metadata: Metadata = { title: 'Slip Gaji · On-Track' };

type PageProps = { searchParams: Promise<{ state?: string }> };

const previews: SlipPreview[] = ['pdf', 'belum', 'agustus', 'juli'];

/** KW23. Contoh lewat `?state=`: `pdf` (KW24), `belum` (Oktober belum terbit), `agustus` (KW32), `juli` (KW33). */
export default async function SlipGajiPage({ searchParams }: PageProps) {
  const { state } = await searchParams;
  const preview = previews.find((name) => name === state);
  return <SlipGaji key={preview} preview={preview} />;
}
