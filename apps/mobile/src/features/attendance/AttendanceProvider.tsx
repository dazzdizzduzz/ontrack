import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { ClockInRecord, ClockOutRecord } from './data';

export type Permission = 'lokasi' | 'kamera';

export type PermissionResult = {
  granted: boolean;
  /** Izin yang masih ditolak. */
  missing: Permission[];
  /** false bila salah satu izin hanya bisa diubah lewat Pengaturan. */
  canAskAgain: boolean;
};

type AttendanceValue = {
  /** Izin lokasi dari sistem sudah diberikan. */
  locationGranted: boolean;
  /** M13: izin lokasi dan kamera sudah diberikan, jadi M13 dilewati. */
  permissionsGranted: boolean;
  /** Membuka dialog izin sistem: lokasi dulu, lalu kamera. */
  requestPermissions: () => Promise<PermissionResult>;
  /** Hanya izin lokasi, untuk Clock Out yang tidak memakai kamera. */
  requestLocationPermission: () => Promise<PermissionResult>;
  clockIn: ClockInRecord | null;
  saveClockIn: (record: ClockInRecord) => void;
  clockOut: ClockOutRecord | null;
  saveClockOut: (record: ClockOutRecord) => void;
};

const AttendanceContext = createContext<AttendanceValue | null>(null);

/** MOCK: catatan clock-in dan clock-out tersimpan di memori aplikasi dan hilang saat aplikasi ditutup. */
export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [locationGranted, setLocationGranted] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);
  const [clockIn, setClockIn] = useState<ClockInRecord | null>(null);
  const [clockOut, setClockOut] = useState<ClockOutRecord | null>(null);

  useEffect(() => {
    Location.getForegroundPermissionsAsync()
      .then((permission) => setLocationGranted(permission.granted))
      .catch(() => setLocationGranted(false));
    Camera.getCameraPermissionsAsync()
      .then((permission) => setCameraGranted(permission.granted))
      .catch(() => setCameraGranted(false));
  }, []);

  const requestPermissions = useCallback(async (): Promise<PermissionResult> => {
    const ask = async (request: () => Promise<{ granted: boolean; canAskAgain: boolean }>) => {
      try {
        return await request();
      } catch {
        return { granted: false, canAskAgain: false };
      }
    };
    const location = await ask(Location.requestForegroundPermissionsAsync);
    const camera = await ask(Camera.requestCameraPermissionsAsync);
    setLocationGranted(location.granted);
    setCameraGranted(camera.granted);

    const missing: Permission[] = [];
    if (!location.granted) missing.push('lokasi');
    if (!camera.granted) missing.push('kamera');
    return {
      granted: missing.length === 0,
      missing,
      canAskAgain: (location.granted || location.canAskAgain) && (camera.granted || camera.canAskAgain),
    };
  }, []);

  const requestLocationPermission = useCallback(async (): Promise<PermissionResult> => {
    try {
      const location = await Location.requestForegroundPermissionsAsync();
      setLocationGranted(location.granted);
      return {
        granted: location.granted,
        missing: location.granted ? [] : ['lokasi'],
        canAskAgain: location.granted || location.canAskAgain,
      };
    } catch {
      return { granted: false, missing: ['lokasi'], canAskAgain: false };
    }
  }, []);

  const value = useMemo<AttendanceValue>(
    () => ({
      locationGranted,
      permissionsGranted: locationGranted && cameraGranted,
      requestPermissions,
      requestLocationPermission,
      clockIn,
      saveClockIn: setClockIn,
      clockOut,
      saveClockOut: setClockOut,
    }),
    [cameraGranted, clockIn, clockOut, locationGranted, requestLocationPermission, requestPermissions],
  );

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
}

export function useAttendance() {
  const value = useContext(AttendanceContext);
  if (!value) throw new Error('useAttendance harus dipakai di dalam AttendanceProvider');
  return value;
}
