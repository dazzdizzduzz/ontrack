import { useLocalSearchParams } from 'expo-router';

import { ClockOutScreen } from '@/features/attendance/ClockOutScreen';
import { clockOutScenarios } from '@/features/attendance/data';

/**
 * M32 dengan jam dan GPS perangkat. Contoh Figma lewat `?state=`: `lembur` (M32 → M14),
 * `tepat-waktu` (→ M50), `pulang-cepat` (M34 → M33), dan `luar-area` (M35).
 */
export default function ClockOutRoute() {
  const { state } = useLocalSearchParams<{ state?: string }>();
  const scenario = clockOutScenarios.find((name) => name === state);

  return <ClockOutScreen key={scenario ?? 'perangkat'} scenario={scenario} />;
}
