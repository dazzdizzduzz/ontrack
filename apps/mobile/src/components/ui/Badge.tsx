import { color, radius, space } from '@on-track/tokens';
import { StyleSheet, Text, View } from 'react-native';

import { textStyle } from '@/theme/text';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'inverse';

const tones: Record<BadgeTone, { background: string; text: string; border: string }> = {
  success: {
    background: color.status.successBg,
    text: color.status.successFg,
    border: color.badge.successBorder,
  },
  warning: {
    background: color.status.warningBg,
    text: color.status.warningFg,
    border: color.badge.warningBorder,
  },
  danger: {
    background: color.status.dangerBg,
    text: color.status.dangerFg,
    border: color.badge.dangerBorder,
  },
  neutral: { background: color.bg.canvas, text: color.text.primary, border: color.badge.neutralBorder },
  // Di atas kartu gelap (M02): badge LIVE.
  inverse: { background: color.bg.inverse, text: color.text.inverse, border: color.badge.liveBorder },
};

/** Badge status: warna selalu disertai teks (WCAG 1.4.1). Figma: radius/sm, stroke 1 px, tanpa titik. */
export function Badge({ tone, label }: { tone: BadgeTone; label: string }) {
  const { background, text, border } = tones[tone];

  return (
    <View style={[styles.badge, { backgroundColor: background, borderColor: border }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: space[8],
    paddingVertical: space[4],
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  label: textStyle('labelS'),
});
