import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AdminSidebar } from '@/features/admin/AdminSidebar';
import { PayrollProvider } from '@/features/admin/payroll/PayrollProvider';
import { TaskProvider } from '@/features/task/TaskProvider';

/**
 * Data contoh task dan payroll dipasang di tingkat admin agar Dashboard (F13), Task Board, dan
 * Payroll membaca status yang sama selama sesi.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell sidebar={<AdminSidebar />}>
      <TaskProvider>
        <PayrollProvider>{children}</PayrollProvider>
      </TaskProvider>
    </AppShell>
  );
}
