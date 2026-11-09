import { useLocalSearchParams } from 'expo-router';

import { HomeScreen, type HomePreview } from '@/features/home/HomeScreen';

const previews: HomePreview[] = ['sudah-clock-in', 'sudah-clock-out'];

/** M02. Contoh Figma lewat `?state=`: `sudah-clock-in` (M08) dan `sudah-clock-out` (M49). */
export default function BerandaRoute() {
  const { state } = useLocalSearchParams<{ state?: string }>();
  const preview = previews.find((name) => name === state);

  return <HomeScreen key={preview ?? 'perangkat'} preview={preview} />;
}
