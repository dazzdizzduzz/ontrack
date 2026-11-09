import type { Metadata } from 'next';
import { RolesPermissions } from '@/features/admin/RolesPermissions';

export const metadata: Metadata = { title: 'Peran & Hak Akses · On-Track' };

type PageProps = { searchParams: Promise<{ state?: string }> };

/**
 * W18. `?state=tersimpan` (W73) dan `?state=gagal` (W74) membuka hasil simpan
 * untuk ditinjau selama belum ada API.
 */
export default async function RolesPermissionsPage({ searchParams }: PageProps) {
  const { state } = await searchParams;
  return <RolesPermissions preview={state === 'tersimpan' || state === 'gagal' ? state : undefined} />;
}
