import { distanceMeters, type GeoPoint } from '@on-track/core';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

export type DeviceLocation =
  | { state: 'mencari' }
  /** `accuracy` null bila perangkat tidak melaporkannya; dinilai sebagai GPS lemah. */
  | { state: 'siap'; distance: number; accuracy: number | null }
  /** Izin lokasi ditolak. `canAskAgain` false berarti harus diubah lewat Pengaturan. */
  | { state: 'ditolak'; canAskAgain: boolean }
  /** Layanan lokasi (GPS) di perangkat dimatikan. */
  | { state: 'mati' }
  | { state: 'gagal' };

/**
 * Membaca posisi perangkat sekali saat layar dibuka, sesuai janji M13: lokasi hanya dibaca
 * saat Clock In/Out. `refresh` membaca ulang (M29 "Coba deteksi lokasi lagi").
 */
export function useDeviceLocation(target: GeoPoint, enabled = true) {
  const [location, setLocation] = useState<DeviceLocation>({ state: 'mencari' });
  const request = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++request.current;
    const update = (next: DeviceLocation) => {
      // Abaikan hasil lama bila pengguna sudah menekan coba lagi.
      if (id === request.current) setLocation(next);
    };
    update({ state: 'mencari' });

    try {
      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted) {
        update({ state: 'ditolak', canAskAgain: permission.canAskAgain });
        return;
      }
      if (!(await Location.hasServicesEnabledAsync())) {
        update({ state: 'mati' });
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      update({
        state: 'siap',
        distance: distanceMeters(coords, target),
        accuracy: coords.accuracy == null ? null : Math.round(coords.accuracy),
      });
    } catch {
      update({ state: 'gagal' });
    }
  }, [target]);

  useEffect(() => {
    if (enabled) void refresh();
    const requests = request;
    return () => {
      // Hasil yang datang setelah layar ditutup diabaikan.
      requests.current++;
    };
  }, [enabled, refresh]);

  return { location, refresh };
}
