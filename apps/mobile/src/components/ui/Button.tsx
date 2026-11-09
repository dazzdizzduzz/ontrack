import { color, radius, size, space } from '@on-track/tokens';
import { Pressable, StyleSheet, Text } from 'react-native';

import { textStyle } from '@/theme/text';
import { Icon, type IconName } from './Icon';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
  disabled?: boolean;
  /** Lebar penuh dan tinggi 52px; varian ghost tanpa ini setinggi 44px. */
  fullWidth?: boolean;
  icon?: IconName;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  icon,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        fullWidth ? styles.fullWidth : styles.compact,
        variantStyles[variant],
        pressed && pressedStyles[variant],
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, labelStyles[variant], disabled && styles.labelDisabled]}>
        {label}
      </Text>
      {icon && <Icon name={icon} size={20} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
    borderRadius: radius.md,
  },
  fullWidth: {
    alignSelf: 'stretch',
    minHeight: size.buttonL,
    paddingHorizontal: space[24],
    paddingVertical: space[16],
  },
  compact: {
    minHeight: size.iconTarget,
    paddingHorizontal: space[16],
    paddingVertical: space[8],
  },
  disabled: {
    backgroundColor: color.bg.disabled,
    borderWidth: 0,
  },
  label: textStyle('labelM'),
  labelDisabled: {
    color: color.text.disabled,
  },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: color.bg.inverse },
  secondary: {
    borderWidth: 1,
    borderColor: color.border.strong,
    backgroundColor: color.bg.surface,
  },
  ghost: { backgroundColor: 'transparent' },
  accent: { backgroundColor: color.accent.default },
});

const pressedStyles = StyleSheet.create({
  primary: { backgroundColor: color.bg.inverseHover },
  secondary: { backgroundColor: color.bg.hover },
  ghost: { backgroundColor: color.bg.hover },
  accent: { backgroundColor: color.accent.hover },
});

const labelStyles = StyleSheet.create({
  primary: { color: color.text.inverse },
  secondary: { color: color.text.primary },
  ghost: { color: color.text.primary },
  accent: { color: color.text.onAccent },
});
