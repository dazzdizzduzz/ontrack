import type { Metadata } from 'next';
import { EmployeeForm } from '@/features/admin/employees/EmployeeForm';

export const metadata: Metadata = { title: 'Tambah Karyawan · On-Track' };

type PageProps = { searchParams: Promise<{ state?: string }> };

/** W16. `?state=validasi` (W28) membuka contoh form dengan kesalahan. */
export default async function AddEmployeePage({ searchParams }: PageProps) {
  const { state } = await searchParams;
  return <EmployeeForm previewInvalid={state === 'validasi'} />;
}
