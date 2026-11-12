import { MAX_GPS_ACCURACY_METERS, formatDistance, type GeofenceResult } from '@on-track/core';
import { color, size, space } from '@on-track/tokens';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Alert } from '@/components/ui/Alert';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { textStyle } from '@/theme/text';
import { ClockInMap } from './ClockInMap';
import { sampleOffice } from './data';
import type { DeviceLocation } from './useDeviceLocation';
import type { LocationCheck } from './useLocationCheck';

const badges: Record<GeofenceResult, { tone: BadgeTone; label: string }> = {
  'dalam-area': { tone: 'success', label: 'Dalam area' },
  'luar-area': { tone: 'danger', label: 'Luar area' },
  'gps-lemah': { tone: 'neutral', label: 'GPS lemah' },
};

/** Lokasi yang belum siap dinilai: M52 mencari, M53 izin ditolak, M54 GPS mati, M55 gagal dibaca. */
const unavailable: Record<
  Exclude<DeviceLocation['state'], 'siap'>,
  { title: string; meta: string; badge: string; alert?: string }
> = {
  mencari: { title: 'Mencari lokasi…', meta: 'Biasanya butuh beberapa detik', badge: 'Mencari' },
  ditolak: {
    title: 'Izin lokasi ditolak',
    meta: 'On-Track butuh lokasi untuk cek radius kantor',
    badge: 'Tanpa izin',
    alert: 'Izinkan akses lokasi di Pengaturan, lalu kembali ke sini.',
  },
  mati: {
    title: 'Layanan lokasi mati',
    meta: 'Nyalakan GPS di HP kamu',
    badge: 'GPS mati',
    alert: 'Nyalakan layanan lokasi, lalu coba lagi.',
  },
  gagal: {
    title: 'Lokasi gagal dibaca',
    meta: 'Sinyal lemah atau waktu habis',
    badge: 'Gagal',
    alert: 'Pindah ke area terbuka atau dekat jendela, lalu coba lagi.',
  },
};

/** M53 memakai teks Pengaturan; bila dialog izin masih bisa muncul, minta izin langsung. */
const askAgainAlert = 'Izinkan akses lokasi untuk On-Track, lalu coba lagi.';

const goHome = () => (router.canGoBack() ? router.back() : router.replace('/beranda'));

