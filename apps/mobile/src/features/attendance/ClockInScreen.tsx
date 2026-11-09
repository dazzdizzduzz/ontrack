import { formatClock, formatDayDate } from '@on-track/core';
import { color, space } from '@on-track/tokens';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useAttendance } from './AttendanceProvider';
import {
  recordFor,
  sampleDate,
  sampleOffice,
  scenarioSamples,
  TENANT_TIME_ZONE,
  type ClockInScenario,
} from './data';
import {
  AttendanceTopBar,
  LocationFixButton,
  LocationVerification,
  stepTextStyle,
} from './LocationVerification';
import { SelfieViewfinder } from './SelfieViewfinder';
import { useLocationCheck } from './useLocationCheck';
import { useNow } from './useNow';

type SelfieStep = 'kamera' | 'pratinjau' | 'gagal';
type CameraStatus = 'memuat' | 'siap' | 'gagal';

/**
 * M03 · Clock In, M27/M31 · Pratinjau Selfie, M29 · GPS Lemah, M30 · Selfie Gagal,
 * M07 · Ditolak (Luar Area). Tanpa `scenario`, jam, GPS, dan kamera depan dari perangkat;
 * dengan `scenario` (lewat `?state=`), layar memakai contoh Figma (lihat data.ts).
 */
