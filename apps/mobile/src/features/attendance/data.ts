import {
  clockInStatus,
  clockOutSummary,
  evaluateGeofence,
  parseClockTime,
  type ClockOutSummary,
  type GeofenceResult,
} from '@on-track/core';

import type { DeviceLocation } from './useDeviceLocation';

/**
 * Jam dan GPS memakai perangkat. MOCK: jadwal, titik kantor, dan selfie masih contoh
 * Figma F03; jadwal dan titik kantor nanti dari API (lokasi kerja di F02), kamera lewat expo-camera.
 * Saat integrasi, server mencatat jam clock-in sendiri dan menghitung ulang geofence.
 */
export const sampleSchedule = { start: '09.00', end: '17.00', toleranceMinutes: 10, zone: 'WITA' };

/**
 * Mode tes (hanya development): posisi perangkat di mana pun dianggap titik kantor, supaya
 * clock-in bisa dicoba di luar Sanur. Atur `EXPO_PUBLIC_TEST_ANY_LOCATION` di `.env.local`.
 */
export const TEST_ANY_LOCATION = __DEV__ && process.env.EXPO_PUBLIC_TEST_ANY_LOCATION === 'true';

/** Zona waktu tenant contoh (WITA). Nanti dari pengaturan tenant. */
export const TENANT_TIME_ZONE = 'Asia/Makassar';

/** Koordinat sama dengan lokasi Kantor Sanur di data F02 (W31). */
export const sampleOffice = {
  name: 'Kantor Sanur',
  radiusMeters: 100,
  point: { latitude: -8.6923, longitude: 115.2621 },
};

export const sampleUser = { firstName: 'Daze' };

/** Ringkasan bulan berjalan dan task di M02. */
export const sampleSummary = { month: 'Oktober', present: 18, late: 1, leaveLeft: 9 };

export const sampleTasks = [
  { title: 'Revisi logo JBM v3', meta: 'Klien JBM · tenggat 17.00', status: 'overdue' },
  { title: 'Wireframe landing Teneriffe', meta: 'Klien Teneriffe · tenggat besok', status: 'progress' },
] as const;

/** Tanggal contoh Figma: Kamis, 01/10/2026. Jam tiap skenario ada di bawah. */
export const sampleDate = 'Kamis, 01/10/2026';

/**
 * Skenario pratinjau lewat `?state=` di /clock-in. Tanpa parameter, alurnya tepat waktu
 * dan di dalam area (M03 → M27 → M04).
 */
export type ClockInScenario =
  | 'dalam-area'
  | 'gps-lemah'
  | 'luar-area'
  | 'wajah-gagal'
  | 'terlambat'
  | 'terlambat-lama'
  | 'mencari'
  | 'izin-ditolak'
  | 'gps-mati'
  | 'lokasi-gagal'
  | 'offline';

export const clockInScenarios: ClockInScenario[] = [
  'dalam-area',
  'gps-lemah',
  'luar-area',
  'wajah-gagal',
  'terlambat',
  'terlambat-lama',
  'mencari',
  'izin-ditolak',
  'gps-mati',
  'lokasi-gagal',
  'offline',
];

type ScenarioSample = {
  /** Jarak ke titik kantor dan akurasi GPS, dalam meter. */
  distance: number;
  accuracy: number;
  /** Jam saat selfie diambil; percobaan pertama yang gagal memakai `failedAt`. */
  time: string;
  failedAt?: string;
  /** Lokasi belum siap dinilai (M52–M55). */
  pending?: Exclude<DeviceLocation, { state: 'siap' }>;
};

export const scenarioSamples: Record<ClockInScenario, ScenarioSample> = {
  'dalam-area': { distance: 42, accuracy: 8, time: '08:52' },
  'gps-lemah': { distance: 42, accuracy: 180, time: '08:52' },
  'luar-area': { distance: 1200, accuracy: 12, time: '08:52' },
  'wajah-gagal': { distance: 42, accuracy: 8, time: '09:14', failedAt: '09:11' },
  terlambat: { distance: 42, accuracy: 8, time: '09:14' },
  'terlambat-lama': { distance: 42, accuracy: 8, time: '15:19' },
  mencari: { distance: 0, accuracy: 0, time: '08:52', pending: { state: 'mencari' } },
  'izin-ditolak': {
    distance: 0,
    accuracy: 0,
    time: '08:52',
    pending: { state: 'ditolak', canAskAgain: false },
  },
  'gps-mati': { distance: 0, accuracy: 0, time: '08:52', pending: { state: 'mati' } },
  'lokasi-gagal': { distance: 0, accuracy: 0, time: '08:52', pending: { state: 'gagal' } },
  // M64: GPS tetap terbaca tanpa internet; absen disimpan di HP lalu dikirim saat online.
  offline: { distance: 42, accuracy: 8, time: '08:52' },
};

