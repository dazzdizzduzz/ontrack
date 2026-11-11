import { formatPayslipAmount, formatRupiah, type Payslip } from '@on-track/core';
import { color, radius, size, space } from '@on-track/tokens';
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { textStyle } from '@/theme/text';

/** Bar aksi menempel di bawah layar (M09, M47, M48). */
export function BottomBar({ children }: { children: ReactNode }) {
  const { bottom } = useSafeAreaInsets();
  return <View style={[styles.bottomBar, { paddingBottom: Math.max(space[16], bottom) }]}>{children}</View>;
}

/** Kartu Pendapatan / Potongan M09. */
export function ItemCard({ slip, kind }: { slip: Payslip; kind: 'earning' | 'deduction' }) {
  const earning = kind === 'earning';
  const items = slip.items.filter((item) => item.kind === kind);
  const total = (earning ? slip.gross : slip.deductions) ?? '0.00';
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.cardTitle}>
        {earning ? 'Pendapatan' : 'Potongan'}
      </Text>
      <View style={styles.rows}>
        {items.map((item) => (
          <View key={item.label} style={styles.row}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowValue}>{formatPayslipAmount(item)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalText}>{earning ? 'Total pendapatan' : 'Total potongan'}</Text>
        <Text style={[styles.totalText, !earning && styles.minus]}>
          {earning ? formatRupiah(total) : `– ${formatRupiah(total)}`}
        </Text>
      </View>
    </View>
  );
}

/** M09 · Pilih periode slip (bottom sheet, pilih langsung). */
export function PeriodSheet({
  visible,
  slips,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  slips: Payslip[];
  value: string;
  onSelect: (period: string) => void;
  onClose: () => void;
}) {
  const { bottom } = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetContainer}>
        <Pressable accessibilityRole="button" accessibilityLabel="Tutup" style={styles.scrim} onPress={onClose} />
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: Math.max(space[32], bottom) }]}>
          <View style={styles.handle} />
          <Text accessibilityRole="header" style={styles.sheetTitle}>
            Pilih periode
          </Text>
          <View accessibilityRole="radiogroup">
            {slips.map((slip) => {
              const checked = slip.period === value;
              return (
                <Pressable
                  key={slip.period}
                  accessibilityRole="radio"
                  accessibilityState={{ checked }}
                  onPress={() => onSelect(slip.period)}
                  style={styles.option}
                >
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>{slip.label}</Text>
                    <Text style={styles.optionMeta}>{slip.net ? formatRupiah(slip.net) : 'Belum terbit'}</Text>
                  </View>
                  <View style={[styles.radio, checked && styles.radioChecked]}>
                    {checked && <View style={styles.radioDot} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Button variant="secondary" fullWidth label="Batal" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    gap: space[12],
    paddingTop: space[12],
    paddingHorizontal: space[20],
    borderTopWidth: 1,
    borderTopColor: color.border.default,
    backgroundColor: color.bg.surface,
  },
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.lg,
    backgroundColor: color.bg.surface,
  },
  cardTitle: {
    ...textStyle('labelS'),
    paddingHorizontal: space[16],
    paddingVertical: space[12],
    borderBottomWidth: 1,
    borderBottomColor: color.border.default,
    color: color.text.secondary,
  },
  rows: {
    paddingVertical: space[4],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space[12],
    paddingHorizontal: space[16],
    paddingVertical: space[8],
  },
  rowLabel: {
    ...textStyle('bodyS'),
    flex: 1,
    color: color.text.secondary,
  },
  rowValue: {
    ...textStyle('bodyS'),
    color: color.text.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space[12],
    paddingHorizontal: space[16],
    paddingVertical: space[12],
    borderTopWidth: 1,
    borderTopColor: color.border.default,
  },
  totalText: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  minus: {
    color: color.status.dangerFg,
  },
  sheetContainer: {
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
  sheetTitle: {
    ...textStyle('headingH2'),
    color: color.text.primary,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    minHeight: size.iconTarget + space[20],
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
