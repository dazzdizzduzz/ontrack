import { useLocalSearchParams } from 'expo-router';

import { ClockInResultScreen } from '@/features/attendance/ClockInResultScreen';

/** M04 dari hasil clock-in terakhir. `?state=terlambat` membuka contoh M28, `terlambat-lama` M51. */
export default function ClockInResultRoute() {
  const { state } = useLocalSearchParams<{ state?: string }>();
  const preview = state === 'terlambat' || state === 'terlambat-lama' ? state : undefined;

  return <ClockInResultScreen preview={preview} />;
}
