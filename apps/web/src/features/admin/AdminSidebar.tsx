import { AppSidebar, type SidebarItem } from '@/components/layout/AppSidebar';

// Semua menu sudah punya halaman (Dashboard F13).
const items: SidebarItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'nav-grid', activeIcon: 'nav-grid-active' },
  { href: '/kehadiran', label: 'Kehadiran', icon: 'nav-clock', activeIcon: 'nav-clock-active' },
  { href: '/task', label: 'Task', icon: 'nav-task', activeIcon: 'nav-task-active' },
  { href: '/izin', label: 'Izin & Cuti', icon: 'nav-calendar', activeIcon: 'nav-calendar-active' },
  { href: '/payroll', label: 'Payroll', icon: 'nav-wallet', activeIcon: 'nav-wallet-active' },
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
