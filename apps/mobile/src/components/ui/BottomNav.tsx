import { color, radius, space } from '@on-track/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { textStyle } from '@/theme/text';
import { Icon, type IconName } from './Icon';

export type BottomNavItem = {
  label: string;
  icon: IconName;
  /** Kosong berarti fiturnya belum dibuat; tab tetap tampil sesuai Figma. */
  onPress?: () => void;
};

type BottomNavProps = { items: BottomNavItem[]; active: string };

/** Navigasi bawah mobile (M02). Tab aktif memakai pil aksen dan label ink. */
export function BottomNav({ items, active }: BottomNavProps) {
  const { bottom } = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { paddingBottom: Math.max(space[24], bottom) }]}
    >
      {items.map((item) => {
        const selected = item.label === active;
        return (
          <Pressable
            key={item.label}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected, disabled: !selected && !item.onPress }}
            onPress={selected ? undefined : item.onPress}
            style={styles.tab}
          >
            <View style={[styles.indicator, selected && styles.indicatorActive]}>
              <Icon name={item.icon} size={24} />
            </View>
            <Text style={[styles.label, selected && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: space[8],
    paddingHorizontal: space[20],
    borderTopWidth: 1,
    borderTopColor: color.border.default,
    backgroundColor: color.bg.surface,
  },
  tab: {
    alignItems: 'center',
    gap: space[4],
    width: 72,
    paddingHorizontal: space[4],
    paddingVertical: space[8],
  },
  indicator: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 32,
    borderRadius: radius.full,
  },
  indicatorActive: {
    backgroundColor: color.accent.default,
  },
  label: {
    ...textStyle('caption'),
    fontFamily: textStyle('labelM').fontFamily,
    color: color.text.secondary,
  },
  labelActive: {
    color: color.text.primary,
  },
});
