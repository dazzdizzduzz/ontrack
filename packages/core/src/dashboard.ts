import { isOverdue, type Task, type TaskPerson } from './tasks';

/**
 * Dashboard kehadiran, task & beban kerja (F13 · FR-21, FR-29, FR-30, US-08 AC-1).
 * Draf kontrak: GET /dashboard/summary, /dashboard/attendance/live, /reports/workload.
 */

export type DashboardRange = 'hari' | 'minggu' | 'bulan';

export const dashboardRangeLabels: Record<DashboardRange, string> = {
  hari: 'Hari ini',
  minggu: 'Minggu ini',
  bulan: 'Bulan ini',
};

export type AttendanceKpis = {
  present: number;
  late: number;
  lateAverageMinutes: number;
  leave: number;
  leaveNote: string;
  notCheckedIn: number;
  total: number;
};

export const presentPercent = (kpis: AttendanceKpis) => Math.round((kpis.present / kpis.total) * 100);

export type LiveStatus = 'hadir' | 'terlambat' | 'wfh' | 'sakit';

export const liveStatusLabels: Record<LiveStatus, string> = {
  hadir: 'Hadir',
  terlambat: 'Terlambat',
  wfh: 'WFH',
  sakit: 'Sakit',
};

export type LiveActivity = {
  id: string;
  name: string;
  initials: string;
  status: LiveStatus;
  detail: string;
};

/** Titik di peta ilustrasi W01, posisi dalam persen lebar/tinggi peta. */
export type MapPin = {
  initials: string;
  kind: 'hadir' | 'terlambat' | 'luar_area';
  x: number;
  y: number;
};

export const sampleDashboardContext = {
  date: 'Kamis, 01/10/2026',
  tenant: 'Studio Tigapagi',
  office: 'Kantor Sanur',
  radiusMeters: 100,
  workHours: '09.00–17.00 WITA',
  toleranceUntil: '09.10',
};

/** MOCK W01: kondisi 09:15, satu karyawan belum absen. */
export const sampleAttendanceKpis: AttendanceKpis = {
  present: 13,
  late: 1,
  lateAverageMinutes: 12,
  leave: 1,
  leaveNote: 'Sakit · disetujui',
  notCheckedIn: 1,
  total: 16,
};

/** MOCK: ringkasan minggu/bulan untuk tab periode (rata-rata harian). */
export const sampleRangeKpis: Record<Exclude<DashboardRange, 'hari'>, AttendanceKpis> = {
  minggu: { present: 14, late: 1, lateAverageMinutes: 9, leave: 1, leaveNote: 'rata-rata per hari', notCheckedIn: 0, total: 16 },
  bulan: { present: 14, late: 2, lateAverageMinutes: 11, leave: 1, leaveNote: 'rata-rata per hari', notCheckedIn: 0, total: 16 },
};

export const sampleLiveActivities: LiveActivity[] = [
  { id: 'putu', name: 'I Putu Ari D.', initials: 'AR', status: 'terlambat', detail: 'Clock-in · 09:14 · Kantor Sanur' },
  { id: 'komang', name: 'I Komang Agus S.', initials: 'IK', status: 'hadir', detail: 'Clock-in · 08:58 · Kantor Sanur' },
  { id: 'daze', name: 'Dhais Alfa Rysy', initials: 'DA', status: 'hadir', detail: 'Clock-in · 08:52 · Kantor Sanur' },
  { id: 'dewa', name: 'Dewa Made Danny I.', initials: 'WF', status: 'wfh', detail: 'Clock-in WFH · 08:50 · 6,4 km' },
  { id: 'khamdafa', name: 'Khamdafa W.', initials: 'KW', status: 'hadir', detail: 'Clock-in · 08:47 · Kantor Sanur' },
  { id: 'made', name: 'Made Nandana P.', initials: 'MN', status: 'hadir', detail: 'Clock-in · 08:45 · Kantor Sanur' },
  { id: 'sri', name: 'Sri Rahayu', initials: 'SR', status: 'sakit', detail: 'Izin sakit disetujui HRD · 08:30' },
];

export const sampleMapPins: MapPin[] = [
  { initials: 'IK', kind: 'hadir', x: 44, y: 26 },
  { initials: 'IP', kind: 'hadir', x: 33, y: 36 },
  { initials: 'DA', kind: 'hadir', x: 54, y: 34 },
  { initials: 'KW', kind: 'hadir', x: 38, y: 48 },
  { initials: 'MN', kind: 'hadir', x: 50, y: 58 },
  { initials: 'YP', kind: 'hadir', x: 57, y: 63 },
  { initials: 'AR', kind: 'terlambat', x: 66, y: 30 },
  { initials: 'WF', kind: 'luar_area', x: 94, y: 74 },
];

/** MOCK W02: event live berikutnya (Bagus clock-in terlambat 09:16). */
export const sampleLiveEvent = {
  activity: { id: 'bagus', name: 'Bagus Wiranata', initials: 'BW', status: 'terlambat', detail: 'Clock-in · 09:16 · Kantor Sanur' } satisfies LiveActivity,
  pin: { initials: 'BW', kind: 'terlambat', x: 26, y: 52 } satisfies MapPin,
  lateAverageMinutes: 10,
};

