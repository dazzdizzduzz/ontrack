import type { ReactNode } from 'react';
import { AuthShell } from '@/features/auth/AuthShell';

export default function AdminAuthLayout({ children }: { children: ReactNode }) {
  return <AuthShell portal="admin">{children}</AuthShell>;
}
