import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { AccessDenied } from '@/features/access/AccessDenied';
import { StaffSidebar } from '@/features/access/StaffSidebar';

export const metadata: Metadata = { title: 'Akses ditolak · On-Track' };

type PageProps = { searchParams: Promise<{ modul?: string; kode?: string }> };

/**
 * W08 · 403. MOCK: belum ada pengecekan peran; saat integrasi, middleware mengarahkan peran
 * employee yang membuka /payroll ke sini dengan `?modul=payroll&kode=<incident_code>`.
 */
export default async function AccessDeniedPage({ searchParams }: PageProps) {
  const { modul, kode } = await searchParams;
  return (
    <AppShell sidebar={<StaffSidebar />}>
      <AccessDenied module={modul} code={kode} />
    </AppShell>
  );
}
