import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AdminSidebar } from '@/features/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AppShell sidebar={<AdminSidebar />}>{children}</AppShell>;
}
