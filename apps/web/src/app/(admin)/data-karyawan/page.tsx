import type { Metadata } from 'next';
import { sampleInvited } from '@/features/admin/employees/data';
import { EmployeeList } from '@/features/admin/employees/EmployeeList';

export const metadata: Metadata = { title: 'Karyawan · On-Track' };

type PageProps = { searchParams: Promise<{ state?: string; email?: string }> };

/** W15. `?state=ditambahkan` (W30) menampilkan toast dan baris karyawan baru. */
export default async function EmployeesPage({ searchParams }: PageProps) {
  const { state, email } = await searchParams;
  const addedEmail = state === 'ditambahkan' ? (email ?? sampleInvited.email) : undefined;
  return <EmployeeList key={addedEmail} addedEmail={addedEmail} />;
}
