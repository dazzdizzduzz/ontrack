import type { Metadata } from 'next';
import { TaskBoard, type TaskBoardPreview } from '@/features/admin/task/TaskBoard';

export const metadata: Metadata = { title: 'Task Board · On-Track' };

type PageProps = { searchParams: Promise<{ state?: string; view?: string }> };

const previews: TaskBoardPreview[] = ['baru', 'validasi', 'dibuat', 'review', 'selesai', 'revisi', 'lihat', 'kosong'];

/**
 * W06 · Task Board (Kanban). `?view=daftar` = W46. Contoh lewat `?state=`: `baru` (W10),
 * `validasi` (W49), `dibuat` (W50), `review` (W51), `selesai` (W52), `revisi` (W53), `lihat` (W99), dan
 * `kosong` (W106).
 */
export default async function TaskPage({ searchParams }: PageProps) {
  const { state, view } = await searchParams;
  const preview = previews.find((name) => name === state);
  return (
    <TaskBoard
      key={`${preview}-${view}`}
      preview={preview}
      view={view === 'daftar' ? 'daftar' : 'kanban'}
    />
  );
}
