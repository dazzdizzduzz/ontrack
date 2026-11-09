import {
  formatShortDuration,
  leaveDayLabels,
  parseClockTime,
  type AttendanceDay,
  type DayStatus,
  type MonthSummary,
} from '@on-track/core';
import { sampleClockIn } from '../clock-in/data';

type Tone = 'success' | 'warning' | 'neutral' | 'danger';

export const statusLabels: Record<DayStatus, string> = {
  hadir: 'Hadir',
  terlambat: 'Terlambat',
  izin: 'Izin',
  alpha: 'Alpha',
};

const tones: Record<DayStatus, Tone> = {
  hadir: 'success',
  terlambat: 'warning',
  izin: 'neutral',
  alpha: 'danger',
};

/** Menit terlambat dari jam masuk jadwal (FR-08). */
export function lateMinutes(day: AttendanceDay): number {
  if (day.status !== 'terlambat' || !day.clockIn) return 0;
  return (parseClockTime(day.clockIn) ?? 0) - (parseClockTime(sampleClockIn.schedule.start) ?? 0);
}

/** KW16 menulis "Terlambat" saja; `withLate` menambah lamanya untuk tooltip dan pembaca layar. */
export function statusBadge(day: AttendanceDay, withLate = false): { tone: Tone; label: string } {
  const late = lateMinutes(day);
  // W44: hari yang tersinkron dari pengajuan memakai jenisnya ("Cuti"), bukan "Izin".
  if (day.leaveType) return { tone: 'neutral', label: leaveDayLabels[day.leaveType] };
  return {
    tone: tones[day.status],
    label: withLate && late > 0 ? `Terlambat · ${formatShortDuration(late)}` : statusLabels[day.status],
  };
}

/** "19 hadir · 2 terlambat · 1 izin"; izin dan alpha hanya ditulis bila ada. */
export function summaryLine(summary: MonthSummary): string {
  const parts = [`${summary.hadir} hadir`, `${summary.terlambat} terlambat`];
  if (summary.izin) parts.push(`${summary.izin} izin`);
  if (summary.alpha) parts.push(`${summary.alpha} alpha`);
  return parts.join(' · ');
}
