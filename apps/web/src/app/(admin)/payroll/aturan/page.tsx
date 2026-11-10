import type { Metadata } from 'next';
import { PayrollRulesPage } from '@/features/admin/payroll/PayrollRulesPage';

export const metadata: Metadata = { title: 'Aturan Komponen Global · On-Track' };

/** W58 · Aturan komponen global. */
export default function RulesPage() {
  return <PayrollRulesPage />;
}
