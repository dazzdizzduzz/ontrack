/**
 * Teks halaman login web admin (Figma W09). `brand.stats` sengaja berupa ilustrasi statis
 * dan JANGAN disambungkan ke API: panel ini tampil sebelum login, sehingga data asli
 * akan terlihat oleh siapa saja.
 */
export const adminLogin = {
  title: 'Masuk ke dashboard',
  subtitle: 'Untuk HRD, CEO/Owner, dan Team Lead.',
  note: 'Belum punya akun perusahaan? Daftarkan tenant (segera hadir).',
  brand: {
    headline: 'Kehadiran, task, dan payroll tim — real-time dalam satu dashboard.',
    subline: 'Dipakai Studio Tigapagi untuk 16 karyawan.',
    stats: [
      { value: '13/16', label: 'hadir hari ini' },
      { value: '1', label: 'task overdue' },
      { value: 'Rp 118 jt', label: 'payroll Oktober' },
    ],
  },
} as const;
