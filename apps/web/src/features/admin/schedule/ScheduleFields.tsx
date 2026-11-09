'use client';

import type { CSSProperties } from 'react';
import { ChipButton } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/Field';
import { RADIUS_MAX, RADIUS_MIN, RADIUS_STEP, dayLabels } from './data';
import styles from './schedule.module.css';

export type ScheduleTimes = {
  start: string;
  end: string;
  tolerance: string;
  days: string[];
  overtimeAfter: string;
  overtimeLimit: string;
};

type ScheduleFieldsProps = {
  values: ScheduleTimes;
  endError?: string;
  onChange: (values: ScheduleTimes) => void;
};

/** Isian jam, hari, dan lembur yang sama di W17, W31, dan W33. */
export function ScheduleFields({ values, endError, onChange }: ScheduleFieldsProps) {
  const set = (patch: Partial<ScheduleTimes>) => onChange({ ...values, ...patch });

  function toggleDay(day: string) {
    set({
      days: values.days.includes(day)
        ? values.days.filter((item) => item !== day)
        : dayLabels.filter((item) => item === day || values.days.includes(item)),
    });
  }

  return (
    <>
      <div className={styles.fieldRow}>
        <TextField
          label="Jam masuk"
          helper="WITA"
          inputMode="decimal"
          value={values.start}
          onChange={(event) => set({ start: event.target.value })}
        />
        <TextField
          label="Jam pulang"
          helper="WITA"
          inputMode="decimal"
          error={endError}
          value={values.end}
          onChange={(event) => set({ end: event.target.value })}
        />
        <TextField
          label="Toleransi terlambat"
          helper="Lewat ini = Terlambat"
          value={values.tolerance}
          onChange={(event) => set({ tolerance: event.target.value })}
        />
      </div>
      <p className={styles.groupLabel} id="hari-kerja">
        Hari kerja
      </p>
      <div className={styles.days} role="group" aria-labelledby="hari-kerja">
        {dayLabels.map((day) => (
          <ChipButton key={day} selected={values.days.includes(day)} onClick={() => toggleDay(day)}>
            {day}
          </ChipButton>
        ))}
      </div>
      <div className={styles.fieldRow}>
        <TextField
          label="Lembur dihitung setelah"
          helper="dari jam pulang"
          value={values.overtimeAfter}
          onChange={(event) => set({ overtimeAfter: event.target.value })}
        />
        <TextField
          label="Batas lembur harian"
          helper="Butuh persetujuan atasan"
          value={values.overtimeLimit}
          onChange={(event) => set({ overtimeLimit: event.target.value })}
        />
      </div>
    </>
  );
}

export function RadiusSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (meters: number) => void;
}) {
  const fill = ((value - RADIUS_MIN) / (RADIUS_MAX - RADIUS_MIN)) * 100;

  return (
    <div className={styles.radius}>
      <div className={styles.radiusLabel}>
        <label htmlFor="radius-geofence">Radius geofence</label>
        <span className={styles.radiusValue}>{value} m</span>
      </div>
      <input
        id="radius-geofence"
        type="range"
        className={styles.slider}
        min={RADIUS_MIN}
        max={RADIUS_MAX}
        step={RADIUS_STEP}
        value={value}
        aria-valuetext={`${value} meter`}
        style={{ '--slider-fill': `${fill}%` } as CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className={styles.radiusScale}>
        <span>25 m</span>
        <span>500 m</span>
      </div>
    </div>
  );
}
