import { formatClock, formatDuration, formatShortDuration } from '@on-track/core';
import { color, radius, space } from '@on-track/tokens';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { textStyle } from '@/theme/text';
import { useAttendance } from './AttendanceProvider';
import {
  clockOutRecordFor,
  clockOutSamples,
  sampleClockIn,
  sampleSchedule,
  summaryFor,
  TENANT_TIME_ZONE,
  type ClockOutScenario,
} from './data';
import { EarlyLeaveSheet } from './EarlyLeaveSheet';
import {
  AttendanceTopBar,
  LocationFixButton,
  LocationVerification,
  stepTextStyle,
} from './LocationVerification';
import { useLocationCheck } from './useLocationCheck';
import { useNow } from './useNow';

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View accessible style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, strong && styles.summaryValueStrong]}>{value}</Text>
    </View>
  );
}

/**
 * M32 · Konfirmasi, M34 · Pulang Cepat (bottom sheet), M35 · Ditolak (Luar Area).
 * Tanpa `scenario`, jam dan GPS dari perangkat; dengan `scenario`, contoh Figma (lihat data.ts).
 */
export function ClockOutScreen({ scenario }: { scenario?: ClockOutScenario }) {
  const { top, bottom } = useSafeAreaInsets();
  const { clockIn, saveClockOut } = useAttendance();
  const sample = scenario ? clockOutSamples[scenario] : undefined;
  const check = useLocationCheck(sample);
  const { live, geofence, location, distance } = check;
  const now = useNow();

  // Dibuka lewat URL tanpa clock-in: memakai clock-in contoh 08:52 agar ringkasan tetap terisi.
  const start = (live && clockIn) || sampleClockIn;
  const time = sample ? sample.time : formatClock(now, TENANT_TIME_ZONE);
  const summary = summaryFor(start, time);
  const early = summary.earlyMinutes > 0;
  const [sheetOpen, setSheetOpen] = useState(scenario === 'pulang-cepat');

  function finish(note?: string) {
    // MOCK: belum dikirim ke server. Saat integrasi, server mencatat jam clock-out sendiri,
    // menilai ulang radius, dan membuat pengajuan lembur untuk Team Lead (W34).
    saveClockOut(clockOutRecordFor(start, time, distance, note));
    setSheetOpen(false);
    router.replace('/clock-out-berhasil');
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: top + space[24], paddingBottom: Math.max(space[32], bottom) },
        ]}
      >
        <AttendanceTopBar title="Clock Out" />
        <LocationVerification
          check={check}
          action="Clock-out"
          outsideMessage="Kamu di luar radius kantor. Kembali ke area kantor, lalu coba lagi."
        />

        {geofence === 'dalam-area' && (
          <>
            <Text style={stepTextStyle}>2. Ringkasan jam kerja</Text>
            <View style={styles.summary}>
              <SummaryRow
                label="Clock-in"
                value={`${start.time} · ${start.status.status === 'hadir' ? 'Hadir' : 'Terlambat'}`}
              />
              <SummaryRow label="Clock-out" value={time} />
              <SummaryRow label="Total jam kerja" value={formatDuration(summary.workedMinutes)} strong />
              {early ? (
                <SummaryRow label="Jam pulang" value={sampleSchedule.end} strong />
              ) : (
                <SummaryRow
                  label="Lembur (estimasi)"
                  value={
                    summary.overtimeMinutes > 0
                      ? formatShortDuration(summary.overtimeMinutes)
                      : 'Tidak ada'
                  }
                  strong
                />
              )}
            </View>
            <Text style={styles.note}>
              {early
                ? 'Clock-out sebelum jam pulang akan tercatat sebagai Pulang Cepat.'
                : `${summary.overtimeMinutes > 0 ? 'Perlu persetujuan atasan. ' : ''}Lembur dihitung jika clock-out lebih dari 30 menit setelah jam pulang (${sampleSchedule.end}). Batas lembur 3 jam/hari.`}
            </Text>
          </>
        )}

        <View style={styles.spacer} />

        {geofence === 'dalam-area' ? (
          <Button
            fullWidth
            variant="accent"
            label="Clock Out sekarang"
            icon="arrow-right"
            onPress={() => (early ? setSheetOpen(true) : finish())}
          />
        ) : (
          <>
            {location.state !== 'mencari' && <LocationFixButton check={check} retryOutside />}
            <Button fullWidth label="Clock Out" disabled />
          </>
        )}
      </ScrollView>

      {early && (
        <EarlyLeaveSheet
          visible={sheetOpen}
          time={time}
          earlyMinutes={summary.earlyMinutes}
          initialNote={sample?.note}
          onConfirm={finish}
          onCancel={() => setSheetOpen(false)}
        />
      )}
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
  summary: {
    paddingHorizontal: space[16],
    paddingVertical: space[8],
    borderRadius: radius.lg,
    backgroundColor: color.bg.subtle,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space[4],
    paddingVertical: space[12],
  },
  summaryLabel: {
    ...textStyle('bodyS'),
    flexShrink: 0,
    color: color.text.secondary,
  },
  summaryValue: {
    ...textStyle('bodyM'),
    flexShrink: 1,
    color: color.text.primary,
    textAlign: 'right',
  },
  summaryValueStrong: {
    ...textStyle('labelM'),
  },
  note: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
  spacer: {
    flex: 1,
  },
});
