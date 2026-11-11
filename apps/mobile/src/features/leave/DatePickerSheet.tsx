import {
  calendarWeeks,
  formatPeriod,
  formatPickedRange,
  isWeekend,
  pickRangeDate,
  sampleLeaveToday,
  type DateRange,
  type LeaveType,
  type MonthPeriod,
} from '@on-track/core';
import { color, radius, size, space } from '@on-track/tokens';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { textStyle } from '@/theme/text';

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const typeNouns: Record<LeaveType, string> = { cuti: 'cuti', izin: 'izin', sakit: 'sakit', wfh: 'WFH / dinas luar' };

const periodOf = (iso: string): MonthPeriod => ({ year: Number(iso.slice(0, 4)), month: Number(iso.slice(5, 7)) });
const shift = ({ year, month }: MonthPeriod, delta: number): MonthPeriod => {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
};

type DatePickerSheetProps = {
  visible: boolean;
  type: LeaveType;
  value: DateRange;
  onApply: (range: { start: string; end: string }) => void;
  onClose: () => void;
};

/** M58 · Pilih tanggal (bottom sheet). Ketuk tanggal mulai lalu tanggal selesai. */
export function DatePickerSheet({ visible, type, value, onApply, onClose }: DatePickerSheetProps) {
  const { bottom } = useSafeAreaInsets();
  const [range, setRange] = useState<DateRange>(value);
  const [period, setPeriod] = useState<MonthPeriod>(periodOf(value.start ?? sampleLeaveToday));

  function reset() {
    setRange(value);
    setPeriod(periodOf(value.start ?? sampleLeaveToday));
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onShow={reset}>
      <View style={styles.container}>
        <Pressable accessibilityRole="button" accessibilityLabel="Tutup" style={styles.scrim} onPress={onClose} />
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: Math.max(space[24], bottom) }]}>
          <View style={styles.handle} />
          <Text accessibilityRole="header" style={styles.title}>
            Pilih tanggal {typeNouns[type]}
          </Text>
          <Text accessibilityLiveRegion="polite" style={styles.summary}>
            {formatPickedRange(range)}
          </Text>

          <View style={styles.monthRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Bulan sebelumnya"
              onPress={() => setPeriod((current) => shift(current, -1))}
              style={styles.nav}
            >
              <Text style={styles.navText}>‹</Text>
            </Pressable>
            <Text style={styles.month}>{formatPeriod(period)}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Bulan berikutnya"
              onPress={() => setPeriod((current) => shift(current, 1))}
              style={styles.nav}
            >
              <Text style={styles.navText}>›</Text>
            </Pressable>
          </View>

          <View style={styles.week}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={styles.weekday}>
                {day}
              </Text>
            ))}
          </View>
          {calendarWeeks(period).map((week, row) => (
            <View key={row} style={styles.week}>
              {week.map((iso, col) => {
                if (!iso) return <View key={col} style={styles.cell} />;
                const weekend = isWeekend(iso);
                const edge = iso === range.start || iso === range.end;
                const inside = Boolean(range.start && range.end && iso > range.start && iso < range.end);
                const today = iso === sampleLeaveToday;
                return (
                  <Pressable
                    key={iso}
                    accessibilityRole="button"
                    accessibilityLabel={`${Number(iso.slice(8))} ${formatPeriod(period)}${weekend ? ', akhir pekan' : ''}`}
                    accessibilityState={{ selected: edge, disabled: weekend }}
                    disabled={weekend}
                    onPress={() => setRange((current) => pickRangeDate(current, iso))}
                    style={[styles.cell, inside && styles.cellInside, edge && styles.cellEdge, today && !edge && styles.cellToday]}
                  >
                    <Text style={[styles.day, weekend && styles.dayWeekend, edge && styles.dayEdge]}>
                      {Number(iso.slice(8))}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}

          <View style={styles.footer}>
            <Button
              fullWidth
              label="Pakai tanggal ini"
              disabled={!range.start}
              onPress={() => range.start && onApply({ start: range.start, end: range.end ?? range.start })}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: color.bg.scrim,
  },
  sheet: {
    gap: space[8],
    paddingTop: space[12],
    paddingHorizontal: space[20],
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: color.bg.surface,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.border.strong,
  },
  title: {
    ...textStyle('headingH2'),
    marginTop: space[8],
    color: color.text.primary,
  },
  summary: {
    ...textStyle('bodyS'),
    color: color.text.secondary,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nav: {
    alignItems: 'center',
    justifyContent: 'center',
    width: size.iconTarget,
    height: size.iconTarget,
  },
  navText: {
    ...textStyle('headingH2'),
    color: color.text.primary,
  },
  month: {
    ...textStyle('headingH3'),
    color: color.text.primary,
  },
  week: {
    flexDirection: 'row',
  },
  weekday: {
    ...textStyle('caption'),
    flex: 1,
    paddingVertical: space[4],
    color: color.text.secondary,
    textAlign: 'center',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: size.iconTarget,
    borderRadius: radius.md,
  },
  cellInside: {
    borderRadius: 0,
    backgroundColor: color.accent.subtle,
  },
  cellEdge: {
    backgroundColor: color.bg.inverse,
  },
  cellToday: {
    borderWidth: 1,
    borderColor: color.text.primary,
  },
  day: {
    ...textStyle('bodyM'),
    color: color.text.primary,
  },
  dayWeekend: {
    color: color.text.disabled,
  },
  dayEdge: {
    ...textStyle('labelM'),
    color: color.text.inverse,
  },
  footer: {
    marginTop: space[12],
  },
});
