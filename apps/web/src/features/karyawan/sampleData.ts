/** Data contoh dari Figma KW08; belum tersambung ke API. */
export const sampleEmployee = {
  tenant: 'Studio Tigapagi',
  name: 'Dhais Alfa Rysy',
  greetingName: 'Daze',
  initials: 'DA',
  role: 'Karyawan · Design',
};

export const sampleBeranda = {
  stats: [
    { label: 'Hadir bulan ini', value: '18', meta: 'hari · 1 kali terlambat' },
    { label: 'Sisa cuti tahunan', value: '9', meta: 'dari 12 hari' },
  ],
  tasks: [
    { client: 'Klien JBM', title: 'Revisi logo JBM v3', due: '01/10 · 17.00', overdue: true },
    {
      client: 'Klien Teneriffe',
      title: 'Wireframe landing Teneriffe',
      due: '02/10 · 12.00',
      overdue: false,
    },
  ],
  leaves: [
    {
      title: 'Cuti tahunan',
      detail: '06–08/10/2026 · 3 hari',
      status: 'Menunggu',
      tone: 'warning',
    },
    { title: 'Sakit', detail: '25/09/2026 · ½ hari', status: 'Disetujui', tone: 'success' },
  ],
  slip: {
    title: 'Slip gaji September terbit',
    detail: 'Gaji bersih Rp 7.845.000 · hanya terlihat oleh kamu',
  },
} as const;

/** Data contoh dari Figma KW10; belum tersambung ke API. */
export const sampleMySchedule = {
  hours: '09.00 – 17.00',
  scheduleSummary: 'Reguler · Senin–Jumat · WITA',
  days: [
    { name: 'Senin', working: true },
    { name: 'Selasa', working: true },
    { name: 'Rabu', working: true },
    { name: 'Kamis', working: true },
    { name: 'Jumat', working: true },
    { name: 'Sabtu', working: false },
    { name: 'Minggu', working: false },
  ],
  tolerance: '10 menit',
  overtimeAfter: '30 menit setelah jam pulang',
  overtimeLimit: '3 jam',
  locationName: 'Kantor Sanur',
  address: 'Jl. Danau Tamblingan No. 226, Sanur, Denpasar',
  radiusMeters: 100,
  selfieRequired: true,
};
