import { sampleTeamLead } from '@on-track/core';
import { AppSidebar, type SidebarItem } from '@/components/layout/AppSidebar';

/** W72: Team Lead tanpa menu Payroll dan Karyawan (RBAC). */
const items: SidebarItem[] = [
  { href: '/tim', label: 'Dashboard', icon: 'nav-grid', activeIcon: 'nav-grid-active' },
  { href: '/kehadiran', label: 'Kehadiran', icon: 'nav-clock', activeIcon: 'nav-clock-active' },
  { href: '/task', label: 'Task', icon: 'nav-task', activeIcon: 'nav-task-active' },
  { href: '/izin', label: 'Izin & Cuti', icon: 'nav-calendar', activeIcon: 'nav-calendar-active' },
];

export function LeadSidebar() {
  const { name, role, initials } = sampleTeamLead;
  return <AppSidebar tenant="Studio Tigapagi" items={items} user={{ name, role, initials, profileHref: '/profil' }} />;
}
