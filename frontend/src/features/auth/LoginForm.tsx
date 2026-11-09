'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button, ButtonLink } from '@/components/ui/Button';
import { PasswordField, TextField } from '@/components/ui/Field';
import { isProblem, type Problem } from '@/lib/api/problem';
import { LOGIN_REDIRECT } from '@/lib/auth/constants';
import { AuthHeading, AuthNote, AuthStack } from './AuthParts';
import { adminLogin } from './copy';
import styles from './LoginForm.module.css';

type State = { kind: 'idle' } | { kind: 'submitting' } | { kind: 'error'; problem: Problem };

const networkProblem: Problem = {
  type: 'about:blank',
  title: 'Tidak dapat terhubung',
  status: 0,
  detail: 'Periksa koneksi internet lalu coba lagi.',
};

export function LoginForm() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'idle' });
  const submitting = state.kind === 'submitting';
  const problem = state.kind === 'error' ? state.problem : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const data = new FormData(event.currentTarget);
    setState({ kind: 'submitting' });

    try {
      // Token tidak pernah dibaca di sini: server menaruhnya di cookie httpOnly.
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: data.get('email'), password: data.get('password') }),
      });

      if (response.ok) {
        router.replace(LOGIN_REDIRECT);
        router.refresh();
        return;
      }
      const body: unknown = await response.json().catch(() => null);
      setState({
        kind: 'error',
        problem: isProblem(body)
          ? body
          : { ...networkProblem, title: 'Gagal masuk', status: response.status },
      });
    } catch {
      setState({ kind: 'error', problem: networkProblem });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <AuthStack>
        {problem ? (
          <h1 className={styles.title}>{adminLogin.title}</h1>
        ) : (
          <AuthHeading title={adminLogin.title}>{adminLogin.subtitle}</AuthHeading>
        )}

        {problem && (
          <Alert tone={problem.status === 401 ? 'warning' : 'danger'} title={problem.title}>
            {problem.detail ?? 'Coba lagi beberapa saat lagi.'}
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
        />
        <PasswordField
          label="Kata sandi"
          helper=" "
          name="password"
          autoComplete="current-password"
          placeholder="Masukkan kata sandi"
          required
        />

        <div className={styles.options}>
          <ButtonLink variant="ghost" href="/lupa-kata-sandi">
            Lupa kata sandi?
          </ButtonLink>
        </div>

        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? 'Memproses…' : 'Masuk'}
          {!submitting && (
            <Image src="/icons/arrow-right-inverse.svg" alt="" width={20} height={20} unoptimized />
          )}
        </Button>

        {!problem && <AuthNote>{adminLogin.note}</AuthNote>}
      </AuthStack>
    </form>
  );
}
