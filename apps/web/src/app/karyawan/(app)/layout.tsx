import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { KaryawanSidebar } from '@/features/karyawan/KaryawanSidebar';

export default function KaryawanAppLayout({ children }: { children: ReactNode }) {
  return <AppShell sidebar={<KaryawanSidebar />}>{children}</AppShell>;
}
