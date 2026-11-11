import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { LeadSidebar } from '@/features/admin/LeadSidebar';
import { TaskProvider } from '@/features/task/TaskProvider';

/** Tampilan Team Lead (W72). MOCK: belum ada pemeriksaan peran; nanti dari klaim JWT. */
export default function LeadLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell sidebar={<LeadSidebar />}>
      <TaskProvider>{children}</TaskProvider>
    </AppShell>
  );
}
