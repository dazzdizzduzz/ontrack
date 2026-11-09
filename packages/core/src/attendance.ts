/** Akurasi GPS terburuk yang masih diterima untuk clock-in (M29: "dibutuhkan ≤ ±50 m"). */
export const MAX_GPS_ACCURACY_METERS = 50;

export type GeoPoint = { latitude: number; longitude: number };

/** Jarak dua titik di permukaan bumi dalam meter (rumus haversine). */
export function distanceMeters(from: GeoPoint, to: GeoPoint): number {
  const earthRadius = 6_371_000;
  const rad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = rad(to.latitude - from.latitude);
  const dLon = rad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(from.latitude)) * Math.cos(rad(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

export type GeofenceResult = 'dalam-area' | 'luar-area' | 'gps-lemah';

/**
 * Urutan pengecekan mengikuti Figma F03: akurasi dulu (M29), lalu radius (M03 / M07).
 * Lokasi dengan akurasi buruk tidak dinilai di dalam atau di luar area.
 */
export function evaluateGeofence({
  distance,
  accuracy,
  radius,
}: {
  distance: number;
  accuracy: number;
  radius: number;
}): GeofenceResult {
  if (accuracy > MAX_GPS_ACCURACY_METERS) return 'gps-lemah';
  return distance <= radius ? 'dalam-area' : 'luar-area';
}

/** 42 -> "42 m", 1200 -> "1,2 km". */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = Math.round(meters / 100) / 10;
  return `${km.toLocaleString('id-ID')} km`;
}

/** "09.00" atau "9:00" -> menit sejak tengah malam; format lain menghasilkan null. */
export function parseClockTime(time: string): number | null {
  const match = time.trim().match(/^(\d{1,2})[.:](\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

export type ClockInStatus =
  | { status: 'hadir' }
  | { status: 'terlambat'; lateMinutes: number };

/**
 * Status otomatis saat clock-in (FR-08). Lewat jam masuk + toleransi = Terlambat,
 * dan keterlambatan dihitung dari jam masuk (M28: 09:14 dengan toleransi 10 menit
 * tercatat terlambat 14 menit).
 */
export function clockInStatus({
  clockInMinutes,
  startMinutes,
  toleranceMinutes,
}: {
  clockInMinutes: number;
  startMinutes: number;
  toleranceMinutes: number;
}): ClockInStatus {
  if (clockInMinutes <= startMinutes + toleranceMinutes) return { status: 'hadir' };
  return { status: 'terlambat', lateMinutes: clockInMinutes - startMinutes };
}

/** Lembur baru dihitung bila clock-out lewat jam pulang lebih dari ini (M32). */
export const OVERTIME_THRESHOLD_MINUTES = 30;
/** Batas lembur per hari (M32: "Batas lembur 3 jam/hari"). */
export const MAX_OVERTIME_MINUTES = 180;

export type ClockOutSummary = {
  /** Menit dari clock-in sampai clock-out. */
  workedMinutes: number;
  /** Menit sebelum jam pulang; 0 bila tidak pulang cepat (FR-08). */
  earlyMinutes: number;
  /** Estimasi lembur yang perlu persetujuan Team Lead (US-03); 0 bila tidak ada. */
  overtimeMinutes: number;
};

/**
 * Ringkasan clock-out (FR-07, FR-08). M32: clock-out 17:44, jam pulang 17.00 = lembur 44 menit.
 * M34: clock-out 15:30 = pulang cepat 1 j 30 m. Lewat 30 menit pertama, lembur dihitung dari
 * jam pulang, dibatasi 3 jam.
 */
export function clockOutSummary({
  clockInMinutes,
  clockOutMinutes,
  endMinutes,
}: {
  clockInMinutes: number;
  clockOutMinutes: number;
  endMinutes: number;
}): ClockOutSummary {
  const afterEnd = clockOutMinutes - endMinutes;
  // Lembur tidak boleh melebihi jam kerja: bila clock-in setelah jam pulang, dihitung dari clock-in.
  const overtime = clockOutMinutes - Math.max(endMinutes, clockInMinutes);
  return {
    workedMinutes: Math.max(0, clockOutMinutes - clockInMinutes),
    earlyMinutes: Math.max(0, -afterEnd),
    overtimeMinutes:
      afterEnd > OVERTIME_THRESHOLD_MINUTES && overtime > 0
        ? Math.min(overtime, MAX_OVERTIME_MINUTES)
        : 0,
  };
}

/** 532 -> "8 j 52 m", 487 -> "8 j 07 m", 44 -> "44 m", 120 -> "2 j" (M08, M32, M15, W34). */
export function formatDuration(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} m`;
  return minutes === 0 ? `${hours} j` : `${hours} j ${String(minutes).padStart(2, '0')} m`;
}

/** 14 -> "14 menit", 379 -> "6 j 19 m" (badge keterlambatan M28/M51 dan lembur M32). */
export function formatShortDuration(total: number): string {
  return total < 60 ? `${total} menit` : formatDuration(total);
}

/** Date -> "08:52" (format jam di kartu Clock In). */
export function formatClock(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    // h23, bukan hour12: false: sebagian engine menulis tengah malam sebagai "24:00".
    hourCycle: 'h23',
    timeZone,
  })
    .format(date)
    .replace('.', ':');
}

/** 14 -> "14 menit", 60 -> "1 jam", 378 -> "6 jam 18 menit". */
export function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} menit`;
  return minutes === 0 ? `${hours} jam` : `${hours} jam ${minutes} menit`;
}

/** Menit sejak tengah malam di zona waktu tertentu, untuk dibandingkan dengan jadwal. */
export function minutesOfDay(date: Date, timeZone?: string): number {
  return parseClockTime(formatClock(date, timeZone)) ?? 0;
}

/** Sapaan di Beranda: pagi < 11.00, siang < 15.00, sore < 18.00, selebihnya malam. */
export function greetingFor(minutes: number): string {
  if (minutes < 11 * 60) return 'Selamat pagi';
  if (minutes < 15 * 60) return 'Selamat siang';
  if (minutes < 18 * 60) return 'Selamat sore';
  return 'Selamat malam';
}

/** Date -> "Kamis, 01/10/2026". */
export function formatDayDate(date: Date, timeZone?: string): string {
  const day = new Intl.DateTimeFormat('id-ID', { weekday: 'long', timeZone }).format(date);
  const numeric = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone,
  }).format(date);
  return `${day}, ${numeric}`;
}