/** Terapkan satu clock-in terlambat ke ringkasan (W01 → W02). */
export function applyLateCheckIn(kpis: AttendanceKpis, lateAverageMinutes: number): AttendanceKpis {
  return { ...kpis, late: kpis.late + 1, lateAverageMinutes, notCheckedIn: Math.max(0, kpis.notCheckedIn - 1) };
}

/** "13 di dalam area · 1 di luar area": yang sudah clock-in dikurangi yang di luar geofence. */
export function areaCounts(kpis: AttendanceKpis, pins: MapPin[]) {
  const outside = pins.filter((pin) => pin.kind === 'luar_area').length;
  return { inside: kpis.present + kpis.late - outside, outside };
}

/** W70 · karyawan yang belum absen setelah batas toleransi. */
export const sampleNotCheckedIn = [
  {
    id: 'bagus',
    name: 'Bagus Wiranata',
    initials: 'BW',
    division: 'Marketing',
    schedule: 'Reguler 09.00–17.00',
    lastActive: 'terakhir aktif 30/09',
    leaveToday: 'Tidak ada',
    reminderAt: '09:15',
  },
];

export type WeekBar = { label: string; present: number; late: number; today?: boolean };

/** MOCK: kehadiran 7 hari kerja terakhir (W69/W72), hadir tepat waktu + terlambat. */
export const sampleWeekBars: WeekBar[] = [
  { label: 'Kam', present: 14, late: 1 },
  { label: 'Jum', present: 15, late: 1 },
  { label: 'Sen', present: 13, late: 2 },
  { label: 'Sel', present: 15, late: 0 },
  { label: 'Rab', present: 13, late: 2 },
  { label: 'Kam', present: 16, late: 0 },
  { label: 'Hari ini', present: 13, late: 1, today: true },
];

/** W72 · Ringkasan tim untuk Team Lead (tanpa data payroll). */
export const sampleTeamLead = {
  id: 'komang',
  name: 'I Komang Agus S.',
  initials: 'IK',
  role: 'Team Lead · Developer',
  team: 'Developer',
  memberIds: ['komang', 'made', 'putu', 'dewa'],
  /** Nama panggilan di daftar "Perlu perhatian" (Figma: "Ari", bukan "Putu"). */
  nicknames: { 'I Putu Ari D.': 'Ari', 'Made Nandana P.': 'Made' } as Record<string, string>,
  kpis: { present: 3, late: 1, lateAverageMinutes: 12, leave: 0, leaveNote: '—', notCheckedIn: 0, total: 4 } satisfies AttendanceKpis,
  lateNote: 'Ari · 12 menit',
  weekBars: [
    { label: 'Kam', present: 4, late: 0 },
    { label: 'Jum', present: 3, late: 1 },
    { label: 'Sen', present: 4, late: 0 },
    { label: 'Sel', present: 4, late: 0 },
    { label: 'Rab', present: 3, late: 1 },
    { label: 'Kam', present: 4, late: 0 },
    { label: 'Hari ini', present: 3, late: 1, today: true },
  ] satisfies WeekBar[],
};

// ---------- Ringkasan & beban kerja task (W69, W72, W11, W71) ----------

export function taskSummary(tasks: Task[], now: string) {
  const active = tasks.filter((task) => task.status !== 'done');
  return {
    active: active.length,
    overdue: active.filter((task) => isOverdue(task, now)),
    done: tasks.filter((task) => task.status === 'done').length,
  };
}

export type Workload = {
  person: TaskPerson;
  total: number;
  done: number;
  active: number;
  overdue: number;
  utilization: number;
  hours?: number;
};

/** MOCK: utilisasi = jam kerja tercatat ÷ kapasitas bulan ini; nanti dari /reports/workload. */
export const sampleUtilization: Record<string, { percent: number; hours: number }> = {
  daze: { percent: 92, hours: 161 },
  komang: { percent: 85, hours: 149 },
  bagus: { percent: 80, hours: 140 },
  putu: { percent: 75, hours: 131 },
  made: { percent: 72, hours: 126 },
  khamdafa: { percent: 64, hours: 112 },
};

/** Utilisasi di atas batas ini memunculkan peringatan "Beban kerja tinggi" (W71). */
export const HIGH_UTILIZATION = 90;

export function workloads(tasks: Task[], people: TaskPerson[], now: string): Workload[] {
  return people.map((person) => {
    const own = tasks.filter((task) => task.assigneeId === person.id);
    const done = own.filter((task) => task.status === 'done').length;
    const overdue = own.filter((task) => task.status !== 'done' && isOverdue(task, now)).length;
    const usage = sampleUtilization[person.id];
    return {
      person,
      total: own.length,
      done,
      active: own.length - done,
      overdue,
      utilization: usage?.percent ?? 0,
      hours: usage?.hours,
    };
  });
}

export const teamUtilization = (list: Workload[]) =>
  list.length ? Math.round(list.reduce((sum, item) => sum + item.utilization, 0) / list.length) : 0;

/** "6 task · 4 aktif · 1 overdue" (teks pendamping batang W11). */
export function workloadLabel(item: Workload): string {
  const parts = [`${item.total} task`, `${item.active} aktif`];
  if (item.overdue) parts.push(`${item.overdue} overdue`);
  return parts.join(' · ');
}
