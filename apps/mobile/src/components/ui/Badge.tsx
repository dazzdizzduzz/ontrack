import { color, radius, space } from '@on-track/tokens';
import { StyleSheet, Text, View } from 'react-native';

import { textStyle } from '@/theme/text';
import { Icon, type IconName } from './Icon';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'inverse';

const tones: Record<BadgeTone, { background: string; text: string; dot: IconName }> = {
  success: { background: color.status.successBg, text: color.status.successFg, dot: 'dot-success' },
  warning: { background: color.status.warningBg, text: color.status.warningFg, dot: 'dot-warning' },
  danger: { background: color.status.dangerBg, text: color.status.dangerFg, dot: 'dot-danger' },
  neutral: { background: color.bg.canvas, text: color.text.primary, dot: 'dot-neutral' },
  // Di atas kartu gelap (M02): titik aksen dan teks putih.
  inverse: { background: color.bg.inverse, text: color.text.inverse, dot: 'dot-accent' },
};

/** Badge status: warna selalu disertai teks (WCAG 1.4.1). */
export function Badge({ tone, label }: { tone: BadgeTone; label: string }) {
  const { background, text, dot } = tones[tone];

  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Icon name={dot} size={6} />
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space[4],
    paddingHorizontal: space[8],
    paddingVertical: space[4],
    borderRadius: radius.full,
  },
  label: textStyle('labelS'),
});
