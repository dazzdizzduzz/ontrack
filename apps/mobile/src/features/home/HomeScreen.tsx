import {
  findMissedClockOut,
  formatClock,
  formatDayDate,
  formatDayMedium,
  formatDistance,
  formatDuration,
  formatShortDuration,
  greetingFor,
  minutesOfDay,
  parseClockTime,
  sampleMissedClockOutDays,
} from '@on-track/core';
import { color, radius, size, space } from '@on-track/tokens';
import { router, Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { BottomNav } from '@/components/ui/BottomNav';
import { mainTabs } from '@/components/ui/mainTabs';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useAttendance } from '@/features/attendance/AttendanceProvider';
import {
  clockOutRecordFor,
  sampleClockIn,
  sampleDate,
  sampleOffice,
  sampleSchedule,
  sampleSummary,
  sampleTasks,
  sampleUser,
  summaryFor,
  TENANT_TIME_ZONE,
} from '@/features/attendance/data';
import { useNow } from '@/features/attendance/useNow';
import { useNotifications } from '@/features/notifications/NotificationProvider';
import { textStyle } from '@/theme/text';

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <View accessible accessibilityLabel={`${label} ${value} ${unit}`} style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
    </View>
  );
}

export type HomePreview = 'sudah-clock-in' | 'sudah-clock-out' | 'lupa-clock-out';

/** Jam contoh Figma M08 dan M49. */
const PREVIEW_TIME = '17:44';

/** Hari ini contoh Figma (Kamis, 01/10/2026) untuk mencari clock-out yang terlewat. */
const SAMPLE_TODAY = '2026-10-01';
/** Jam contoh M65 (sebelum clock-in). */
const MORNING_TIME = '08:52';

/**
 * M02 · Home, M08 · Beranda Clock Out setelah clock-in, M49 · Sudah Clock Out, dan M65 · Lupa
 * Clock-out Kemarin (`lupa-clock-out`). MOCK M65: hanya lewat pratinjau; saat integrasi, riwayat
 * kemarin dari server dicek dengan `findMissedClockOut`.
 * `preview` (lewat `?state=`) menampilkan contoh Figma tanpa mengubah catatan absensi.
 */
