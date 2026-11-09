'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useReducer, type FormEvent } from 'react';
import {
  MAX_LOGIN_ATTEMPTS as MAX_ATTEMPTS,
  formatCountdown,
  initialLoginAttempts,
  isDemoCredentials,
  loginAttemptsReducer,
  loginPreviews,
  type LoginPreview,
} from '@on-track/core';
import { Alert } from '@/components/ui/Alert';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { PasswordField, TextField } from '@/components/ui/Field';
import { AuthHeading, AuthNote, AuthStack } from './AuthParts';
import styles from './LoginForm.module.css';
import { authHref, portals, type Portal } from './portals';

type LoginFormProps = { portal: Portal; preview?: LoginPreview };

export function LoginForm({ portal, preview }: LoginFormProps) {
  const router = useRouter();
  const { login, sampleEmail } = portals[portal];
  const resetHref = authHref(portal, 'lupa-kata-sandi');
  const [{ attempts, lockSeconds }, dispatch] = useReducer(
    loginAttemptsReducer,
    preview ? loginPreviews[preview] : initialLoginAttempts,
  );
  const locked = lockSeconds > 0;
  const failed = attempts > 0;
  const countdown = formatCountdown(lockSeconds);

  useEffect(() => {
    if (!locked) return;
    const timer = setInterval(() => dispatch('tick'), 1000);
    return () => clearInterval(timer);
  }, [locked]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) return;
    const data = new FormData(event.currentTarget);
    // MOCK: akun demo hanya aktif di development. Ganti dengan API saat kontrak auth ada.
    const demo =
      process.env.NODE_ENV === 'development' &&
      login.demoHome &&
      isDemoCredentials(String(data.get('email')), String(data.get('password')));
    if (demo && login.demoHome) router.push(login.demoHome);
    else dispatch('failed');
  }

  return (
    <form onSubmit={handleSubmit}>
      <AuthStack>
        {failed ? (
          <h1 className={styles.title}>{login.title}</h1>
        ) : (
          <AuthHeading title={login.title}>{login.subtitle}</AuthHeading>
        )}

        {locked && (
          <Alert tone="danger" title="Akun dikunci sementara">
            {MAX_ATTEMPTS} kali salah kata sandi. Coba lagi dalam{' '}
            <span role="timer">{countdown}</span> atau atur ulang kata sandi.
          </Alert>
        )}
        {failed && !locked && (
          <Alert tone="warning" title="Email atau kata sandi salah">
            Sisa {MAX_ATTEMPTS - attempts} percobaan lagi. Setelah {MAX_ATTEMPTS} kali salah, akun
            dikunci 15 menit.
          </Alert>
        )}

        <TextField
          label="Email kantor"
          helper=" "
          name="email"
          type="email"
          autoComplete="username"
          placeholder="nama@studiotigapagi.com"
          required
          defaultValue={preview ? sampleEmail : undefined}
        />
        <PasswordField
          label="Kata sandi"
          helper="Sesi berakhir setelah 30 menit tidak aktif"
          error={failed ? `Kata sandi salah (${attempts}/${MAX_ATTEMPTS} percobaan)` : undefined}
          name="password"
          autoComplete="current-password"
          placeholder="Masukkan kata sandi"
          required
          defaultValue={preview ? 'contoh12' : undefined}
        />

        {!failed && (
          <div className={styles.options}>
            <Checkbox label="Ingat saya" name="remember" />
            <ButtonLink variant="ghost" href={resetHref}>
              Lupa kata sandi?
            </ButtonLink>
          </div>
        )}

        <Button type="submit" fullWidth disabled={locked}>
          {locked ? `Masuk (${countdown})` : 'Masuk'}
          {!failed && (
            <Image src="/icons/arrow-right-inverse.svg" alt="" width={20} height={20} unoptimized />
          )}
        </Button>

        {failed ? (
          <ButtonLink variant="secondary" fullWidth href={resetHref}>
            Atur ulang kata sandi
          </ButtonLink>
        ) : (
          <AuthNote>{login.note}</AuthNote>
        )}
      </AuthStack>
    </form>
  );
}
