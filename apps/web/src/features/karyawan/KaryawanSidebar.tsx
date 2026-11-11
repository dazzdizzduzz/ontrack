import { AppSidebar, type SidebarItem } from '@/components/layout/AppSidebar';
import { sampleEmployee } from './sampleData';

export const karyawanNavItems: SidebarItem[] = [
  { href: '/karyawan/beranda', label: 'Beranda', icon: 'nav-home', activeIcon: 'nav-home-active' },
  { href: '/karyawan/absensi', label: 'Absensi', icon: 'nav-clock', activeIcon: 'nav-clock-active' },
  { href: '/karyawan/izin', label: 'Izin & Cuti', icon: 'nav-calendar', activeIcon: 'nav-calendar-active' },
  { href: '/karyawan/task', label: 'Task', icon: 'nav-task', activeIcon: 'nav-task-active' },
  { href: '/karyawan/slip-gaji', label: 'Slip Gaji', icon: 'nav-wallet', activeIcon: 'nav-wallet-active' },
  { href: '/karyawan/profil', label: 'Profil', icon: 'nav-user', activeIcon: 'nav-user-active' },
];

export function KaryawanSidebar() {
  const { tenant, name, role, initials } = sampleEmployee;

  return (
    <AppSidebar
      tenant={tenant}
      items={karyawanNavItems}
      user={{ name, role, initials, profileHref: '/karyawan/profil' }}
    />
  );
}
