import { useLocalSearchParams } from 'expo-router';

import { NewPasswordScreen } from '@/features/auth/NewPasswordScreen';

export default function NewPasswordRoute() {
  const { email } = useLocalSearchParams<{ email?: string }>();

  return <NewPasswordScreen email={email ?? 'daze@studiotigapagi.com'} />;
}
