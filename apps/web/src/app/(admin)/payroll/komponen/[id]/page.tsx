import type { Metadata } from 'next';
import { SalaryEditor, type SalaryPreviewState } from '@/features/admin/payroll/SalaryEditor';

export const metadata: Metadata = { title: 'Komponen Gaji Karyawan · On-Track' };

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ state?: string }> };

const previews: SalaryPreviewState[] = ['validasi', 'konfirmasi', 'tersimpan'];

/**
 * W12 · Komponen gaji karyawan, contoh /payroll/komponen/daze. `?state=`: `validasi` (W55),
 * `konfirmasi` (W57), `tersimpan` (W56).
 */
export default async function SalaryEditorPage({ params, searchParams }: PageProps) {
  const [{ id }, { state }] = await Promise.all([params, searchParams]);
  const preview = previews.find((name) => name === state);
  return <SalaryEditor key={`${id}-${preview}`} id={id} preview={preview} />;
}
