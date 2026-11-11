import type { Metadata } from 'next';
import { AttendanceLive, type AttendanceLivePreview } from '@/features/admin/dashboard/AttendanceLive';

export const metadata: Metadata = { title: 'Dashboard Kehadiran · On-Track' };

type PageProps = { searchParams: Promise<{ state?: string }> };

const previews: AttendanceLivePreview[] = ['live', 'belum-absen'];

/** W01. Contoh lewat `?state=`: `live` (W02, sesudah update) dan `belum-absen` (W70). */
export default async function AttendanceLivePage({ searchParams }: PageProps) {
  const { state } = await searchParams;
  const preview = previews.find((name) => name === state);
  return <AttendanceLive key={preview} preview={preview} />;
}
