import { color, space } from '@on-track/tokens';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { textStyle } from '@/theme/text';
import { Icon } from './Icon';

/** Banner Offline (M22, M64): hitam dengan ikon wifi-off, dibacakan sebagai peringatan. */
export function OfflineBanner({
  message,
  paddingTop = space[12],
  style,
}: {
  message: string;
  paddingTop?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View accessibilityRole="alert" style={[styles.banner, { paddingTop }, style]}>
      <Icon name="wifi-off" size={20} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    paddingHorizontal: space[16],
    paddingBottom: space[12],
    backgroundColor: color.bg.inverse,
  },
  text: {
    ...textStyle('bodyS'),
    flex: 1,
    color: color.text.inverse,
  },
});
