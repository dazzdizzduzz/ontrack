import {
  formatPeriod,
  sampleAttendance,
  samplePeriods,
  summarize,
  type MonthPeriod,
} from '@on-track/core';
import { color, radius, space } from '@on-track/tokens';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { textStyle } from '@/theme/text';
import { summaryLine } from './status';

type PeriodSheetProps = {
  visible: boolean;
  value: MonthPeriod;
  onApply: (period: MonthPeriod) => void;
  onCancel: () => void;
};

const same = (a: MonthPeriod, b: MonthPeriod) => a.year === b.year && a.month === b.month;

/** Periode yang masih berjalan; contoh Figma: Oktober 2026. */
const current = samplePeriods[0];

function description(period: MonthPeriod): string {
  const days = sampleAttendance(period);
  if (current && same(period, current)) return `Berjalan · ${days.length} hari tercatat`;
  if (days.length === 0) return 'Belum ada catatan absensi';
  return summaryLine(summarize(days));
}

/** M37 · Pilih periode (bottom sheet): pilihan tunggal, berlaku setelah "Terapkan". */
export function PeriodSheet({ visible, value, onApply, onCancel }: PeriodSheetProps) {
  const { bottom } = useSafeAreaInsets();
  const [selected, setSelected] = useState(value);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      onShow={() => setSelected(value)}
    >
      <View style={styles.container}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tutup"
          style={styles.scrim}
          onPress={onCancel}
        />
        <View
          accessibilityViewIsModal
          style={[styles.sheet, { paddingBottom: Math.max(space[32], bottom) }]}
        >
          <View style={styles.handle} />
          <Text accessibilityRole="header" style={styles.title}>
            Pilih periode
          </Text>
          <View accessibilityRole="radiogroup" style={styles.options}>
            {samplePeriods.map((period) => {
              const checked = same(period, selected);
              return (
                <Pressable
                  key={`${period.year}-${period.month}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked }}
                  onPress={() => setSelected(period)}
                  style={styles.option}
                >
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>{formatPeriod(period)}</Text>
                    <Text style={styles.optionMeta}>{description(period)}</Text>
                  </View>
                  <View style={[styles.radio, checked && styles.radioChecked]}>
                    {checked && <View style={styles.radioDot} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Button fullWidth label="Terapkan" onPress={() => onApply(selected)} />
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
    gap: space[16],
    paddingTop: space[12],
    paddingHorizontal: space[24],
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
    color: color.text.primary,
  },
  options: {
    gap: space[4],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    minHeight: 72,
  },
  optionText: {
    flex: 1,
    gap: space[4],
  },
  optionTitle: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  optionMeta: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
  radio: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: color.border.control,
    borderRadius: radius.full,
  },
  radioChecked: {
    borderColor: color.text.primary,
    backgroundColor: color.text.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: color.bg.surface,
  },
});
