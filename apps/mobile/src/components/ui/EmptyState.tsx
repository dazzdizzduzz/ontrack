import { color, radius, space } from '@on-track/tokens';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { textStyle } from '@/theme/text';
import { Icon, type IconName } from './Icon';

/** Empty state Foundations: ikon dalam lingkaran, judul, penjelasan, dan satu aksi opsional. */
export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: IconName;
  title: string;
  children?: string;
  action?: ReactNode;
}) {
  return (
    <View accessibilityRole="summary" style={styles.wrap}>
      <View style={styles.icon}>
        <Icon name={icon} size={24} />
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {children ? <Text style={styles.text}>{children}</Text> : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: space[12],
    paddingVertical: space[32],
    paddingHorizontal: space[24],
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.full,
    backgroundColor: color.bg.subtle,
  },
  title: {
    ...textStyle('headingH3'),
    color: color.text.primary,
    textAlign: 'center',
  },
  text: {
    ...textStyle('bodyS'),
    color: color.text.secondary,
    textAlign: 'center',
  },
});
