import { AppSidebar, type SidebarItem } from '@/components/layout/AppSidebar';

// Ikon aktif baru ada untuk menu yang halamannya sudah dibuat (Kehadiran, Izin & Cuti, Karyawan).
const items: SidebarItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'nav-grid' },
  { href: '/kehadiran', label: 'Kehadiran', icon: 'nav-clock', activeIcon: 'nav-clock-active' },
  { href: '/task', label: 'Task', icon: 'nav-task' },
  { href: '/izin', label: 'Izin & Cuti', icon: 'nav-calendar', activeIcon: 'nav-calendar-active' },
  { href: '/payroll', label: 'Payroll', icon: 'nav-wallet' },
  { href: '/data-karyawan', label: 'Karyawan', icon: 'nav-users', activeIcon: 'nav-users-active' },
];

/** Pengguna contoh dari Figma W18; belum tersambung ke API. */
const sampleUser = {
  name: 'Ananda Sartana',
  role: 'CEO · Owner',
  initials: 'AS',
  profileHref: '/profil',
};

export function AdminSidebar() {
  return <AppSidebar tenant="Studio Tigapagi" items={items} user={sampleUser} />;
}
