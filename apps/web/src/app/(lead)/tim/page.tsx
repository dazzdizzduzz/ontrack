import type { Metadata } from 'next';
import { TeamLeadDashboard } from '@/features/admin/dashboard/TeamLeadDashboard';

export const metadata: Metadata = { title: 'Ringkasan Tim · On-Track' };

/** W72 · Dashboard Team Lead (tanpa payroll). */
export default function TeamDashboardPage() {
  return <TeamLeadDashboard />;
}
