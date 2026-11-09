import { RESEND_RESET_SECONDS, formatCountdown, maskEmail } from '@on-track/core';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { AuthHeading, AuthIconBadge, AuthScreen } from './AuthScreen';

/** M24 · Cek Email */
export function CheckEmailScreen({ email }: { email: string }) {
  const [seconds, setSeconds] = useState(RESEND_RESET_SECONDS);
  const counting = seconds > 0;

  useEffect(() => {
    if (!counting) return;
    const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [counting]);

  return (
    <AuthScreen
      appBarTitle="Lupa Kata Sandi"
      footer={
        <>
          {/* MOCK: tanpa email sungguhan, tombol ini langsung membuka M11 seperti tautan di email. */}
          <Button
            fullWidth
            label="Buka aplikasi email"
            icon="arrow-right-inverse"
            onPress={() => router.push({ pathname: '/kata-sandi-baru', params: { email } })}
          />
          {counting ? (
            <Button fullWidth disabled label={`Kirim ulang dalam ${formatCountdown(seconds)}`} />
          ) : (
            <Button
              fullWidth
              variant="secondary"
              label="Kirim ulang tautan"
              onPress={() => setSeconds(RESEND_RESET_SECONDS)}
            />
          )}
        </>
      }
    >
      <AuthIconBadge name="mail" />
      <AuthHeading title="Cek email kamu">
        Tautan reset sudah dikirim ke {maskEmail(email)}. Buka tautan di email untuk membuat kata
        sandi baru.
      </AuthHeading>
      <Alert tone="info" title="Belum menerima email?">
        Cek folder Spam/Promosi. Tautan kedaluwarsa dalam 30 menit.
      </Alert>
    </AuthScreen>
  );
}
