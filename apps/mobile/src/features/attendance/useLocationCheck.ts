import type { GeofenceResult } from '@on-track/core';
import { Linking } from 'react-native';
import { useState } from 'react';

import { useAttendance } from './AttendanceProvider';
import { geofenceOf, sampleOffice, scenarioSamples, TEST_ANY_LOCATION } from './data';
import { useDeviceLocation, type DeviceLocation } from './useDeviceLocation';

export type LocationCheck = {
  /** false: contoh Figma lewat `?state=`. */
  live: boolean;
  /** Mode tes: posisi di mana pun dianggap titik kantor. */
  testMode: boolean;
  location: DeviceLocation;
  /** null selama lokasi belum siap dinilai. */
  geofence: GeofenceResult | null;
  distance: number;
  /** M29 "Coba deteksi lokasi lagi". */
  retry: () => void;
  /** Meminta izin lokasi, atau membuka Pengaturan bila sudah ditolak permanen. */
  allow: () => Promise<void>;
};

/**
 * Verifikasi lokasi Clock In dan Clock Out. Tanpa `sample`, posisi dibaca dari GPS perangkat;
 * dengan `sample` (lewat `?state=`), memakai jarak dan akurasi contoh Figma.
 */
export function useLocationCheck(
  sample?: {
    distance: number;
    accuracy: number;
    pending?: Exclude<DeviceLocation, { state: 'siap' }>;
  },
  { withCamera = false } = {},
): LocationCheck {
  const { requestPermissions, requestLocationPermission } = useAttendance();
  const live = sample === undefined;
  const testMode = live && TEST_ANY_LOCATION;
  const device = useDeviceLocation(sampleOffice.point, live);
  // Contoh M29: coba lagi disimulasikan berhasil dengan akurasi ±8 m.
  const [sampleAccuracy, setSampleAccuracy] = useState(sample?.accuracy ?? 0);

  const location: DeviceLocation = !live
    ? (sample.pending ?? { state: 'siap', distance: sample.distance, accuracy: sampleAccuracy })
    : testMode && device.location.state === 'siap'
      ? { ...device.location, distance: 0 }
      : device.location;
  const geofence =
    location.state === 'siap'
      ? geofenceOf({
          distance: location.distance,
          accuracy: location.accuracy ?? Number.POSITIVE_INFINITY,
        })
      : null;

  function retry() {
    if (live) void device.refresh();
    else setSampleAccuracy(scenarioSamples['dalam-area'].accuracy);
  }

  async function allow() {
    if (location.state === 'ditolak' && !location.canAskAgain) {
      void Linking.openSettings();
      return;
    }
    // Clock In ikut meminta kamera untuk selfie; Clock Out hanya lokasi.
    const result = await (withCamera ? requestPermissions() : requestLocationPermission());
    if (!result.missing.includes('lokasi')) void device.refresh();
  }

  return {
    live,
    testMode,
    location,
    geofence,
    distance: location.state === 'siap' ? location.distance : 0,
    retry,
    allow,
  };
}
