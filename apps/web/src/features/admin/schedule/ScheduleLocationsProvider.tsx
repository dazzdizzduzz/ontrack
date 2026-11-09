'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  initialLocations,
  initialSchedules,
  type OfficeLocation,
  type WorkSchedule,
} from './data';

type ScheduleLocationsValue = {
  schedules: WorkSchedule[];
  locations: OfficeLocation[];
  saveSchedule: (schedule: WorkSchedule) => void;
  saveLocation: (location: OfficeLocation) => void;
};

const ScheduleLocationsContext = createContext<ScheduleLocationsValue | null>(null);

const upsert = <T extends { id: string }>(rows: T[], row: T) =>
  rows.some((item) => item.id === row.id)
    ? rows.map((item) => (item.id === row.id ? row : item))
    : [...rows, row];

/** MOCK: data hanya bertahan selama berpindah halaman, dan hilang saat dimuat ulang. */
export function ScheduleLocationsProvider({ children }: { children: ReactNode }) {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [locations, setLocations] = useState(initialLocations);

  const value = useMemo<ScheduleLocationsValue>(
    () => ({
      schedules,
      locations,
      saveSchedule: (schedule) => setSchedules((rows) => upsert(rows, schedule)),
      saveLocation: (location) => setLocations((rows) => upsert(rows, location)),
    }),
    [locations, schedules],
  );

  return (
    <ScheduleLocationsContext.Provider value={value}>{children}</ScheduleLocationsContext.Provider>
  );
}

export function useScheduleLocations() {
  const value = useContext(ScheduleLocationsContext);
  if (!value) throw new Error('useScheduleLocations harus dipakai di dalam provider-nya');
  return value;
}
