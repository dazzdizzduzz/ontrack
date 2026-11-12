import { clockOutSummary, parseClockTime } from './attendance';
import type { LeaveType } from './leave';

/** Status satu hari kerja di riwayat (M15, KW16, W05, W37). */
export type DayStatus = 'hadir' | 'terlambat' | 'izin' | 'alpha';

export type AttendanceDay = {
  /** "2026-09-30" */
  date: string;
  status: DayStatus;
  /** "08:51"; kosong untuk izin dan alpha. */
  clockIn?: string;
  clockOut?: string;
  /** Jarak ke titik kantor dan akurasi GPS saat clock-in / clock-out, dalam meter. */
  inDistance?: number;
  inAccuracy?: number;
  outDistance?: number;
  outAccuracy?: number;
  /** Lembur yang tercatat (menit); 0 bila tidak ada. */
  overtimeMinutes: number;
  /** F07 (FR-16): diisi bila hari ini ditulis otomatis dari pengajuan yang disetujui (W44). */
  leaveType?: LeaveType;
};

export type MonthSummary = Record<DayStatus, number>;

export type MonthPeriod = { year: number; month: number };

const WEEKDAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const WEEKDAYS_LONG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/** Judul kolom kalender M15/KW16, mulai Senin. */
export const CALENDAR_WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const pad = (value: number) => String(value).padStart(2, '0');

/** Tanggal lokal tanpa zona waktu, supaya hari tidak bergeser di zona perangkat mana pun. */
function parts(date: string) {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  return { year, month, day, weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay() };
}

export const isoDate = (year: number, month: number, day: number) =>
  `${year}-${pad(month)}-${pad(day)}`;

/** "September 2026" */
export const formatPeriod = ({ year, month }: MonthPeriod) => `${MONTHS[month - 1]} ${year}`;

/** "Rab, 30/09" (daftar M15) */
export function formatDayShort(date: string): string {
  const { day, month, weekday } = parts(date);
  return `${WEEKDAYS_SHORT[weekday]}, ${pad(day)}/${pad(month)}`;
}

/** "30/09 · Rab" (tabel KW16, W37) */
export function formatDayTable(date: string): string {
  const { day, month, weekday } = parts(date);
  return `${pad(day)}/${pad(month)} · ${WEEKDAYS_SHORT[weekday]}`;
}

/** "Rabu, 30 September 2026" (M36) */
export function formatDayLong(date: string): string {
  const { day, month, year, weekday } = parts(date);
  return `${WEEKDAYS_LONG[weekday]}, ${day} ${MONTHS[month - 1]} ${year}`;
}

export const isWeekend = (date: string) => {
  const { weekday } = parts(date);
  return weekday === 0 || weekday === 6;
};

/**
 * Kalender satu bulan per minggu, Senin–Minggu. Sel kosong (null) mengisi hari sebelum
 * tanggal 1 dan setelah akhir bulan.
 */
export function calendarWeeks({ year, month }: MonthPeriod): (string | null)[][] {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstWeekday = parts(isoDate(year, month, 1)).weekday;
  const leading = (firstWeekday + 6) % 7;
  const cells: (string | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: days }, (_, index) => isoDate(year, month, index + 1)),
  ];
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7));
  return weeks;
}

export function summarize(days: AttendanceDay[]): MonthSummary {
  const summary: MonthSummary = { hadir: 0, terlambat: 0, izin: 0, alpha: 0 };
  for (const day of days) summary[day.status] += 1;
  return summary;
}

/** Menit kerja dari clock-in sampai clock-out; null bila tidak ada salah satunya. */
export function workedMinutes(day: AttendanceDay): number | null {
  if (!day.clockIn || !day.clockOut) return null;
  return clockOutSummary({
    clockInMinutes: parseClockTime(day.clockIn) ?? 0,
    clockOutMinutes: parseClockTime(day.clockOut) ?? 0,
    endMinutes: 0,
  }).workedMinutes;
}

// ---------------------------------------------------------------------------------------------
// MOCK: riwayat contoh dari Figma F05 (M15, M37, KW16, W37) sampai API riwayat absensi ada.

type Override = Partial<AttendanceDay> & { status?: DayStatus };

/** Hari kerja Senin–Jumat dalam satu bulan, sampai `lastDay` bila bulan masih berjalan. */
function sampleMonth(
  { year, month }: MonthPeriod,
  overrides: Record<number, Override>,
  lastDay?: number,
): AttendanceDay[] {
  const total = lastDay ?? new Date(Date.UTC(year, month, 0)).getUTCDate();
  const days: AttendanceDay[] = [];
  for (let day = 1; day <= total; day++) {
    const date = isoDate(year, month, day);
    if (isWeekend(date)) continue;
    // Jam contoh yang stabil per tanggal: masuk 08:45–08:59, pulang 17:00–17:12.
    const base: AttendanceDay = {
      date,
      status: 'hadir',
      clockIn: `08:${pad(45 + ((day * 7) % 15))}`,
      clockOut: `17:${pad((day * 5) % 13)}`,
      inDistance: 30 + ((day * 3) % 20),
      inAccuracy: 8,
      outDistance: 30 + ((day * 5) % 20),
      outAccuracy: 10,
      overtimeMinutes: 0,
    };
    const override = overrides[day];
    const merged = { ...base, ...override };
    if (merged.status === 'izin' || merged.status === 'alpha') {
      days.push({ date, status: merged.status, overtimeMinutes: 0 });
    } else {
      days.push(merged);
    }
  }
  return days;
}

