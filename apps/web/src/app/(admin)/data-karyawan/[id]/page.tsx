import type { Metadata } from 'next';
import { EmployeeDetail, type DetailPreview } from '@/features/admin/employees/EmployeeDetail';

export const metadata: Metadata = { title: 'Detail Karyawan · On-Track' };

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ state?: string; aksi?: string }>;
};

const previews: DetailPreview[] = ['nonaktifkan', 'disimpan', 'nonaktif', 'aktifkan', 'diaktifkan'];

/**
 * W26. Pratinjau lewat `?state=`: `nonaktifkan` (W29), `disimpan` (W87), `nonaktif` (W90),
 * `aktifkan` (W91), dan `diaktifkan` (W92). `?aksi=nonaktifkan` datang dari menu W81.
 */
export default async function EmployeeDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, { state, aksi }] = await Promise.all([params, searchParams]);
  const preview = previews.find((name) => name === state);
  return (
    <EmployeeDetail
      key={`${preview}-${aksi}`}
      id={id}
      preview={preview}
      openDeactivate={aksi === 'nonaktifkan'}
    />
  );
}
