import type { Metadata } from 'next';
import { EmployeeForm } from '@/features/admin/employees/EmployeeForm';

export const metadata: Metadata = { title: 'Edit Karyawan · On-Track' };

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ state?: string }>;
};

/** W27. `?state=gagal` (W88) menampilkan toast gagal menyimpan. */
export default async function EditEmployeePage({ params, searchParams }: PageProps) {
  const [{ id }, { state }] = await Promise.all([params, searchParams]);
  return <EmployeeForm key={state} id={id} previewSaveFailed={state === 'gagal'} />;
}
