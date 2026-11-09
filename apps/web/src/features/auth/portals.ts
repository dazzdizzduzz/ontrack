/**
 * Teks dan rute auth per portal. Web admin (W09, W19–W25) dan web karyawan
 * (KW01–KW07, KW09) memakai komponen yang sama dan hanya berbeda di sini.
 *
 * `brand.stats` sengaja berupa ilustrasi statis dan JANGAN disambungkan ke API:
 * panel ini tampil sebelum login, sehingga data asli akan terlihat oleh siapa saja.
 */
export const portals = {
  admin: {
    basePath: '',
    sampleEmail: 'hrd@studiotigapagi.com',
    /** Figma web karyawan memusatkan ikon dan tautan kembali; web admin rata kiri. */
    centerIcons: false,
    brand: {
      headline: 'Kehadiran, task, dan payroll tim — real-time dalam satu dashboard.',
      subline: 'Dipakai Studio Tigapagi untuk 16 karyawan.',
      stats: [
        { value: '13/16', label: 'hadir hari ini' },
        { value: '1', label: 'task overdue' },
        { value: 'Rp 118 jt', label: 'payroll Oktober' },
      ],
    },
    login: {
      title: 'Masuk ke dashboard',
      subtitle: 'Untuk HRD, CEO/Owner, dan Team Lead.',
      note: 'Belum punya akun perusahaan? Daftarkan tenant (segera hadir).',
      /** Dashboard admin dikerjakan di F13; sementara login demo membuka Data Karyawan (F01). */
      demoHome: '/data-karyawan',
    },
    forgotNote: 'Tidak punya akses ke email kantor? Hubungi HRD atau Owner tenant.',
    changed: {
      body: 'Demi keamanan, semua sesi lain di perangkat berbeda sudah dikeluarkan. Silakan masuk dengan kata sandi baru.',
      cta: 'Masuk ke dashboard',
    },
    expired: {
      body: 'Demi keamanan data karyawan dan gaji, sesi otomatis berakhir setelah 30 menit tidak aktif. Perubahan yang belum disimpan tidak ikut hilang dari draft.',
    },
  },
  karyawan: {
    basePath: '/karyawan',
    sampleEmail: 'daze@studiotigapagi.com',
    centerIcons: true,
    brand: {
      headline: 'Absen, ajukan izin, dan cek slip gaji langsung dari browser.',
      subline: 'Portal karyawan Studio Tigapagi · gunakan email kantor kamu.',
      stats: [
        { value: '08:52', label: 'jam masuk kemarin' },
        { value: '9 hari', label: 'sisa cuti' },
        { value: '2 task', label: 'hari ini' },
      ],
    },
    login: {
      title: 'Masuk ke On-Track',
      subtitle: 'Untuk karyawan · absen, izin, task, dan slip gaji.',
      note: 'Absen lewat web memerlukan izin lokasi & kamera di browser.',
      demoHome: '/karyawan/beranda',
    },
    forgotNote: 'Tidak punya akses ke email kantor? Hubungi HRD Studio Tigapagi.',
    changed: {
      body: 'Semua sesi di perangkat lain sudah dikeluarkan. Silakan masuk dengan kata sandi baru.',
      cta: 'Masuk ke On-Track',
    },
    expired: {
      body: 'Demi keamanan data pribadi dan slip gaji kamu, sesi berakhir setelah 30 menit tidak aktif.',
    },
  },
} as const;

export type Portal = keyof typeof portals;

export const authHref = (portal: Portal, path: string) => `${portals[portal].basePath}/${path}`;
