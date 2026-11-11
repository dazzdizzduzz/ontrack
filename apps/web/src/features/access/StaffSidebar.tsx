import { AppSidebar } from '@/components/layout/AppSidebar';
import { karyawanNavItems } from '@/features/karyawan/KaryawanSidebar';

/** MOCK: pengguna contoh W08 (Khamdafa W., peran employee); nanti dari klaim JWT. */
const sampleStaff = { name: 'Khamdafa W.', role: 'Karyawan · Design', initials: 'KW', profileHref: '/karyawan/profil' };

/** W08 memakai sidebar web karyawan, termasuk menu Slip Gaji. */
export function StaffSidebar() {
  return <AppSidebar tenant="Studio Tigapagi" items={karyawanNavItems} user={sampleStaff} />;
}
