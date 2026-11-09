import type { Metadata } from 'next';
import { ProjectList } from '@/features/admin/task/ProjectList';

export const metadata: Metadata = { title: 'Proyek · On-Track' };

type PageProps = { searchParams: Promise<{ state?: string }> };

/** W47 · Proyek. `?state=baru` = W48 (dialog proyek baru). */
export default async function ProjectsPage({ searchParams }: PageProps) {
  const { state } = await searchParams;
  const preview = state === 'baru' ? 'baru' : undefined;
  return <ProjectList key={preview} preview={preview} />;
}
