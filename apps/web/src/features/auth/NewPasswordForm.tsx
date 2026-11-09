'use client';

import { checkPassword } from '@on-track/core';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/ui/Field';
import { AuthHeading, AuthIconBadge, AuthStack } from './AuthParts';
import styles from './NewPasswordForm.module.css';
import { authHref, type Portal } from './portals';

function Rule({ label, met }: { label: string; met: boolean }) {
  return (
    <li className={met ? styles.rule : `${styles.rule} ${styles.ruleUnmet}`}>
      <Image
        src={met ? '/icons/check-rule.svg' : '/icons/close.svg'}
        alt={met ? 'Terpenuhi:' : 'Belum terpenuhi:'}
        width={16}
        height={16}
        unoptimized
      />
      {label}
    </li>
  );
}

/** W21 / KW05 · Buat Kata Sandi Baru */
export function NewPasswordForm({ portal, email }: { portal: Portal; email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { minLength, lettersAndDigits, uppercase } = checkPassword(password);
  const passwordValid = minLength && lettersAndDigits && uppercase;
  const matches = password === confirmation;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (passwordValid && matches) router.replace(authHref(portal, 'kata-sandi-berhasil'));
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <AuthStack>
        <AuthIconBadge portal={portal} icon="lock" />
        <AuthHeading title="Buat kata sandi baru">Untuk akun {email}</AuthHeading>
        <PasswordField
          label="Kata sandi baru"
          helper="Minimal 8 karakter"
          error={submitted && !passwordValid ? 'Kata sandi belum memenuhi syarat' : undefined}
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <PasswordField
          label="Ulangi kata sandi"
          helper="Harus sama dengan kata sandi baru"
          error={submitted && !matches ? 'Kata sandi tidak sama' : undefined}
          name="confirmation"
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
        />
        <ul className={styles.rules}>
          <Rule label="Minimal 8 karakter" met={minLength} />
          <Rule label="Mengandung huruf dan angka" met={lettersAndDigits} />
          <Rule label="Mengandung huruf besar" met={uppercase} />
        </ul>
        <Button type="submit" fullWidth>
          Simpan kata sandi
        </Button>
      </AuthStack>
    </form>
  );
}