export function HomeScreen({ preview }: { preview?: HomePreview }) {
  const { top } = useSafeAreaInsets();
  const { unreadCount } = useNotifications();
  const attendance = useAttendance();
  const { permissionsGranted } = attendance;
  const forgot = preview === 'lupa-clock-out';
  const missed = forgot ? findMissedClockOut(sampleMissedClockOutDays, SAMPLE_TODAY) : undefined;
  const clockIn = forgot ? null : preview ? sampleClockIn : attendance.clockIn;
  const clockOut =
    preview === 'sudah-clock-out'
      ? clockOutRecordFor(sampleClockIn, PREVIEW_TIME, 42)
      : preview
        ? null
        : attendance.clockOut;
  // Jam perangkat di zona tenant. GPS tidak dibaca di sini: M13 menjanjikan lokasi hanya
  // dibaca saat Clock In/Out, jadi jarak ditampilkan dari hasil clock-in atau clock-out.
  const now = useNow();

  const previewTime = forgot ? MORNING_TIME : PREVIEW_TIME;
  const current = preview ? previewTime : formatClock(now, TENANT_TIME_ZONE);
  // M49: setelah clock-out, jam besar berhenti di jam clock-out.
  const clock = clockOut?.time ?? current;
  // M08: total kerja berjalan sejak clock-in.
  const worked = clockIn ? summaryFor(clockIn, clock).workedMinutes : 0;
  const date = preview ? sampleDate : formatDayDate(now, TENANT_TIME_ZONE);
  const greeting = greetingFor(
    preview ? (parseClockTime(previewTime) ?? 0) : minutesOfDay(now, TENANT_TIME_ZONE),
  );

  function startClockIn() {
    router.push(permissionsGranted ? '/clock-in' : '/izin-akses');
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: top + space[24] }]}>
        <View style={styles.header}>
          <View style={styles.greeting}>
            <Text style={styles.date}>{date}</Text>
            <Text accessibilityRole="header" style={styles.hello}>
              {greeting}, {sampleUser.firstName}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={unreadCount > 0 ? `Notifikasi, ${unreadCount} belum dibaca` : 'Notifikasi'}
            onPress={() => router.push('/notifikasi')}
            style={styles.bell}
          >
            <Icon name="bell" size={20} />
          </Pressable>
        </View>

        {missed && (
          <View style={styles.missed}>
            <Alert tone="warning" title="Kemarin kamu belum clock-out">
              {`${formatDayMedium(missed.date)} · clock-in ${missed.clockIn?.replace(':', '.')}. Jam pulang belum tercatat, jadi jam kerja hari itu belum dihitung. Ajukan koreksi ke HRD.`}
            </Alert>
            {/* MOCK: alur koreksi jam pulang menunggu keputusan backend; sementara membuka detail absen (M36). */}
            <Button
              variant="secondary"
              fullWidth
              label="Ajukan koreksi jam pulang"
              onPress={() => router.push({ pathname: '/riwayat/[tanggal]', params: { tanggal: missed.date } })}
            />
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.cardLabel}>
              {clockOut && clockIn
                ? `Sudah clock-out · ${clockIn.time} – ${clockOut.time}`
                : clockIn
                  ? `Clock-in ${clockIn.time} · ${clockIn.status.status === 'hadir' ? 'Hadir' : 'Terlambat'}`
                  : 'Belum clock-in'}
            </Text>
            {/* Badge "GPS aktif" dihapus di Figma: lokasi hanya dibaca saat Clock In/Out. */}
          </View>
          <View style={styles.clock}>
            <Text style={styles.clockTime}>{clock}</Text>
            <Text style={styles.clockMeta}>
              {!clockIn &&
                `Jadwal ${sampleSchedule.start} – ${sampleSchedule.end} ${sampleSchedule.zone} · toleransi ${sampleSchedule.toleranceMinutes} menit`}
              {clockIn &&
                !clockOut &&
                `Total kerja ${formatDuration(worked)} · pulang ${sampleSchedule.end} ${sampleSchedule.zone}`}
              {clockOut && `Total kerja ${formatDuration(worked)}`}
              {clockOut &&
                clockOut.overtimeMinutes > 0 &&
                ` · lembur ${formatShortDuration(clockOut.overtimeMinutes)} menunggu`}
              {clockOut &&
                clockOut.earlyMinutes > 0 &&
                ` · pulang cepat ${formatDuration(clockOut.earlyMinutes)}`}
            </Text>
          </View>
          <View style={styles.geofence}>
            <Icon name="pin-lime" size={20} />
            <View style={styles.geofenceText}>
              <Text style={styles.geofenceTitle}>
                {clockOut
                  ? `Clock-out di ${sampleOffice.name} · ${formatDistance(clockOut.distance)}`
                  : clockIn
                    ? `Dalam radius kantor · ${formatDistance(clockIn.distance)}`
                    : 'Lokasi dicek saat Clock In'}
              </Text>
              <Text style={styles.geofenceMeta}>
                {sampleOffice.name} · radius {sampleOffice.radiusMeters} m
              </Text>
            </View>
          </View>
          {clockOut ? (
            <Button fullWidth label="Sudah clock-out hari ini" disabled />
          ) : clockIn ? (
            // Clock Out hanya butuh lokasi; izin yang belum ada diminta di layar M32.
            <Button
              fullWidth
              variant="accent"
              label="Clock Out"
              icon="arrow-right"
              onPress={() => router.push('/clock-out')}
            />
          ) : (
            <Button
              fullWidth
              variant="accent"
              label="Clock In"
              icon="arrow-right"
              onPress={startClockIn}
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ringkasan {sampleSummary.month}</Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Lihat riwayat absensi"
              hitSlop={space[12]}
              onPress={() => router.push('/riwayat')}
            >
              <Text style={styles.link}>Lihat riwayat</Text>
            </Pressable>
          </View>
          <View style={styles.stats}>
            <Stat label="Hadir" value={sampleSummary.present} unit="hari" />
            <Stat label="Terlambat" value={sampleSummary.late} unit="kali" />
            <Stat label="Sisa cuti" value={sampleSummary.leaveLeft} unit="hari" />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Task hari ini</Text>
            <Text accessibilityRole="link" onPress={() => router.navigate('/task')} style={styles.link}>
              Lihat semua
            </Text>
          </View>
          <View style={styles.list}>
            {sampleTasks.map((task, index) => (
              <View
                key={task.title}
                accessible
                style={[styles.task, index < sampleTasks.length - 1 && styles.taskBorder]}
              >
                <View style={styles.taskText}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskMeta}>{task.meta}</Text>
                </View>
                {task.status === 'overdue' ? (
                  <Badge tone="warning" label="Overdue" />
                ) : (
                  <Badge tone="neutral" label="In progress" />
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <BottomNav items={mainTabs} active="Beranda" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.canvas,
  },
  content: {
    gap: space[20],
    paddingHorizontal: space[20],
    paddingBottom: space[24],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    flexShrink: 1,
    gap: space[4],
  },
  date: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
  hello: {
    ...textStyle('headingH1'),
    color: color.text.primary,
  },
  bell: {
    alignItems: 'center',
    justifyContent: 'center',
    width: size.iconTarget,
    height: size.iconTarget,
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.full,
    backgroundColor: color.bg.surface,
  },
  missed: {
    gap: space[12],
  },
  card: {
    gap: space[16],
    padding: space[24],
    borderRadius: radius.lg,
    backgroundColor: color.bg.inverse,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    ...textStyle('labelM'),
    color: color.text.inverse,
  },
  clock: {
    gap: space[4],
  },
  clockTime: {
    ...textStyle('numericClock'),
    color: color.text.inverse,
  },
  clockMeta: {
    ...textStyle('caption'),
    color: color.text.inverse,
  },
  geofence: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    padding: space[12],
    borderRadius: radius.md,
    backgroundColor: color.bg.inverseOverlay,
  },
  geofenceText: {
    flex: 1,
    gap: space[4],
  },
  geofenceTitle: {
    ...textStyle('labelM'),
    color: color.text.inverse,
  },
  geofenceMeta: {
    ...textStyle('caption'),
    color: color.text.inverse,
  },
  section: {
    gap: space[12],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...textStyle('headingH3'),
    color: color.text.primary,
  },
  link: {
    ...textStyle('labelM'),
    color: color.text.accent,
  },
  stats: {
    flexDirection: 'row',
    gap: space[8],
  },
  stat: {
    flex: 1,
    gap: space[8],
    padding: space[16],
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.lg,
    backgroundColor: color.bg.surface,
  },
  statLabel: {
    ...textStyle('labelM'),
    color: color.text.secondary,
  },
  statValue: {
    ...textStyle('numericKpi'),
    color: color.text.primary,
  },
  statUnit: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
  list: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.lg,
    backgroundColor: color.bg.surface,
  },
  task: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    padding: space[16],
  },
  taskBorder: {
    borderBottomWidth: 1,
    borderBottomColor: color.border.default,
  },
  taskText: {
    flex: 1,
    gap: space[4],
  },
  taskTitle: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  taskMeta: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
});
