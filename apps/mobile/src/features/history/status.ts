import {
  formatDuration,
  formatShortDuration,
  parseClockTime,
  workedMinutes,
  type AttendanceDay,
  type DayStatus,
  type MonthSummary,
} from '@on-track/core';
import { color } from '@on-track/tokens';

import type { BadgeTone } from '@/components/ui/Badge';
import { sampleSchedule } from '@/features/attendance/data';

/** Warna titik kalender dan legenda M15. Warna selalu disertai label teks (WCAG 1.4.1). */
export const statusDots: Record<DayStatus, string> = {
  hadir: color.accent.default,
  terlambat: color.status.warningFg,
  izin: color.text.disabled,
  alpha: color.status.dangerFg,
};

export const statusLabels: Record<DayStatus, string> = {
  hadir: 'Hadir',
  terlambat: 'Terlambat',
  izin: 'Izin',
  alpha: 'Alpha',
};

const badgeTones: Record<DayStatus, BadgeTone> = {
  hadir: 'success',
  terlambat: 'warning',
  izin: 'neutral',
  alpha: 'danger',
};

/** Menit terlambat dari jam masuk jadwal, sama dengan aturan clock-in (FR-08). */
export function lateMinutes(day: AttendanceDay): number {
  if (day.status !== 'terlambat' || !day.clockIn) return 0;
  return (parseClockTime(day.clockIn) ?? 0) - (parseClockTime(sampleSchedule.start) ?? 0);
}

/** Badge status M15 dan M36: "Hadir", "Terlambat · 13 menit", "Izin", "Alpha". */
export function statusBadge(day: AttendanceDay): { tone: BadgeTone; label: string } {
  const late = lateMinutes(day);
  return {
    tone: badgeTones[day.status],
    label: late > 0 ? `Terlambat · ${formatShortDuration(late)}` : statusLabels[day.status],
  };
}

/** "08:51 – 17:06 · 8 j 15 m" di daftar M15. */
export function dayMeta(day: AttendanceDay): string {
  const worked = workedMinutes(day);
  if (day.clockIn && day.clockOut && worked !== null) {
    return `${day.clockIn} – ${day.clockOut} · ${formatDuration(worked)}`;
  }
  return day.status === 'izin' ? 'Izin tercatat · tanpa clock-in' : 'Tidak ada catatan absensi';
}

/** "19 hadir · 2 terlambat · 1 izin" (M37); izin dan alpha hanya ditulis bila ada. */
export function summaryLine(summary: MonthSummary): string {
  const parts = [`${summary.hadir} hadir`, `${summary.terlambat} terlambat`];
  if (summary.izin) parts.push(`${summary.izin} izin`);
  if (summary.alpha) parts.push(`${summary.alpha} alpha`);
  return parts.join(' · ');
}