/**
 * Periode di M37, terbaru dulu. Oktober masih berjalan (contoh Figma: 1 hari tercatat); Juni
 * 2026 sengaja tanpa catatan untuk contoh periode kosong (M57, KW28, W96).
 */
export const samplePeriods: MonthPeriod[] = [
  { year: 2026, month: 10 },
  { year: 2026, month: 9 },
  { year: 2026, month: 8 },
  { year: 2026, month: 7 },
  { year: 2026, month: 6 },
];

/** Periode tanpa catatan absensi di data contoh. */
export const sampleEmptyPeriod: MonthPeriod = { year: 2026, month: 6 };

/** Periode yang terbuka pertama kali di M15 dan KW16. */
export const sampleDefaultPeriod: MonthPeriod = { year: 2026, month: 9 };

const late = (clockIn: string, clockOut: string): Override => ({
  status: 'terlambat',
  clockIn,
  clockOut,
});

const sampleHistory: Record<string, AttendanceDay[]> = {
  '2026-10': sampleMonth(
    { year: 2026, month: 10 },
    { 1: { clockIn: '08:52', clockOut: '17:44', inDistance: 38, outDistance: 42, overtimeMinutes: 44 } },
    1,
  ),
  '2026-09': sampleMonth({ year: 2026, month: 9 }, {
    3: late('09:14', '17:08'),
    17: late('09:13', '17:05'),
    22: { status: 'izin' },
    25: { clockIn: '08:58', clockOut: '17:25' },
    28: { clockIn: '08:49', clockOut: '17:06' },
    29: { clockIn: '08:55', clockOut: '17:02' },
    30: { clockIn: '08:51', clockOut: '17:06', inDistance: 40, outDistance: 35 },
  }),
  '2026-08': sampleMonth({ year: 2026, month: 8 }, {}),
  '2026-07': sampleMonth({ year: 2026, month: 7 }, { 15: late('09:16', '17:04') }),
};

/** Riwayat satu bulan, terbaru dulu. */
export function sampleAttendance({ year, month }: MonthPeriod): AttendanceDay[] {
  return [...(sampleHistory[`${year}-${pad(month)}`] ?? [])].reverse();
}

/**
 * MOCK W44: kehadiran Made Nandana P. Oktober 2026 setelah cuti 06–08/10 disetujui. Hari cuti
 * berstatus izin (tidak dihitung alpha) dan membawa jenis pengajuannya.
 */
export const sampleLeaveSyncAttendance: AttendanceDay[] = [
  { date: '2026-10-08', status: 'izin', leaveType: 'cuti', overtimeMinutes: 0 },
  { date: '2026-10-07', status: 'izin', leaveType: 'cuti', overtimeMinutes: 0 },
  { date: '2026-10-06', status: 'izin', leaveType: 'cuti', overtimeMinutes: 0 },
  { date: '2026-10-05', status: 'hadir', clockIn: '08:55', clockOut: '17:12', overtimeMinutes: 0 },
  { date: '2026-10-02', status: 'hadir', clockIn: '08:50', clockOut: '17:00', overtimeMinutes: 0 },
  { date: '2026-10-01', status: 'hadir', clockIn: '08:57', clockOut: '17:03', overtimeMinutes: 0 },
];

// ---------------------------------------------------------------------------------------------
// M65 · Lupa clock-out kemarin.

/**
 * Hari kerja terakhir sebelum `today` yang punya clock-in tanpa clock-out, bila hari itu tepat hari
 * kerja sebelumnya. Akhir pekan dilewati, jadi Senin memeriksa Jumat.
 */
export function findMissedClockOut(days: AttendanceDay[], today: string): AttendanceDay | undefined {
  const previous = days
    .filter((day) => day.date < today && !isWeekend(day.date))
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  return previous?.clockIn && !previous.clockOut ? previous : undefined;
}

/** "Rabu, 30/09" (M65) */
export function formatDayMedium(date: string): string {
  const { day, month, weekday } = parts(date);
  return `${WEEKDAYS_LONG[weekday]}, ${pad(day)}/${pad(month)}`;
}

/** MOCK M65: Rabu 30/09 clock-in 08:47 tanpa clock-out. */
export const sampleMissedClockOutDays: AttendanceDay[] = [
  { date: '2026-09-29', status: 'hadir', clockIn: '08:50', clockOut: '17:06', overtimeMinutes: 0 },
  { date: '2026-09-30', status: 'hadir', clockIn: '08:47', overtimeMinutes: 0 },
];
