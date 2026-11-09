import {
  MAX_LOGIN_ATTEMPTS,
  formatCountdown,
  initialLoginAttempts,
  isValidEmail,
  loginAttemptsReducer,
  loginPreviews,
  type LoginPreview,
} from '@on-track/core';
import { color, space } from '@on-track/tokens';
import { router } from 'expo-router';
import { useEffect, useReducer, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { PasswordField, TextField } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import { textStyle } from '@/theme/text';
import { isDemoLogin } from './mockAuth';

const goToReset = () => router.push('/lupa-kata-sandi');

export function LoginScreen({ preview }: { preview?: LoginPreview }) {
  const { top, bottom } = useSafeAreaInsets();
  const [{ attempts, lockSeconds }, dispatch] = useReducer(
    loginAttemptsReducer,
    preview ? loginPreviews[preview] : initialLoginAttempts,
  );
  const [email, setEmail] = useState(preview ? 'daze@studiotigapagi.com' : '');
  const [password, setPassword] = useState(preview ? 'contoh12' : '');
  const [remember, setRemember] = useState(false);
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();

  const locked = lockSeconds > 0;
  const failed = attempts > 0;
  const countdown = formatCountdown(lockSeconds);

  useEffect(() => {
    if (!locked) return;
    const timer = setInterval(() => dispatch('tick'), 1000);
    return () => clearInterval(timer);
  }, [locked]);

  function handleSubmit() {
    const nextEmailError = isValidEmail(email) ? undefined : 'Masukkan email yang valid';
    const nextPasswordError = password ? undefined : 'Kata sandi wajib diisi';
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) return;
    if (isDemoLogin(email, password)) router.replace('/beranda');
    else dispatch('failed');
  }

  const attemptsError = failed
    ? `Kata sandi salah (${attempts}/${MAX_LOGIN_ATTEMPTS} percobaan)`
    : undefined;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          failed && styles.contentFailed,
          {
            paddingTop: Math.max(space[48], top + space[16]),
            paddingBottom: Math.max(space[32], bottom),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logo}>
          <Icon name="logo-mark" size={14} />
          <Text style={styles.logoText}>On-Track</Text>
        </View>

        {!failed && <View style={styles.spacer} />}

        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>
            Masuk ke akun
          </Text>
          <Text style={styles.subtitle}>Absen, izin, dan pantau task dalam satu aplikasi.</Text>
        </View>

        {locked && (
          <Alert tone="danger" title="Akun dikunci sementara" announce>
            {MAX_LOGIN_ATTEMPTS} kali salah kata sandi. Coba lagi dalam {countdown} atau atur ulang
            kata sandi.
          </Alert>
        )}
        {failed && !locked && (
          <Alert tone="warning" title="Email atau kata sandi salah" announce>
            Sisa {MAX_LOGIN_ATTEMPTS - attempts} percobaan lagi. Setelah {MAX_LOGIN_ATTEMPTS} kali
            salah, akun dikunci 15 menit.
          </Alert>
        )}

        <View style={styles.form}>
          <TextField
            label="Email"
            helper="Gunakan email kantor"
            error={emailError}
            value={email}
            onChangeText={setEmail}
            placeholder="nama@studiotigapagi.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="username"
          />
          <PasswordField
            label="Kata sandi"
            helper=" "
            error={passwordError ?? attemptsError}
            value={password}
            onChangeText={setPassword}
            placeholder="Masukkan kata sandi"
            autoComplete="current-password"
            textContentType="password"
          />
          <View style={styles.options}>
            <Checkbox
              label="Ingat saya"
              checked={remember}
              onChange={setRemember}
              disabled={locked}
            />
            {!failed && <Button variant="ghost" label="Lupa kata sandi?" onPress={goToReset} />}
          </View>
        </View>

        <Button
          fullWidth
          label={locked ? `Masuk (${countdown})` : 'Masuk'}
          icon={failed ? undefined : 'arrow-right-inverse'}
          disabled={locked}
          onPress={handleSubmit}
        />
        {failed && (
          <Button fullWidth variant="secondary" label="Atur ulang kata sandi" onPress={goToReset} />
        )}

        <Text style={styles.note}>
          Dengan masuk, kamu menyetujui penggunaan lokasi & kamera untuk absensi sesuai UU PDP No.
          27/2022.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.surface,
  },
  content: {
    flexGrow: 1,
    gap: space[32],
    paddingHorizontal: space[24],
  },
  contentFailed: {
    gap: space[20],
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  logoText: {
    ...textStyle('headingH2'),
    color: color.text.primary,
  },
  spacer: {
    flex: 1,
  },
  heading: {
    gap: space[8],
  },
  title: {
    ...textStyle('displayL'),
    color: color.text.primary,
  },
  subtitle: {
    ...textStyle('bodyM'),
    color: color.text.secondary,
  },
  form: {
    gap: space[20],
  },
  options: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  note: {
    ...textStyle('caption'),
    color: color.text.secondary,
    textAlign: 'center',
  },
});
