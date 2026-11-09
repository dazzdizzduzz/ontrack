import { parseLoginPreview } from '@on-track/core';
import { useLocalSearchParams } from 'expo-router';

import { LoginScreen } from '@/features/auth/LoginScreen';

/**
 * M01. `?state=salah` (M23) dan `?state=terkunci` (M12) membuka status login
 * untuk ditinjau selama tahap tampilan, sebelum API tersedia.
 */
export default function LoginRoute() {
  const { state } = useLocalSearchParams<{ state?: string }>();
  const preview = parseLoginPreview(state);

  return <LoginScreen key={preview ?? 'default'} preview={preview} />;
}
