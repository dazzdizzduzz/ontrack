import { color, fontFamily, radius, size, space, typography } from '@on-track/tokens';
import { useState, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { textStyle } from '@/theme/text';
import { Icon } from './Icon';

type FieldProps = Omit<TextInputProps, 'style' | 'secureTextEntry'> & {
  label: string;
  /** Teks bantuan. Teks kosong (" ") hanya menjaga ruang baris, sesuai Figma. */
  helper?: string;
  /** Pesan galat; menggantikan helper dan menandai field tidak valid. */
  error?: string;
  /** Teks kanan di bawah field, misalnya penghitung "27/200" (M05). */
  meta?: string;
};

function FieldShell({
  label,
  helper,
  error,
  meta,
  trailing,
  secureTextEntry,
  ...inputProps
}: FieldProps & { trailing?: ReactNode; secureTextEntry?: boolean }) {
  const [focused, setFocused] = useState(false);
  const message = error ?? helper;
  const borderWidth = error || focused ? 2 : 1;
  const borderColor = error
    ? color.status.dangerFg
    : focused
      ? color.border.focus
      : color.border.control;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.control,
          inputProps.multiline && styles.controlMultiline,
          {
            borderWidth,
            borderColor,
            // Tinggi field tetap saat border menebal, supaya layar tidak bergeser.
            paddingHorizontal: space[16] - (borderWidth - 1),
            paddingVertical: space[12] - (borderWidth - 1),
          },
        ]}
      >
        <TextInput
          {...inputProps}
          style={[styles.input, inputProps.multiline && styles.inputMultiline]}
          accessibilityLabel={label}
          accessibilityHint={message?.trim() ? message : undefined}
          secureTextEntry={secureTextEntry}
          selectionColor={color.text.primary}
          placeholderTextColor={color.text.secondary}
          onFocus={(event) => {
            setFocused(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            inputProps.onBlur?.(event);
          }}
        />
        {trailing}
      </View>
      {(message !== undefined || meta !== undefined) && (
        <View style={styles.messageRow}>
          <Text style={[styles.message, styles.messageText, error ? styles.messageError : null]}>
            {message ?? ''}
          </Text>
          {meta !== undefined && <Text style={styles.message}>{meta}</Text>}
        </View>
      )}
    </View>
  );
}

export function TextField(props: FieldProps) {
  return <FieldShell {...props} />;
}

export function PasswordField(props: FieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <FieldShell
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
      secureTextEntry={!visible}
      trailing={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          onPress={() => setVisible((value) => !value)}
          style={styles.toggle}
        >
          <Icon name={visible ? 'eye' : 'eye-off'} size={20} />
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  field: {
    alignSelf: 'stretch',
    gap: space[8],
  },
  label: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  controlMultiline: {
    alignItems: 'flex-start',
    minHeight: 112,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space[8],
  },
  messageText: {
    flex: 1,
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: color.bg.surface,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 24,
    padding: 0,
    color: color.text.primary,
    fontFamily: `${fontFamily}_400Regular`,
    fontSize: typography.bodyM.size,
    // Preview web: fokus sudah ditandai border field, bukan outline bawaan browser.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  // Area sentuh 44px tanpa mengubah tinggi field yang mengikuti ikon 20px.
  toggle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: size.iconTarget,
    height: size.iconTarget,
    margin: -space[12],
  },
  message: {
    ...textStyle('caption'),
    minHeight: typography.caption.size * typography.caption.lineHeight,
    color: color.text.secondary,
  },
  messageError: {
    color: color.status.dangerFg,
  },
});
