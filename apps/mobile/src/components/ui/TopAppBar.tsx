import { color, size, space } from '@on-track/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { textStyle } from '@/theme/text';
import { Icon } from './Icon';

/** Bar judul layar. Tanpa `onBack` (layar tab seperti M21), tombol kembali tidak tampil. */
export function TopAppBar({ title, onBack }: { title: string; onBack?: () => void }) {
  const { top } = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingTop: top }]}>
      <View style={styles.row}>
        {onBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            onPress={onBack}
            style={styles.back}
          >
            <Icon name="back" size={20} />
          </Pressable>
        )}
        <Text accessibilityRole="header" numberOfLines={1} style={styles.title}>
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderBottomWidth: 1,
    borderBottomColor: color.border.default,
    backgroundColor: color.bg.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    height: 55,
    paddingHorizontal: space[16],
  },
  back: {
    alignItems: 'center',
    justifyContent: 'center',
    width: size.iconTarget,
    height: size.iconTarget,
  },
  title: {
    ...textStyle('headingH2'),
    flex: 1,
    color: color.text.primary,
  },
});
