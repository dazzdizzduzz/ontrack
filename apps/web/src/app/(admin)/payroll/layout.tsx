import type { ReactNode } from 'react';
import { PayrollProvider } from '@/features/admin/payroll/PayrollProvider';

export default function PayrollLayout({ children }: { children: ReactNode }) {
  return <PayrollProvider>{children}</PayrollProvider>;
}
