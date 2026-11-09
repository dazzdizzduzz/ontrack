import { color, space } from '@on-track/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { textStyle } from '@/theme/text';
import { Icon } from './Icon';

type CheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function Checkbox({ label, checked, onChange, disabled = false }: CheckboxProps) {
  return (
    <Pressable
      role="checkbox"
      aria-label={label}
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={styles.checkbox}
    >
      <View style={[styles.control, checked && styles.checked, disabled && styles.controlDisabled]}>
        {checked && !disabled && <Icon name="check-inverse" size={16} />}
      </View>
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    paddingVertical: space[12],
  },
  control: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderRadius: 6,
    borderColor: color.border.control,
    backgroundColor: color.bg.surface,
  },
  checked: {
    borderColor: color.bg.inverse,
    backgroundColor: color.bg.inverse,
  },
  controlDisabled: {
    borderColor: color.border.default,
    backgroundColor: color.bg.disabled,
  },
  label: {
    ...textStyle('bodyS'),
    color: color.text.primary,
  },
  labelDisabled: {
    color: color.text.disabled,
  },
});
