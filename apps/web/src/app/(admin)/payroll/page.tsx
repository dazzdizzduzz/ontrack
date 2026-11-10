import { redirect } from 'next/navigation';

/** Payroll (W07) dibuat di F11; sementara menu Payroll membuka komponen gaji (F10). */
export default function PayrollPage() {
  redirect('/payroll/komponen');
}
