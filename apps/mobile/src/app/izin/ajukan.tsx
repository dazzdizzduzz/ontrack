import { useLocalSearchParams } from 'expo-router';

import { LeaveFormScreen, type LeaveFormPreview } from '@/features/leave/LeaveFormScreen';

const previews: LeaveFormPreview[] = ['contoh', 'jenis', 'sakit', 'validasi', 'kuota'];

/**
 * M05 (kosong). Contoh Figma lewat `?state=`: `contoh` (M05), `jenis` (M38), `sakit` (M39),
 * `validasi` (M40), `kuota` (M18).
 */
export default function LeaveFormRoute() {
  const { state } = useLocalSearchParams<{ state?: string }>();
  const preview = previews.find((name) => name === state);

  return <LeaveFormScreen key={preview ?? 'baru'} preview={preview} />;
}
