import type { Metadata } from 'next';
import { EmployeeAttendance } from '@/features/admin/rekap/EmployeeAttendance';

export const metadata: Metadata = { title: 'Detail Absensi · On-Track' };

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ state?: string }>;
};

/** W37 · Detail absensi karyawan, contoh /kehadiran/karyawan/daze; `?state=kosong` = W96 (Juni 2026). */
export default async function EmployeeAttendancePage({ params, searchParams }: PageProps) {
  const [{ id }, { state }] = await Promise.all([params, searchParams]);
  const preview = state === 'kosong' ? state : undefined;
  return <EmployeeAttendance key={preview} id={id} preview={preview} />;
}
