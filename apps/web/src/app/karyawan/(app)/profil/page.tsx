import { redirect } from 'next/navigation';

/** Web karyawan belum punya halaman profil di Figma; menu Profil membuka jadwal & lokasi. */
export default function ProfilePage() {
  redirect('/karyawan/profil/jadwal-lokasi');
}
