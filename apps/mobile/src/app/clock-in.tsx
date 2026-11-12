import { useLocalSearchParams } from 'expo-router';

import { ClockInScreen } from '@/features/attendance/ClockInScreen';
import { clockInScenarios } from '@/features/attendance/data';

/**
 * M03 dengan jam dan GPS perangkat. Contoh Figma lewat `?state=`: `dalam-area` (M03 → M27 → M04),
 * `gps-lemah` (M29), `luar-area` (M07), `wajah-gagal` (M30 → M31 → M28), `terlambat` (M31 → M28),
 * `terlambat-lama` (→ M51), serta lokasi belum siap: `mencari` (M52), `izin-ditolak` (M53),
 * `gps-mati` (M54), `lokasi-gagal` (M55), dan `offline` (M64).
 */
export default function ClockInRoute() {
  const { state } = useLocalSearchParams<{ state?: string }>();
  const scenario = clockInScenarios.find((name) => name === state);

  return <ClockInScreen key={scenario ?? 'perangkat'} scenario={scenario} />;
}
