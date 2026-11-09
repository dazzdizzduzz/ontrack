/** Data contoh dari Figma W17; belum tersambung ke API. */
export const dayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export type WorkSchedule = {
  id: string;
  name: string;
  /** Jumlah karyawan contoh di luar yang dipilih lewat form. */
  memberCount: number;
  start: string;
  end: string;
  tolerance: string;
  days: string[];
  overtimeAfter: string;
  overtimeLimit: string;
  allowRemote: boolean;
};

export type OfficeLocation = {
  id: string;
  name: string;
  address: string;
  coordinates: string;
  radiusMeters: number;
  selfieRequired: boolean;
};

export const initialSchedules: WorkSchedule[] = [
  {
    id: 'reguler',
    name: 'Reguler',
    memberCount: 8,
    start: '09.00',
    end: '17.00',
    tolerance: '10 menit',
    days: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'],
    overtimeAfter: '30 menit',
    overtimeLimit: '3 jam',
    allowRemote: true,
  },
];

export const initialLocations: OfficeLocation[] = [
  {
    id: 'sanur',
    name: 'Kantor Sanur',
    address: 'Jl. Danau Tamblingan No. 226, Sanur',
    coordinates: '-8.6923, 115.2621',
    radiusMeters: 100,
    selfieRequired: true,
  },
];

/** Contoh W31 untuk `?state=tambah-jadwal`. */
export const sampleSchedule = {
  name: 'Shift Sabtu',
  start: '09.00',
  end: '14.00',
  days: ['Sab'],
  memberIds: ['sri', 'khamdafa', 'komang'],
};

/** Contoh W32 untuk `?state=tambah-lokasi`. */
export const sampleLocation: OfficeLocation = {
  id: 'kuta',
  name: 'Kantor Kuta (cabang)',
  address: 'Jl. Raya Kuta No. 88, Badung',
  coordinates: '-8.7180, 115.1690',
  radiusMeters: 150,
  selfieRequired: true,
};

export const scheduleLabel = (schedule: Pick<WorkSchedule, 'name' | 'start' | 'end'>) =>
  `${schedule.name} · ${schedule.start}–${schedule.end}`;

/** "09.00" atau "9:00" -> menit sejak tengah malam; format lain menghasilkan null. */
function toMinutes(time: string): number | null {
  const match = time.trim().match(/^(\d{1,2})[.:](\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

export function isEndAfterStart(start: string, end: string): boolean {
  const from = toMinutes(start);
  const to = toMinutes(end);
  return from !== null && to !== null && to > from;
}

/** Penggeser radius linear 25–500 m, kelipatan 5 m (keputusan tim desain). */
export const RADIUS_MIN = 25;
export const RADIUS_MAX = 500;
export const RADIUS_STEP = 5;
