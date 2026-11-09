import { isValidEmail } from '@on-track/core';
import { router } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { AuthHeading, AuthIconBadge, AuthScreen } from './AuthScreen';

/** M10 · Lupa Kata Sandi */
export function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();

  function handleSubmit() {
    if (!isValidEmail(email)) {
      setError('Masukkan email yang valid');
      return;
    }
    setError(undefined);
    router.push({ pathname: '/cek-email', params: { email: email.trim() } });
  }

  return (
    <AuthScreen
      appBarTitle="Lupa Kata Sandi"
      footer={
        <>
          <Button
            fullWidth
            label="Kirim tautan reset"
            icon="arrow-right-inverse"
            onPress={handleSubmit}
          />
          <Button
            fullWidth
            variant="ghost"
            label="Kembali ke login"
            onPress={() => router.replace('/login')}
          />
        </>
      }
    >
      <AuthIconBadge name="key" />
      <AuthHeading title="Atur ulang kata sandi">
        Masukkan email kantor yang terdaftar. Kami akan mengirim tautan untuk membuat kata sandi
        baru.
      </AuthHeading>
      <TextField
        label="Email"
        helper="Tautan berlaku 30 menit"
        error={error}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="username"
      />
    </AuthScreen>
  );
}
