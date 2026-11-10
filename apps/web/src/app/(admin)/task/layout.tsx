import type { ReactNode } from 'react';
import { TaskProvider } from '@/features/task/TaskProvider';

/** Task Board dan Proyek berbagi data contoh agar proyek baru langsung bisa dipilih di form task. */
export default function TaskLayout({ children }: { children: ReactNode }) {
  return <TaskProvider>{children}</TaskProvider>;
}
