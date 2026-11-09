import { sampleLeaveSyncAttendance, type AttendanceDay, type MonthPeriod } from '@on-track/core';


/**
 * MOCK: rekap kehadiran contoh dari Figma W05 (September 2026, 16 karyawan; 6 tampil). Nanti
 * dihitung server per periode. Riwayat harian (W37) hanya ada untuk Dhais Alfa Rysy, dari
 * data contoh `@on-track/core` yang juga dipakai M15 dan KW16.
 */
export type TodayStatus = 'hadir' | 'terlambat' | 'sakit' | 'wfh';

export type RekapRow = {
  id: string;
  name: string;
  /** Inisial avatar bila bukan huruf awal nama (Figma: "AR" untuk Ari Devananda K.). */
  initials?: string;
  division: string;
  hadir: number;
  terlambat: number;
  izin: number;
  alpha: number;
  /** Total jam kerja bulan ini, dalam jam. */
  hours: number;
  today: TodayStatus;
};

export const rekapRows: RekapRow[] = [
  { id: 'daze', name: 'Dhais Alfa Rysy', division: 'Design', hadir: 19, terlambat: 2, izin: 1, alpha: 0, hours: 172, today: 'hadir' },
  { id: 'komang', name: 'I Komang Agus S.', division: 'Developer', hadir: 21, terlambat: 0, izin: 0, alpha: 0, hours: 170, today: 'hadir' },
  { id: 'khamdafa', name: 'Khamdafa W.', division: 'Design', hadir: 19, terlambat: 1, izin: 1, alpha: 0, hours: 153, today: 'sakit' },
  { id: 'made', name: 'Made Nandana P.', division: 'Developer', hadir: 21, terlambat: 0, izin: 0, alpha: 0, hours: 168, today: 'hadir' },
  { id: 'ari', name: 'Ari Devananda K.', initials: 'AR', division: 'Developer', hadir: 18, terlambat: 3, izin: 0, alpha: 0, hours: 146, today: 'terlambat' },
  { id: 'dewa', name: 'Dewa Made Danny I.', initials: 'DD', division: 'Developer', hadir: 20, terlambat: 0, izin: 1, alpha: 0, hours: 160, today: 'wfh' },
];

/** Karyawan yang dihitung di W05 tetapi tidak ada di data contoh ("6 dari 16"). */
export const ROWS_NOT_LISTED = 10;

export const rekapPeriod = {
  label: 'September 2026',
  range: '01–30/09/2026',
  short: 'Sep2026',
  /** Data rekap dihitung sampai tanggal ini (W05). */
  until: '30/09/2026',
};

/** Kartu ringkasan W05, angka Figma untuk seluruh 16 karyawan. */
export const rekapStats = [
  { label: 'Tingkat kehadiran', value: '94%', note: 'naik 2% dari Agustus' },
  { label: 'Terlambat', value: '6', note: 'total 74 menit' },
  { label: 'Izin / Cuti / Sakit', value: '4', note: '3 cuti · 1 sakit' },
  { label: 'Alpha', value: '1', note: 'perlu tindak lanjut HRD' },
];

export const todayBadges: Record<TodayStatus, { tone: 'success' | 'warning' | 'neutral'; label: string }> = {
  hadir: { tone: 'success', label: 'Hadir' },
  terlambat: { tone: 'warning', label: 'Terlambat' },
  sakit: { tone: 'neutral', label: 'Sakit' },
  wfh: { tone: 'neutral', label: 'WFH' },
};

export const rekapDivisions = ['Design', 'Developer', 'Marketing', 'Finance', 'Manajemen'];

/** Profil W37 untuk karyawan yang punya riwayat contoh. */
export type RekapProfile = {
  schedule: string;
  office: string;
  /** Riwayat contoh per periode; bawaan memakai riwayat Dhais (M15, KW16). */
  attendance?: (period: MonthPeriod) => AttendanceDay[];
  defaultPeriod?: MonthPeriod;
  /** W44: banner sinkron otomatis dari pengajuan yang disetujui (FR-16). */
  leaveSync?: { title: string; body: string };
};

export const rekapProfiles: Record<string, RekapProfile> = {
  daze: { schedule: 'Reguler 09.00–17.00', office: 'Kantor Sanur' },
  // MOCK W44: kondisi setelah cuti 06–08/10 disetujui di W41.
  made: {
    schedule: 'Reguler 09.00–17.00',
    office: 'Kantor Sanur',
    attendance: ({ year, month }) => (year === 2026 && month === 10 ? sampleLeaveSyncAttendance : []),
    defaultPeriod: { year: 2026, month: 10 },
    leaveSync: {
      title: 'Tersinkron otomatis dari pengajuan cuti',
      body: '06–08/10 dicatat sebagai Cuti setelah disetujui 01/10/2026 14:05 oleh Ananda Sartana. Tidak dihitung Alpha.',
    },
  },
};

/** Pembuat ekspor contoh W39. */
export const sampleExporter = 'Ananda Sartana';
