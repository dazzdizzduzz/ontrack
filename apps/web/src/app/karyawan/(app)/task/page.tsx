import type { Metadata } from 'next';
import { MyTasks } from '@/features/karyawan/task/MyTasks';

export const metadata: Metadata = { title: 'Task Saya · On-Track' };

type PageProps = { searchParams: Promise<{ state?: string }> };

/** KW21 · Task Saya. `?state=detail` membuka KW22 untuk "Revisi logo JBM v3". */
export default async function MyTaskPage({ searchParams }: PageProps) {
  const { state } = await searchParams;
  const preview = state === 'detail' ? 'detail' : undefined;
  return <MyTasks key={preview} preview={preview} />;
}