export function ClockInScreen({ scenario }: { scenario?: ClockInScenario }) {
  const { top, bottom } = useSafeAreaInsets();
  const { saveClockIn } = useAttendance();
  const sample = scenarioSamples[scenario ?? 'dalam-area'];
  const check = useLocationCheck(scenario ? sample : undefined, { withCamera: true });
  const { live, geofence, location, distance } = check;
  const now = useNow();

  const [step, setStep] = useState<SelfieStep>('kamera');
  const [attempts, setAttempts] = useState(0);
  const [capturedAt, setCapturedAt] = useState<Date | null>(null);

  // Kamera depan asli, hanya di mode perangkat. Contoh `?state=` tetap memakai ilustrasi Figma.
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('memuat');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  // null selama izin kamera masih dibaca.
  const cameraAllowed = live ? (cameraPermission?.granted ?? null) : true;

  const shotAt = capturedAt ?? now;
  const time = live
    ? formatClock(shotAt, TENANT_TIME_ZONE)
    : step === 'gagal' && sample.failedAt
      ? sample.failedAt
      : sample.time;
  const date = live ? formatDayDate(shotAt, TENANT_TIME_ZONE) : sampleDate;
  const caption = `${date} · ${time} WITA · ${sampleOffice.name}`;

  async function allowCamera() {
    if (cameraPermission && !cameraPermission.canAskAgain) {
      void Linking.openSettings();
      return;
    }
    await requestCameraPermission();
  }

  async function takeSelfie() {
    if (live) {
      setCapturing(true);
      try {
        const photo = await cameraRef.current?.takePictureAsync({ quality: 0.6, shutterSound: false });
        if (!photo) throw new Error('Foto kosong');
        setPhotoUri(photo.uri);
        setCapturedAt(new Date());
        setStep('pratinjau');
      } catch {
        setCameraStatus('gagal');
      } finally {
        setCapturing(false);
      }
      return;
    }
    setAttempts((count) => count + 1);
    setCapturedAt(new Date());
    // Skenario wajah gagal: percobaan pertama tidak terdeteksi (M30), berikutnya berhasil (M31).
    setStep(sample.failedAt && attempts === 0 ? 'gagal' : 'pratinjau');
  }

  function retake() {
    setCapturedAt(null);
    setPhotoUri(null);
    setCameraStatus('memuat');
    setStep('kamera');
  }

  function confirmSelfie() {
    // MOCK: foto dan lokasi belum dikirim ke server; foto hanya ada di cache perangkat.
    // Status dihitung dari jam selfie dan jadwal contoh; saat integrasi, server yang
    // mencatat jam dan menilai ulang.
    saveClockIn(recordFor(time, distance, date));
    // Diganti, bukan ditumpuk, supaya tombol kembali tidak membuka kamera lagi.
    router.replace('/clock-in-berhasil');
  }

  const failed = step === 'gagal';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          // M30 memakai jarak 12px agar peta, foto, dan pesan muat dalam satu layar.
          failed && styles.contentCompact,
          { paddingTop: top + space[24], paddingBottom: Math.max(space[32], bottom) },
        ]}
      >
        <AttendanceTopBar title="Clock In" />
        <LocationVerification
          check={check}
          action="Clock-in"
          outsideMessage="Kamu di luar radius kantor dan belum punya izin WFH/Dinas Luar hari ini."
          compact={failed}
        />

        {geofence === 'dalam-area' && (
          <>
            <Text style={stepTextStyle}>
              {step === 'kamera' && '2. Ambil selfie'}
              {step === 'pratinjau' && '2. Periksa selfie'}
              {failed && '2. Ambil ulang selfie'}
            </Text>
            {step === 'kamera' ? (
              <SelfieViewfinder
                state="kamera"
                camera={
                  live && cameraAllowed ? (
                    <CameraView
                      ref={cameraRef}
                      facing="front"
                      mirror
                      mode="picture"
                      style={StyleSheet.absoluteFill}
                      onCameraReady={() => setCameraStatus('siap')}
                      onMountError={() => setCameraStatus('gagal')}
                    />
                  ) : undefined
                }
              />
            ) : photoUri ? (
              <SelfieViewfinder state="foto" uri={photoUri} caption={caption} />
            ) : (
              <SelfieViewfinder
                state={failed ? 'gagal' : 'terdeteksi'}
                height={failed ? 200 : 236}
                caption={caption}
              />
            )}
            {step === 'kamera' && cameraAllowed === false && (
              <Alert tone="warning" title="Izin kamera belum diberikan" announce>
                Clock-in butuh selfie sebagai bukti kehadiran. Izinkan kamera untuk On-Track.
              </Alert>
            )}
            {step === 'kamera' && cameraAllowed && cameraStatus === 'gagal' && (
              <Alert tone="warning" title="Kamera tidak bisa dibuka" announce>
                Tutup aplikasi lain yang memakai kamera, lalu coba lagi.
              </Alert>
            )}
            {failed && (
              <Alert tone="danger" title="Wajah tidak terdeteksi" announce>
                Pastikan wajah terlihat jelas, tanpa masker, dan cahaya cukup.
              </Alert>
            )}
          </>
        )}

        <View style={styles.spacer} />

        {location.state === 'mencari' && <Button fullWidth label="Clock In" disabled />}
        {geofence !== 'dalam-area' && location.state !== 'mencari' && (
          <>
            <LocationFixButton check={check} />
            {geofence === 'luar-area' && (
              // MOCK: pengajuan WFH / Dinas Luar dikerjakan di F06.
              <Button fullWidth variant="secondary" label="Ajukan WFH / Dinas Luar" icon="arrow-right" />
            )}
            <Button fullWidth label="Clock In" disabled />
          </>
        )}
        {geofence === 'dalam-area' && step === 'kamera' && cameraAllowed === false && (
          <>
            <Button
              fullWidth
              variant="secondary"
              label={cameraPermission?.canAskAgain === false ? 'Buka Pengaturan' : 'Izinkan kamera'}
              icon="camera"
              onPress={allowCamera}
            />
            <Button fullWidth label="Clock In" disabled />
          </>
        )}
        {geofence === 'dalam-area' && step === 'kamera' && cameraAllowed !== false && (
          <Button
            fullWidth
            variant="accent"
            label={capturing ? 'Mengambil foto…' : 'Ambil Selfie & Clock In'}
            icon="arrow-right"
            // Mode perangkat: tombol aktif setelah kamera siap.
            disabled={live && (cameraAllowed !== true || cameraStatus !== 'siap' || capturing)}
            onPress={takeSelfie}
          />
        )}
        {geofence === 'dalam-area' && failed && (
          <Button
            fullWidth
            variant="accent"
            label="Ambil ulang selfie"
            icon="camera"
            onPress={takeSelfie}
          />
        )}
        {geofence === 'dalam-area' && step === 'pratinjau' && (
          <>
            <Button
              fullWidth
              variant="secondary"
              label="Ambil ulang"
              icon="refresh"
              onPress={retake}
            />
            <Button
              fullWidth
              variant="accent"
              label="Gunakan foto & Clock In"
              icon="arrow-right"
              onPress={confirmSelfie}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.surface,
  },
  content: {
    flexGrow: 1,
    gap: space[20],
    paddingHorizontal: space[24],
  },
  contentCompact: {
    gap: space[12],
  },
  spacer: {
    flex: 1,
  },
});
