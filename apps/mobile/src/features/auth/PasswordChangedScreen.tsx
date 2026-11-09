import { router, Stack } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { AuthHeading, AuthIconBadge, AuthScreen } from './AuthScreen';

function backToLogin() {
  if (router.canDismiss()) router.dismissAll();
  router.replace('/login');
}

/** M25 · Kata Sandi Berhasil Diubah */
export function PasswordChangedScreen() {
  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <AuthScreen
        footer={
          <Button
            fullWidth
            label="Masuk sekarang"
            icon="arrow-right-inverse"
            onPress={backToLogin}
          />
        }
      >
        <AuthIconBadge name="check-badge" />
        <AuthHeading title="Kata sandi berhasil diubah">
          Demi keamanan, semua sesi lain di perangkat berbeda sudah dikeluarkan. Silakan masuk
          dengan kata sandi baru.
        </AuthHeading>
      </AuthScreen>
    </>
  );
}
