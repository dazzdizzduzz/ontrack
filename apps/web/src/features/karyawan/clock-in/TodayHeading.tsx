'use client';

import { formatDayDate, greetingFor, minutesOfDay, parseClockTime } from '@on-track/core';
import styles from '../BerandaKaryawan.module.css';
import { sampleClockIn, TENANT_TIME_ZONE } from './data';
import { useNow } from './useNow';

/**
 * Sapaan dan tanggal KW08 dari jam perangkat. Saat pratinjau, dan sesaat sebelum hidrasi,
 * memakai contoh Figma (Kamis, 01/10/2026) dengan sapaan dari `previewTime`.
 */
export function TodayHeading({ name, previewTime }: { name: string; previewTime?: string }) {
  const now = useNow();
  const live = !previewTime && now;
  const greeting = greetingFor(
    live
      ? minutesOfDay(now, TENANT_TIME_ZONE)
      : (parseClockTime(previewTime ?? sampleClockIn.time) ?? 0),
  );
  const date = live ? formatDayDate(now, TENANT_TIME_ZONE) : sampleClockIn.date;
  const { start, end } = sampleClockIn.schedule;

  return (
    <div className={styles.titleBlock}>
      <h1 className={styles.title}>
        {greeting}, {name}
      </h1>
      <p className={styles.subtitle}>
        {date} · Jadwal {start}–{end} WITA · {sampleClockIn.office}
      </p>
    </div>
  );
}
