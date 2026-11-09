import type { Metadata } from 'next';
import { MyScheduleLocation } from '@/features/karyawan/MyScheduleLocation';

export const metadata: Metadata = { title: 'Jadwal & Lokasi Saya · On-Track' };

export default function MyScheduleLocationPage() {
  return <MyScheduleLocation />;
}
