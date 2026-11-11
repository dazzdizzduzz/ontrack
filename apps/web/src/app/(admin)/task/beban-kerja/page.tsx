import type { Metadata } from 'next';
import { WorkloadReport, type WorkloadPreview } from '@/features/admin/dashboard/WorkloadReport';

export const metadata: Metadata = { title: 'Laporan Beban Kerja · On-Track' };

type PageProps = { searchParams: Promise<{ state?: string }> };

const previews: WorkloadPreview[] = ['detail', 'alihkan'];

/** W11. Contoh lewat `?state=`: `detail` (W71) dan `alihkan` (W102). */
export default async function WorkloadPage({ searchParams }: PageProps) {
  const { state } = await searchParams;
  const preview = previews.find((name) => name === state);
  return <WorkloadReport key={preview} preview={preview} />;
}
