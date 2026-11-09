'use client';

import { useSyncExternalStore } from 'react';

const MINUTE = 60_000;

/** Satu timer bersama untuk semua komponen yang menampilkan jam; berdetak saat menit berganti. */
function subscribe(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  const tick = () => {
    onChange();
    timer = setTimeout(tick, MINUTE - (Date.now() % MINUTE));
  };
  timer = setTimeout(tick, MINUTE - (Date.now() % MINUTE));
  return () => clearTimeout(timer);
}

const currentMinute = () => Math.floor(Date.now() / MINUTE);

/**
 * Jam perangkat, dibulatkan ke menit. Bernilai null saat render di server dan saat hidrasi,
 * supaya HTML server dan browser tidak berbeda; komponen menampilkan placeholder sebentar.
 */
export function useNow(): Date | null {
  const minute = useSyncExternalStore(subscribe, currentMinute, () => null);
  return minute === null ? null : new Date(minute * MINUTE);
}
