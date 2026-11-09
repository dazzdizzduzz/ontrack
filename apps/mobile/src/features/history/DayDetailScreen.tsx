import {
  formatDayLong,
  formatDistance,
  formatDuration,
  formatShortDuration,
  sampleAttendance,
  samplePeriods,
  workedMinutes,
  type AttendanceDay,
} from '@on-track/core';
import { color, radius, space } from '@on-track/tokens';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { TopAppBar } from '@/components/ui/TopAppBar';
import { sampleOffice, sampleSchedule } from '@/features/attendance/data';
import { textStyle } from '@/theme/text';
import { statusBadge } from './status';

const goBack = () => (router.canGoBack() ? router.back() : router.replace('/riwayat'));

/** MOCK: cari hari di riwayat contoh; nanti diambil per tanggal dari API. */
function findDay(date: string): AttendanceDay | undefined {
  for (const period of samplePeriods) {
    const day = sampleAttendance(period).find((item) => item.date === date);
    if (day) return day;
  }
  return undefined;
}

function Event({
  label,
  time,
  distance,
  accuracy,
}: {
  label: string;
  time: string;
  distance?: number;
  accuracy?: number;
}) {
  const where = [
    sampleOffice.name,
    distance !== undefined ? `${formatDistance(distance)} dari titik` : null,
    accuracy !== undefined ? `akurasi ±${accuracy} m` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <View accessible style={styles.event}>
      {/* MOCK: foto selfie asli diambil dari server; sementara ilustrasi Figma. */}
      <Image
        source={require('@/assets/images/selfie-thumb.svg')}
        style={styles.selfie}
        accessibilityLabel={`Selfie ${label.toLowerCase()}`}
      />
      <View style={styles.eventText}>
        <View style={styles.eventTop}>
          <Text style={styles.eventLabel}>{label}</Text>
          <Text style={styles.eventTime}>{time} WITA</Text>
        </View>
        <Text style={styles.eventMeta}>{where}</Text>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View accessible style={styles.kv}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
}

/** M36 · Detail Absensi Harian. Hanya bisa dilihat; koreksi lewat HRD. */
export function DayDetailScreen({ date }: { date: string }) {
  const { bottom } = useSafeAreaInsets();
  const day = findDay(date);

  if (!day) {
    return (
      <View style={styles.screen}>
        <TopAppBar title="Detail absensi" onBack={goBack} />
        <View style={styles.content}>
          <Text style={styles.note}>Tidak ada catatan absensi untuk tanggal ini.</Text>
        </View>
      </View>
    );
  }

  const worked = workedMinutes(day);
  const badge = statusBadge(day);
  const attended = day.clockIn !== undefined;

  return (
    <View style={styles.screen}>
      <TopAppBar title="Detail absensi" onBack={goBack} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(space[32], bottom) }]}
      >
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.date}>{formatDayLong(day.date)}</Text>
            <Badge tone={badge.tone} label={badge.label} />
          </View>
          <Text style={styles.total}>
            {worked !== null ? formatDuration(worked) : badge.label}
          </Text>
          <Text style={styles.totalMeta}>
            {attended
              ? `Total jam kerja · jadwal Reguler ${sampleSchedule.start}–${sampleSchedule.end}`
              : 'Tidak ada clock-in dan clock-out di hari ini'}
          </Text>
        </View>

        {attended && day.clockIn && (
          <View style={[styles.card, styles.timeline]}>
            <Text style={styles.cardTitle}>Clock-in & clock-out</Text>
            <Event
              label="Clock-in"
              time={day.clockIn}
              distance={day.inDistance}
              accuracy={day.inAccuracy}
            />
            {day.clockOut && (
              <Event
                label="Clock-out"
                time={day.clockOut}
                distance={day.outDistance}
                accuracy={day.outAccuracy}
              />
            )}
          </View>
        )}

        <View style={[styles.card, styles.details]}>
          <Row label="Toleransi terlambat" value={`${sampleSchedule.toleranceMinutes} menit`} />
          <Row
            label="Lembur"
            value={day.overtimeMinutes > 0 ? formatShortDuration(day.overtimeMinutes) : 'Tidak ada'}
          />
          <Row label="Mode absensi" value="Kantor (geofence)" />
          {/* MOCK: perangkat belum tercatat di data contoh; semua dari aplikasi mobile. */}
          <Row label="Perangkat" value={attended ? 'Aplikasi mobile' : '–'} />
        </View>

        <Text style={styles.note}>
          Data absensi tidak bisa diubah sendiri. Hubungi HRD jika ada data yang keliru.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.canvas,
  },
  content: {
    gap: space[16],
    padding: space[20],
  },
  card: {
    gap: space[8],
    padding: space[16],
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.lg,
    backgroundColor: color.bg.surface,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[8],
  },
  date: {
    ...textStyle('labelM'),
    flexShrink: 1,
    color: color.text.primary,
  },
  total: {
    ...textStyle('numericKpi'),
    color: color.text.primary,
  },
  totalMeta: {
    ...textStyle('bodyS'),
    color: color.text.secondary,
  },
  timeline: {
    gap: 0,
  },
  cardTitle: {
    ...textStyle('headingH3'),
    color: color.text.primary,
  },
  event: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    paddingVertical: space[12],
  },
  selfie: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
  },
  eventText: {
    flex: 1,
    gap: space[2],
  },
  eventTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space[8],
  },
  eventLabel: {
    ...textStyle('bodyS'),
    color: color.text.secondary,
  },
  eventTime: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  eventMeta: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
  details: {
    gap: space[12],
  },
  kv: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space[12],
  },
  kvLabel: {
    ...textStyle('bodyS'),
    color: color.text.secondary,
  },
  kvValue: {
    ...textStyle('labelM'),
    flexShrink: 1,
    color: color.text.primary,
    textAlign: 'right',
  },
  note: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
});
