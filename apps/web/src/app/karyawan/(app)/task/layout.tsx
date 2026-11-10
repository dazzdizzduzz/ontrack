import type { ReactNode } from 'react';
import { TaskProvider } from '@/features/task/TaskProvider';

export default function MyTaskLayout({ children }: { children: ReactNode }) {
  return <TaskProvider>{children}</TaskProvider>;
}
