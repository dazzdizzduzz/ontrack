import { useLocalSearchParams } from 'expo-router';

import {
  ClockOutResultScreen,
  type ClockOutPreview,
} from '@/features/attendance/ClockOutResultScreen';

const previews: ClockOutPreview[] = ['lembur', 'tepat-waktu', 'pulang-cepat'];

/**
 * Hasil clock-out terakhir. Contoh lewat `?state=`: `lembur` (M14), `tepat-waktu` (M50),
 * dan `pulang-cepat` (M33).
 */
export default function ClockOutResultRoute() {
  const { state } = useLocalSearchParams<{ state?: string }>();
  const preview = previews.find((name) => name === state);

  return <ClockOutResultScreen preview={preview} />;
}
