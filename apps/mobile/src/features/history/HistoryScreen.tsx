import {
  CALENDAR_WEEKDAYS,
  calendarWeeks,
  formatDayShort,
  formatPeriod,
  isWeekend,
  sampleAttendance,
  sampleDefaultPeriod,
  sampleEmptyPeriod,
  summarize,
  type DayStatus,
  type MonthPeriod,
} from '@on-track/core';
import { color, radius, space } from '@on-track/tokens';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { TopAppBar } from '@/components/ui/TopAppBar';
import { textStyle } from '@/theme/text';
import { PeriodSheet } from './PeriodSheet';
import { dayMeta, statusBadge, statusDots, statusLabels } from './status';

const goBack = () => (router.canGoBack() ? router.back() : router.replace('/beranda'));
const openDay = (date: string) => router.push(`/riwayat/${date}`);

const legend: DayStatus[] = ['hadir', 'terlambat', 'izin', 'alpha'];

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View accessible accessibilityLabel={`${label} ${value}`} style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/**
 * M15 · Riwayat Absensi, M37 · Pilih Periode (`preview="periode"`), dan M57 · Periode Kosong
 * (`preview="kosong"`, Juni 2026).
 * MOCK: riwayat contoh Juli–Oktober 2026 dari `@on-track/core` sampai API riwayat ada.
 */
export function HistoryScreen({ preview }: { preview?: 'periode' | 'kosong' }) {
  const { bottom } = useSafeAreaInsets();
  const [period, setPeriod] = useState<MonthPeriod>(
    preview === 'kosong' ? sampleEmptyPeriod : sampleDefaultPeriod,
  );
  const [sheetOpen, setSheetOpen] = useState(preview === 'periode');

  const days = sampleAttendance(period);
  const byDate = new Map(days.map((day) => [day.date, day]));
  const summary = summarize(days);

  return (
    <View style={styles.screen}>
      <TopAppBar title="Riwayat Absensi" onBack={goBack} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(space[32], bottom) }]}
      >
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Periode</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Periode ${formatPeriod(period)}. Ketuk untuk mengganti.`}
            onPress={() => setSheetOpen(true)}
            style={styles.select}
          >
            <Text style={styles.selectValue}>{formatPeriod(period)}</Text>
            <Icon name="chevron-down" size={20} />
          </Pressable>
        </View>

        {days.length === 0 ? (
          <View accessible style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="calendar" size={20} />
            </View>
            <Text style={styles.emptyTitle}>Belum ada catatan absensi</Text>
            <Text style={styles.emptyBody}>
              Tidak ada clock-in di periode ini. Pilih periode lain.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.stats}>
              <Stat value={summary.hadir} label="Hadir" />
              <Stat value={summary.terlambat} label="Terlambat" />
              <Stat value={summary.izin} label="Izin" />
              <Stat value={summary.alpha} label="Alpha" />
            </View>

            <View style={styles.calendar}>
              <View style={styles.week}>
                {CALENDAR_WEEKDAYS.map((name) => (
                  <Text key={name} style={styles.weekday}>
                    {name}
                  </Text>
                ))}
              </View>
              {calendarWeeks(period).map((week, index) => (
                <View key={index} style={styles.week}>
                  {week.map((date, cell) => {
                    if (!date) return <View key={`kosong-${cell}`} style={styles.day} />;
                    const record = byDate.get(date);
                    const weekend = isWeekend(date);
                    const dayNumber = Number(date.slice(8));
                    return (
                      <Pressable
                        key={date}
                        accessibilityRole={record ? 'button' : undefined}
                        accessibilityLabel={
                          record
                            ? `${formatDayShort(date)}, ${statusLabels[record.status]}`
                            : `${formatDayShort(date)}${weekend ? ', libur' : ''}`
                        }
                        disabled={!record}
                        onPress={() => openDay(date)}
                        style={[styles.day, weekend && styles.dayOff]}
                      >
                        <Text style={[styles.dayNumber, weekend && styles.dayNumberOff]}>
                          {dayNumber}
                        </Text>
                        <View
                          style={[
                            styles.dot,
                            {
                              backgroundColor: record ? statusDots[record.status] : 'transparent',
                            },
                          ]}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              ))}
              <View style={styles.legend}>
                {legend.map((status) => (
                  <View key={status} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: statusDots[status] }]} />
                    <Text style={styles.legendLabel}>{statusLabels[status]}</Text>
                  </View>
                ))}
              </View>
            </View>

            {days.length > 0 && (
              <View style={styles.list}>
                {days.map((day, index) => {
                  const badge = statusBadge(day);
                  return (
                    <Pressable
                      key={day.date}
                      accessibilityRole="button"
                      accessibilityLabel={`${formatDayShort(day.date)}, ${dayMeta(day)}, ${badge.label}`}
                      onPress={() => openDay(day.date)}
                      style={({ pressed }) => [
                        styles.row,
                        index < days.length - 1 && styles.rowBorder,
                        pressed && styles.rowPressed,
                      ]}
                    >
                      <View style={styles.rowText}>
                        <Text style={styles.rowTitle}>{formatDayShort(day.date)}</Text>
                        <Text style={styles.rowMeta}>{dayMeta(day)}</Text>
                      </View>
                      <Badge tone={badge.tone} label={badge.label} />
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <PeriodSheet
        visible={sheetOpen}
        value={period}
        onApply={(next) => {
          setPeriod(next);
          setSheetOpen(false);
        }}
        onCancel={() => setSheetOpen(false)}
      />
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
  field: {
    gap: space[8],
  },
  fieldLabel: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: space[16],
    paddingVertical: space[12],
    borderWidth: 1,
    borderColor: color.border.control,
    borderRadius: radius.md,
    backgroundColor: color.bg.surface,
  },
  selectValue: {
    ...textStyle('bodyM'),
    color: color.text.primary,
  },
  stats: {
    flexDirection: 'row',
    gap: space[8],
  },
  stat: {
    flex: 1,
    gap: space[2],
    // Figma 12 px di semua sisi; samping 8 px agar "Terlambat" muat satu baris di HP 360–390 px.
    paddingVertical: space[12],
    paddingHorizontal: space[8],
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.md,
    backgroundColor: color.bg.surface,
  },
  statValue: {
    ...textStyle('headingH2'),
    color: color.text.primary,
  },
  statLabel: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
  calendar: {
    gap: space[8],
    padding: space[12],
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.lg,
    backgroundColor: color.bg.surface,
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space[8],
  },
  weekday: {
    ...textStyle('caption'),
    flex: 1,
    color: color.text.secondary,
    textAlign: 'center',
  },
  day: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[4],
    height: 52,
    borderRadius: radius.md,
  },
  dayOff: {
    backgroundColor: color.bg.subtle,
  },
  dayNumber: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  dayNumberOff: {
    color: color.text.disabled,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[12],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  legendLabel: {
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    paddingHorizontal: space[16],
    paddingVertical: space[12],
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: color.border.default,
  },
  rowPressed: {
    backgroundColor: color.bg.hover,
  },
  rowText: {
    flex: 1,
    gap: space[2],
  },
  rowTitle: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  empty: {
    alignItems: 'center',
    gap: space[8],
    paddingVertical: space[32],
    paddingHorizontal: space[24],
  },
  emptyIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    marginBottom: space[8],
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.full,
    backgroundColor: color.bg.surface,
  },
  emptyTitle: {
    ...textStyle('headingH3'),
    color: color.text.primary,
    textAlign: 'center',
  },
  emptyBody: {
    ...textStyle('bodyS'),
    color: color.text.secondary,
    textAlign: 'center',
  },
  rowMeta: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
});
