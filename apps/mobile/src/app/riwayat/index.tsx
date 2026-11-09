import { useLocalSearchParams } from 'expo-router';

import { HistoryScreen } from '@/features/history/HistoryScreen';

/** M15. `?state=periode` membuka contoh M37 (bottom sheet), `?state=kosong` contoh M57 (Juni 2026). */
export default function HistoryRoute() {
  const { state } = useLocalSearchParams<{ state?: string }>();
  const preview = state === 'periode' || state === 'kosong' ? state : undefined;

  return <HistoryScreen key={preview ?? 'riwayat'} preview={preview} />;
}
