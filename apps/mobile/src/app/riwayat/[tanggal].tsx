import { useLocalSearchParams } from 'expo-router';

import { DayDetailScreen } from '@/features/history/DayDetailScreen';

/** M36 · Detail absensi harian, contoh: /riwayat/2026-09-30. */
export default function DayDetailRoute() {
  const { tanggal } = useLocalSearchParams<{ tanggal: string }>();

  return <DayDetailScreen date={tanggal ?? ''} />;
}
