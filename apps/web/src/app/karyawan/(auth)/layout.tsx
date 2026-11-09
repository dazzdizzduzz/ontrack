import type { ReactNode } from 'react';
import { AuthShell } from '@/features/auth/AuthShell';

export default function KaryawanAuthLayout({ children }: { children: ReactNode }) {
  return <AuthShell portal="karyawan">{children}</AuthShell>;
}
