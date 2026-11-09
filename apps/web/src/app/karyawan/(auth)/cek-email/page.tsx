import { CheckEmailPanel } from '@/features/auth/CheckEmailPanel';
import { portals } from '@/features/auth/portals';

type PageProps = { searchParams: Promise<{ email?: string }> };

export default async function CheckEmailPage({ searchParams }: PageProps) {
  const { email } = await searchParams;
  return <CheckEmailPanel portal="karyawan" email={email ?? portals.karyawan.sampleEmail} />;
}
