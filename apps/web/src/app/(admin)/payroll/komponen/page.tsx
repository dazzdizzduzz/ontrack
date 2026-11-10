import type { Metadata } from 'next';
import { SalaryList } from '@/features/admin/payroll/SalaryList';

export const metadata: Metadata = { title: 'Komponen Gaji · On-Track' };

/** W54 · Komponen gaji per karyawan. */
export default function SalaryListPage() {
  return <SalaryList />;
}
