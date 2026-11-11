import type { Metadata } from 'next';
import { PayslipDistribution } from '@/features/admin/payroll/PayslipDistribution';

export const metadata: Metadata = { title: 'Slip Gaji Oktober · On-Track' };

/** W67 · Status pengiriman slip gaji setelah payroll disetujui. */
export default function PayslipDistributionPage() {
  return <PayslipDistribution />;
}
