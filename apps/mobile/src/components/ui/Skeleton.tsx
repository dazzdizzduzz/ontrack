import { color, radius } from '@on-track/tokens';
import { View, type DimensionValue } from 'react-native';

/** Batang placeholder saat memuat (token border/default, radius full). Untuk data > 1 detik. */
export function Skeleton({ width, height = 12 }: { width: DimensionValue; height?: number }) {
  return (
    <View
      accessible={false}
      importantForAccessibility="no"
      style={{ width, height, borderRadius: radius.full, backgroundColor: color.border.default }}
    />
  );
}
