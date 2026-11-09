import { NewPasswordForm } from '@/features/auth/NewPasswordForm';
import { portals } from '@/features/auth/portals';

type PageProps = { searchParams: Promise<{ email?: string }> };

export default async function NewPasswordPage({ searchParams }: PageProps) {
  const { email } = await searchParams;
  return <NewPasswordForm portal="karyawan" email={email ?? portals.karyawan.sampleEmail} />;
}