/** Tombol kembali dan judul layar Clock In / Clock Out. */
export function AttendanceTopBar({ title }: { title: string }) {
  return (
    <View style={styles.topBar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Kembali"
        onPress={goHome}
        style={styles.back}
      >
        <Icon name="back" size={20} />
      </Pressable>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
    </View>
  );
}

type LocationVerificationProps = {
  check: LocationCheck;
  /** "Clock-in" atau "Clock-out", untuk judul peringatan. */
  action: string;
  /** Pesan saat di luar radius (M07 / M35). */
  outsideMessage: string;
  /** Peta lebih pendek agar konten di bawahnya muat (M30). */
  compact?: boolean;
  /** M64: tanpa internet, lokasi disimpan di HP dan dikirim saat online. */
  offline?: boolean;
};

/** Langkah 1 Clock In / Clock Out: peta, status geofence, dan peringatan (M03, M07, M29, M32, M35). */
export function LocationVerification({
  check,
  action,
  outsideMessage,
  compact,
  offline,
}: LocationVerificationProps) {
  const { location, geofence, testMode } = check;
  const pending = location.state === 'siap' ? null : unavailable[location.state];
  const distanceLabel = formatDistance(check.distance);
  const accuracyLabel =
    location.state === 'siap' && location.accuracy != null ? `±${location.accuracy} m` : 'tidak diketahui';

  return (
    <>
      <Text style={styles.step}>1. Verifikasi lokasi</Text>
      <ClockInMap
        result={geofence ?? 'gps-lemah'}
        height={compact ? 130 : 190}
        label={
          geofence === 'dalam-area' || geofence === 'luar-area'
            ? `Peta lokasi: ${distanceLabel} dari ${sampleOffice.name}`
            : 'Peta lokasi: posisi belum diketahui'
        }
      />
      <View style={styles.status} accessibilityLiveRegion="polite">
        <View style={styles.statusText}>
          <Text style={styles.statusTitle}>
            {pending?.title}
            {geofence === 'gps-lemah' && 'Lokasi belum akurat'}
            {geofence === 'luar-area' && `Kamu berada ${distanceLabel} dari kantor`}
            {geofence === 'dalam-area' &&
              (offline ? 'Lokasi dari GPS · tersimpan di HP' : `${sampleOffice.name} · ${distanceLabel} dari titik`)}
          </Text>
          <Text style={styles.statusMeta}>
            {pending?.meta}
            {geofence === 'gps-lemah' &&
              `Akurasi GPS ${accuracyLabel} · dibutuhkan ≤ ±${MAX_GPS_ACCURACY_METERS} m`}
            {geofence === 'luar-area' &&
              `Batas radius ${sampleOffice.radiusMeters} m · Akurasi GPS ${accuracyLabel}`}
            {geofence === 'dalam-area' &&
              (offline
                ? 'Jam dicatat saat kamu menekan tombol, bukan saat terkirim'
                : `Akurasi GPS ${accuracyLabel} · radius ${sampleOffice.radiusMeters} m`)}
          </Text>
        </View>
        {geofence ? (
          <Badge {...badges[geofence]} />
        ) : (
          <Badge tone="neutral" label={pending?.badge ?? ''} />
        )}
      </View>

      {testMode && (
        <Text style={styles.statusMeta}>
          Mode tes: lokasi mana saja dianggap di {sampleOffice.name}.
        </Text>
      )}
      {pending?.alert && (
        <Alert tone="warning" title={`Belum bisa ${action.toLowerCase()}`} announce>
          {location.state === 'ditolak' && location.canAskAgain ? askAgainAlert : pending.alert}
        </Alert>
      )}
      {geofence === 'gps-lemah' && (
        <Alert tone="warning" title={`Belum bisa ${action.toLowerCase()}`} announce>
          Aktifkan GPS dengan akurasi tinggi, lalu coba lagi di area terbuka.
        </Alert>
      )}
      {geofence === 'luar-area' && (
        <Alert tone="danger" title={`${action} ditolak`} announce>
          {outsideMessage}
        </Alert>
      )}
    </>
  );
}

/**
 * Tombol memperbaiki lokasi: izinkan lokasi, atau coba deteksi lagi (M29, M35). null bila
 * lokasi tidak perlu diperbaiki. `retryOutside`: di luar area juga bisa coba lagi (M35).
 */
export function LocationFixButton({
  check,
  retryOutside,
}: {
  check: LocationCheck;
  retryOutside?: boolean;
}) {
  const { location, geofence } = check;
  if (location.state === 'ditolak') {
    return (
      <Button
        fullWidth
        variant="secondary"
        label={location.canAskAgain ? 'Izinkan lokasi' : 'Buka Pengaturan'}
        icon={location.canAskAgain ? 'arrow-right' : 'refresh'}
        onPress={check.allow}
      />
    );
  }
  if (
    geofence === 'gps-lemah' ||
    location.state === 'mati' ||
    location.state === 'gagal' ||
    (retryOutside && geofence === 'luar-area')
  ) {
    return (
      <Button
        fullWidth
        variant="secondary"
        // M55 memakai label pendek; M29, M35, dan M54 "Coba deteksi lokasi lagi".
        label={location.state === 'gagal' ? 'Coba lagi' : 'Coba deteksi lokasi lagi'}
        icon="refresh"
        onPress={check.retry}
      />
    );
  }
  return null;
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
  },
  back: {
    alignItems: 'center',
    justifyContent: 'center',
    width: size.iconTarget,
    height: size.iconTarget,
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: size.iconTarget / 2,
  },
  title: {
    ...textStyle('headingH2'),
    color: color.text.primary,
  },
  step: {
    ...textStyle('labelS'),
    color: color.text.secondary,
    textTransform: 'none',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
  },
  statusText: {
    flex: 1,
    gap: space[4],
  },
  statusTitle: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  statusMeta: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
});

/** Gaya teks langkah ("2. Ambil selfie") untuk layar yang memakai komponen ini. */
export const stepTextStyle = styles.step;