export function geofenceOf(sample: Pick<ScenarioSample, 'distance' | 'accuracy'>): GeofenceResult {
  return evaluateGeofence({ ...sample, radius: sampleOffice.radiusMeters });
}

export type ClockInRecord = {
  /** "Kamis, 01/10/2026" */
  date: string;
  time: string;
  distance: number;
  status: ReturnType<typeof clockInStatus>;
  /** M64: tersimpan di HP saat offline, menunggu dikirim. */
  queued?: boolean;
};

/** Status otomatis dari jadwal F02 (FR-08). */
export function recordFor(time: string, distance: number, date = sampleDate): ClockInRecord {
  return {
    date,
    time,
    distance,
    status: clockInStatus({
      clockInMinutes: parseClockTime(time) ?? 0,
      startMinutes: parseClockTime(sampleSchedule.start) ?? 0,
      toleranceMinutes: sampleSchedule.toleranceMinutes,
    }),
  };
}

export const scheduleLabel = `${sampleSchedule.start} – ${sampleSchedule.end} ${sampleSchedule.zone}`;

/**
 * Skenario pratinjau lewat `?state=` di /clock-out: `lembur` (M32 → M14), `tepat-waktu`
 * (→ M50, tanpa lembur), `pulang-cepat` (M34 → M33), dan `luar-area` (M35). Clock-in contoh untuk semuanya: 08:52, Hadir.
 */
export type ClockOutScenario = 'lembur' | 'tepat-waktu' | 'pulang-cepat' | 'luar-area';

export const clockOutScenarios: ClockOutScenario[] = [
  'lembur',
  'tepat-waktu',
  'pulang-cepat',
  'luar-area',
];

export const clockOutSamples: Record<
  ClockOutScenario,
  { distance: number; accuracy: number; time: string; note?: string }
> = {
  lembur: { distance: 42, accuracy: 8, time: '17:44' },
  'tepat-waktu': { distance: 42, accuracy: 8, time: '17:05' },
  'pulang-cepat': { distance: 35, accuracy: 8, time: '15:30', note: 'Kontrol ke dokter gigi' },
  'luar-area': { distance: 850, accuracy: 12, time: '17:44' },
};

/** Clock-in contoh bila /clock-out dibuka tanpa clock-in (lewat URL atau pratinjau). */
export const sampleClockIn = recordFor(scenarioSamples['dalam-area'].time, 38);

export type ClockOutRecord = ClockOutSummary & {
  date: string;
  /** Jam clock-in dan clock-out, "08:52" dan "17:44". */
  clockInTime: string;
  /** Status clock-in (Hadir / Terlambat), tampil di M14. */
  clockInStatus: ClockInRecord['status'];
  time: string;
  distance: number;
  /** Catatan pulang cepat (M34), terlihat oleh atasan. */
  note?: string;
};

/** Ringkasan jam kerja dari clock-in sampai `time`, memakai jam pulang di jadwal. */
export function summaryFor(clockIn: ClockInRecord, time: string): ClockOutSummary {
  return clockOutSummary({
    clockInMinutes: parseClockTime(clockIn.time) ?? 0,
    clockOutMinutes: parseClockTime(time) ?? 0,
    endMinutes: parseClockTime(sampleSchedule.end) ?? 0,
  });
}

export function clockOutRecordFor(
  clockIn: ClockInRecord,
  time: string,
  distance: number,
  note?: string,
): ClockOutRecord {
  return {
    ...summaryFor(clockIn, time),
    date: clockIn.date,
    clockInTime: clockIn.time,
    clockInStatus: clockIn.status,
    time,
    distance,
    note: note?.trim() || undefined,
  };
}
