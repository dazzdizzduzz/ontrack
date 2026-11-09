import type { Metadata } from 'next';
import { IzinCuti } from '@/features/karyawan/izin/IzinCuti';

export const metadata: Metadata = { title: 'Ajukan Izin · On-Track' };

/** Tombol "Ajukan izin" di Beranda (KW08): halaman Izin & Cuti dengan formulir kosong terbuka. */
export default function AjukanIzinPage() {
  return <IzinCuti preview="baru" />;
}
