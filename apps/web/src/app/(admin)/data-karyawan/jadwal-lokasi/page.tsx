import type { Metadata } from 'next';
import {
  ScheduleAndLocation,
  type SchedulePreview,
} from '@/features/admin/schedule/ScheduleAndLocation';

export const metadata: Metadata = { title: 'Jadwal & Lokasi · On-Track' };

type PageProps = { searchParams: Promise<{ state?: string }> };

const previews: SchedulePreview[] = [
  'tambah-jadwal',
  'tambah-lokasi',
  'validasi',
  'tersimpan',
  'gagal',
  'jadwal-ditambahkan',
  'lokasi-ditambahkan',
  'jadwal-gagal',
  'beberapa-lokasi',
];

/**
 * W17. Pratinjau lewat `?state=`: `tambah-jadwal` (W31), `tambah-lokasi` (W32),
 * `validasi` (W33), `tersimpan` (W82), `gagal` (W83), `jadwal-ditambahkan` (W84),
 * `lokasi-ditambahkan` (W85), `jadwal-gagal` (W86), dan `beberapa-lokasi` (W89).
 */
export default async function ScheduleLocationPage({ searchParams }: PageProps) {
  const { state } = await searchParams;
  const preview = previews.find((name) => name === state);
  return <ScheduleAndLocation key={preview} preview={preview} />;
}
