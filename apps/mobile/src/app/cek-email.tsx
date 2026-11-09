import { useLocalSearchParams } from 'expo-router';

import { CheckEmailScreen } from '@/features/auth/CheckEmailScreen';

export default function CheckEmailRoute() {
  const { email } = useLocalSearchParams<{ email?: string }>();

  return <CheckEmailScreen email={email ?? 'daze@studiotigapagi.com'} />;
}
