'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { AuthHeading, AuthIconBadge, AuthNote, AuthStack, BackToLoginLink } from './AuthParts';
import { authHref, portals, type Portal } from './portals';

/** W19 / KW03 · Lupa Kata Sandi */
export function ForgotPasswordForm({ portal }: { portal: Portal }) {
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get('email')).trim();
    router.push(`${authHref(portal, 'cek-email')}?email=${encodeURIComponent(email)}`);
  }

  return (
    <form onSubmit={handleSubmit}>
      <AuthStack>
        <BackToLoginLink portal={portal} />
        <AuthIconBadge portal={portal} icon="key" />
        <AuthHeading title="Lupa kata sandi?">
          Masukkan email kantor yang terdaftar. Kami akan mengirim tautan untuk membuat kata sandi
          baru.
        </AuthHeading>
        <TextField
          label="Email kantor"
          helper="Tautan berlaku 30 menit"
          name="email"
          type="email"
          autoComplete="username"
          required
        />
        <Button type="submit" fullWidth>
          Kirim tautan reset
          <Image src="/icons/send.svg" alt="" width={20} height={20} unoptimized />
        </Button>
        <AuthNote>{portals[portal].forgotNote}</AuthNote>
      </AuthStack>
    </form>
  );
}
