import { color, radius, space } from '@on-track/tokens';
import { useEffect, type ReactNode } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';

import { textStyle } from '@/theme/text';
import { Icon, type IconName } from './Icon';

type Tone = 'warning' | 'danger' | 'success' | 'info';

const tones: Record<Tone, { background: string; title: string; icon: IconName }> = {
  warning: {
    background: color.status.warningBg,
    title: color.status.warningFg,
    icon: 'alert-warning',
  },
  danger: { background: color.status.dangerBg, title: color.status.dangerFg, icon: 'alert-danger' },
  success: { background: color.status.successBg, title: color.status.successFg, icon: 'check-alert' },
  info: { background: color.bg.canvas, title: color.text.primary, icon: 'info' },
};

type AlertProps = {
  tone: Tone;
  title: string;
  children: ReactNode;
  /** Bacakan judul lewat pembaca layar saat alert muncul. */
  announce?: boolean;
};

export function Alert({ tone, title, children, announce = false }: AlertProps) {
  const { background, title: titleColor, icon } = tones[tone];

  useEffect(() => {
    if (announce) AccessibilityInfo.announceForAccessibility(title);
  }, [announce, title]);

  return (
    <View style={[styles.alert, { backgroundColor: background }]}>
      <Icon name={icon} size={20} />
      <View style={styles.text}>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        <Text style={styles.body}>{children}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  alert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    gap: space[12],
    padding: space[16],
    borderRadius: radius.md,
  },
  text: {
    flex: 1,
    gap: space[4],
  },
  title: textStyle('labelM'),
  body: {
    ...textStyle('bodyS'),
    color: color.text.primary,
  },
});
