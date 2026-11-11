import type { Metadata } from 'next';
import { CeoDashboard } from '@/features/admin/dashboard/CeoDashboard';

export const metadata: Metadata = { title: 'Dashboard · On-Track' };

/** W69 · Ringkasan hari ini (CEO/HRD), halaman pertama setelah login admin. */
export default function DashboardPage() {
  return <CeoDashboard />;
}
