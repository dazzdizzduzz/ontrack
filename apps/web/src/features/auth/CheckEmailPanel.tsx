'use client';

import { RESEND_RESET_SECONDS, formatCountdown, maskEmail } from '@on-track/core';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button, ButtonLink } from '@/components/ui/Button';
import { AuthHeading, AuthIconBadge, AuthStack, BackToLoginLink } from './AuthParts';
import { authHref, type Portal } from './portals';

/** W20 / KW04 · Cek Email */
export function CheckEmailPanel({ portal, email }: { portal: Portal; email: string }) {
  const [seconds, setSeconds] = useState(RESEND_RESET_SECONDS);
  const counting = seconds > 0;

  useEffect(() => {
    if (!counting) return;
    const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [counting]);

  return (
    <AuthStack>
      <BackToLoginLink portal={portal} />
      <AuthIconBadge portal={portal} icon="mail" />
      <AuthHeading title="Cek email kamu">
        Tautan reset sudah dikirim ke {maskEmail(email)}. Klik tautan di email untuk membuat kata
        sandi baru.
      </AuthHeading>
      <Alert tone="info" title="Belum menerima email?">
        Cek folder Spam/Promosi. Tautan kedaluwarsa dalam 30 menit.
      </Alert>
      <ButtonLink
        fullWidth
        href={`${authHref(portal, 'kata-sandi-baru')}?email=${encodeURIComponent(email)}`}
      >
        Buka tautan (demo)
        <Image src="/icons/arrow-right-inverse.svg" alt="" width={20} height={20} unoptimized />
      </ButtonLink>
      {counting ? (
        <Button fullWidth disabled>
          Kirim ulang dalam {formatCountdown(seconds)}
        </Button>
      ) : (
        <Button fullWidth variant="secondary" onClick={() => setSeconds(RESEND_RESET_SECONDS)}>
          Kirim ulang tautan
        </Button>
      )}
    </AuthStack>
  );
}
