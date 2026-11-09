import {
  clockInStatus,
  clockOutSummary,
  evaluateGeofence,
  formatDistance,
  formatDuration,
  formatShortDuration,
  parseClockTime,
  type ClockInStatus,
  type ClockOutSummary,
  type GeofenceResult,
} from '@on-track/core';

/**
 * Jam dan lokasi memakai perangkat (Geolocation API). MOCK: webcam (getUserMedia), jadwal, dan
 * titik kantor masih contoh Figma KW11–KW13; `?state=` menampilkan contoh Figma apa adanya.
 * Saat integrasi, server mencatat jam clock-in sendiri dan menghitung ulang geofence.
 */
export const sampleClockIn = {
  date: 'Kamis, 01/10/2026',
  time: '08:52',
  office: 'Kantor Sanur',
  radiusMeters: 100,
  /** Sama dengan lokasi Kantor Sanur di data F02 (W31). */
  point: { latitude: -8.6923, longitude: 115.2621 },
  schedule: { start: '09.00', end: '17.00', toleranceMinutes: 10 },
};

/** Zona waktu tenant contoh (WITA). Nanti dari pengaturan tenant. */
/**
 * Mode tes (hanya development): posisi browser di mana pun dianggap titik kantor, supaya
 * clock-in bisa dicoba di luar Sanur. Atur `NEXT_PUBLIC_TEST_ANY_LOCATION` di `.env.local`.
 */
export const TEST_ANY_LOCATION =
  process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_TEST_ANY_LOCATION === 'true';

export const TENANT_TIME_ZONE = 'Asia/Makassar';

export type WebClockInScenario = 'dalam-area' | 'luar-area' | 'gps-lemah';

/** Jarak dan akurasi lokasi browser per skenario, dalam meter. */
export const webScenarios: Record<WebClockInScenario, { distance: number; accuracy: number }> = {
  'dalam-area': { distance: 42, accuracy: 8 },
  'luar-area': { distance: 1200, accuracy: 12 },
  // KW27: akurasi lokasi browser ±120 m.
  'gps-lemah': { distance: 42, accuracy: 120 },
};

export type WebGeofence = {
  result: GeofenceResult;
  distance: number;
  accuracy: number;
  distanceLabel: string;
};

/** Menilai jarak dan akurasi lokasi terhadap radius kantor. */
export function geofenceAt(reading: { distance: number; accuracy: number }): WebGeofence {
  return {
    ...reading,
    result: evaluateGeofence({ ...reading, radius: sampleClockIn.radiusMeters }),
    distanceLabel: formatDistance(reading.distance),
  };
}

export const geofenceFor = (scenario: WebClockInScenario) => geofenceAt(webScenarios[scenario]);

export type WebClockInRecord = {
  time: string;
  distance: number;
  accuracy: number;
  status: ClockInStatus;
  /** Selfie dari webcam (JPEG data URL). MOCK: belum dikirim ke server. */
  photo?: string;
};

/** Hasil clock-in. Tanpa jarak dan akurasi, memakai contoh Figma (42 m, ±8 m). */
export function recordAt(
  time: string,
  { distance, accuracy } = webScenarios['dalam-area'],
): WebClockInRecord {
  return {
    time,
    distance,
    accuracy,
    status: clockInStatus({
      clockInMinutes: parseClockTime(time) ?? 0,
      startMinutes: parseClockTime(sampleClockIn.schedule.start) ?? 0,
      toleranceMinutes: sampleClockIn.schedule.toleranceMinutes,
    }),
  };
}

export const statusLabel = (record: WebClockInRecord) =>
  record.status.status === 'hadir'
    ? 'Hadir · Tepat waktu'
    : `Terlambat · ${formatShortDuration(record.status.lateMinutes)}`;

/** Jam clock-out contoh Figma KW14/KW15, dan KW26 untuk pulang cepat. */
export const sampleClockOutTime = '17:44';
export const sampleEarlyClockOutTime = '15:30';

/** Ringkasan jam kerja dari clock-in sampai `time` (M32 / KW14). */
export function summaryAt(clockIn: WebClockInRecord, time: string): ClockOutSummary {
  return clockOutSummary({
    clockInMinutes: parseClockTime(clockIn.time) ?? 0,
    clockOutMinutes: parseClockTime(time) ?? 0,
    endMinutes: parseClockTime(sampleClockIn.schedule.end) ?? 0,
  });
}

export type WebClockOutRecord = ClockOutSummary & {
  clockInTime: string;
  time: string;
  distance: number;
  accuracy: number;
  /** Catatan pulang cepat, terlihat oleh atasan. */
  note?: string;
};

export function clockOutAt(
  clockIn: WebClockInRecord,
  time: string,
  { distance, accuracy }: { distance: number; accuracy: number },
  note?: string,
): WebClockOutRecord {
  return {
    ...summaryAt(clockIn, time),
    clockInTime: clockIn.time,
    time,
    distance,
    accuracy,
    note: note?.trim() || undefined,
  };
}

/** "44 mnt" seperti KW15; satu jam atau lebih memakai format jam ("1 j 20 m"). */
export const overtimeLabel = (minutes: number) =>
  minutes < 60 ? `${minutes} mnt` : formatDuration(minutes);
