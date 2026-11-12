import type { Metadata } from 'next';
import { sampleInvited } from '@/features/admin/employees/data';
import { EmployeeList, type EmployeeListPreview } from '@/features/admin/employees/EmployeeList';

export const metadata: Metadata = { title: 'Karyawan · On-Track' };

type PageProps = { searchParams: Promise<{ state?: string; email?: string }> };

const previews: EmployeeListPreview[] = ['cari-kosong', 'memuat'];

/**
 * W15. `?state=ditambahkan` (W30) menampilkan toast dan baris karyawan baru; `cari-kosong` (W104)
 * dan `memuat` (W107).
 */
export default async function EmployeesPage({ searchParams }: PageProps) {
  const { state, email } = await searchParams;
  const addedEmail = state === 'ditambahkan' ? (email ?? sampleInvited.email) : undefined;
  const preview = previews.find((name) => name === state);
  return <EmployeeList key={addedEmail ?? preview} addedEmail={addedEmail} preview={preview} />;
}
