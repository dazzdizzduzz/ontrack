import { checkPassword } from '@on-track/core';
import { color, radius, space } from '@on-track/tokens';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import { textStyle } from '@/theme/text';
import { AuthScreen } from './AuthScreen';

function Rule({ label, met }: { label: string; met: boolean }) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}, ${met ? 'terpenuhi' : 'belum terpenuhi'}`}
      style={styles.rule}
    >
      <Icon name={met ? 'check-list' : 'close'} size={16} />
      <Text style={[styles.ruleText, !met && styles.ruleTextUnmet]}>{label}</Text>
    </View>
  );
}

/** M11 · Kata Sandi Baru */
export function NewPasswordScreen({ email }: { email: string }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { minLength, lettersAndDigits, uppercase } = checkPassword(password);
  const passwordValid = minLength && lettersAndDigits && uppercase;
  const matches = password === confirmation;

  function handleSubmit() {
    setSubmitted(true);
    if (passwordValid && matches) router.replace('/kata-sandi-berhasil');
  }

  return (
    <AuthScreen
      appBarTitle="Kata Sandi Baru"
      footer={<Button fullWidth label="Simpan kata sandi" onPress={handleSubmit} />}
    >
      <Alert tone="success" title="Email terverifikasi">
        Silakan buat kata sandi baru untuk {email}.
      </Alert>
      <PasswordField
        label="Kata sandi baru"
        helper="Minimal 8 karakter"
        error={submitted && !passwordValid ? 'Kata sandi belum memenuhi syarat' : undefined}
        value={password}
        onChangeText={setPassword}
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <PasswordField
        label="Ulangi kata sandi"
        helper="Harus sama dengan kata sandi baru"
        error={submitted && !matches ? 'Kata sandi tidak sama' : undefined}
        value={confirmation}
        onChangeText={setConfirmation}
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <View style={styles.rules}>
        <Rule label="Minimal 8 karakter" met={minLength} />
        <Rule label="Mengandung huruf dan angka" met={lettersAndDigits} />
        <Rule label="Mengandung huruf besar" met={uppercase} />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  rules: {
    gap: space[8],
    padding: space[16],
    borderRadius: radius.md,
    backgroundColor: color.bg.subtle,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  ruleText: {
    ...textStyle('bodyS'),
    color: color.text.primary,
  },
  ruleTextUnmet: {
    color: color.text.secondary,
  },
});
