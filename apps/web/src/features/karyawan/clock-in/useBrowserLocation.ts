'use client';

import { distanceMeters, type GeoPoint } from '@on-track/core';
import { useCallback, useEffect, useRef, useState } from 'react';

export type BrowserLocation =
  | { state: 'mencari' }
  | { state: 'siap'; distance: number; accuracy: number }
  /** Izin lokasi untuk situs ini ditolak. */
  | { state: 'ditolak' }
  /** Browser tidak bisa menentukan posisi (layanan lokasi OS mati, tanpa Wi-Fi). */
  | { state: 'mati' }
  /** Waktu habis atau browser tidak mendukung Geolocation API. */
  | { state: 'gagal' };

/**
 * Membaca lokasi browser sekali saat dialog Clock In dibuka; `refresh` membaca ulang.
 * Lokasi laptop biasanya dari Wi-Fi, jadi akurasinya sering lebih rendah daripada GPS ponsel.
 */
export function useBrowserLocation(target: GeoPoint, enabled = true) {
  const [location, setLocation] = useState<BrowserLocation>({ state: 'mencari' });
  const request = useRef(0);

  const refresh = useCallback(() => {
    const id = ++request.current;
    const update = (next: BrowserLocation) => {
      if (id === request.current) setLocation(next);
    };
    update({ state: 'mencari' });

    if (!('geolocation' in navigator)) {
      update({ state: 'gagal' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        update({
          state: 'siap',
          distance: distanceMeters(coords, target),
          accuracy: Math.round(coords.accuracy),
        }),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) update({ state: 'ditolak' });
        else if (error.code === error.POSITION_UNAVAILABLE) update({ state: 'mati' });
        else update({ state: 'gagal' });
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }, [target]);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const requests = request;
    return () => {
      // Hasil yang datang setelah dialog ditutup diabaikan.
      requests.current++;
    };
  }, [enabled, refresh]);

  return { location, refresh };
}
