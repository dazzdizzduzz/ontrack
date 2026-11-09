import type { Metadata } from 'next';
import { BerandaKaryawan } from '@/features/karyawan/BerandaKaryawan';
import type { ClockInPreview } from '@/features/karyawan/clock-in/ClockInCard';

export const metadata: Metadata = { title: 'Beranda · On-Track' };

type PageProps = { searchParams: Promise<{ state?: string }> };

const previews: ClockInPreview[] = [
  'clock-in',
  'berhasil',
  'ditolak',
  'kurang-akurat',
  'clock-out',
  'clock-out-berhasil',
  'pulang-cepat',
];

/**
 * KW08. `?state=clock-in` (KW11), `berhasil` (KW12), `ditolak` (KW13), `kurang-akurat` (KW27),
 * `clock-out` (KW14), `clock-out-berhasil` (KW15), `pulang-cepat` (KW26), dan `notifikasi` (KW25).
 */
export default async function BerandaPage({ searchParams }: PageProps) {
  const { state } = await searchParams;
  const preview = previews.find((name) => name === state);
  return (
    <BerandaKaryawan
      key={state}
      preview={preview}
      notificationsOpen={state === 'notifikasi'}
    />
  );
}
