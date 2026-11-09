import { color, radius, space } from '@on-track/tokens';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { textStyle } from '@/theme/text';

export type ResultRow = { label: string; value: ReactNode };

function Row({ label, value, last }: ResultRow & { last?: boolean }) {
  return (
    <View accessible style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      {typeof value === 'string' ? <Text style={styles.rowValue}>{value}</Text> : value}
    </View>
  );
}

// Kembali ke Beranda paling bawah di tumpukan; dibuka langsung lewat URL, Beranda dibuat baru.
const backToHome = () => (router.canDismiss() ? router.dismissAll() : router.replace('/beranda'));

type AttendanceResultProps = {
  /** success: lingkaran aksen dengan centang (M04, M14). warning: jam kuning (M28, M33). */
  tone: 'success' | 'warning';
  title: string;
  subtitle: string;
  rows: ResultRow[];
  note: string;
  /** Tombol utama; bawaannya "Kembali ke Beranda". */
  primary?: { label: string; onPress: () => void };
  /** Tombol kedua di bawah tombol utama (M41). */
  secondary?: ReactNode;
};

/** Layar hasil: M04, M28 (clock-in), M14, M33, M50 (clock-out), dan M41 (pengajuan terkirim). */
export function AttendanceResult({
  tone,
  title,
  subtitle,
  rows,
  note,
  primary = { label: 'Kembali ke Beranda', onPress: backToHome },
  secondary,
}: AttendanceResultProps) {
  const { top, bottom } = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: top + space[48], paddingBottom: Math.max(space[32], bottom) },
        ]}
      >
        <View style={styles.spacer} />
        <View style={[styles.mark, tone === 'success' ? styles.markSuccess : styles.markLate]}>
          <Icon name={tone === 'success' ? 'check-large' : 'clock-large'} size={48} />
        </View>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.detail}>
          {rows.map((row, index) => (
            <Row key={row.label} {...row} last={index === rows.length - 1} />
          ))}
        </View>

        <Text style={styles.note}>{note}</Text>
        <View style={styles.spacer} />
        <View style={styles.actions}>
          <Button fullWidth label={primary.label} onPress={primary.onPress} />
          {secondary}
        </View>
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
    alignItems: 'center',
    gap: space[24],
    paddingHorizontal: space[24],
  },
  actions: {
    alignSelf: 'stretch',
    gap: space[8],
  },
  spacer: {
    flex: 1,
  },
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 112,
    height: 112,
    borderRadius: radius.full,
  },
  markSuccess: {
    backgroundColor: color.accent.default,
  },
  markLate: {
    backgroundColor: color.status.warningBg,
  },
  heading: {
    alignItems: 'center',
    gap: space[8],
  },
  title: {
    ...textStyle('headingH1'),
    color: color.text.primary,
  },
  subtitle: {
    ...textStyle('bodyM'),
    color: color.text.secondary,
  },
  detail: {
    alignSelf: 'stretch',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[12],
    padding: space[16],
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: color.border.default,
  },
  rowLabel: {
    ...textStyle('bodyS'),
    color: color.text.secondary,
  },
  rowValue: {
    ...textStyle('labelM'),
    flexShrink: 1,
    color: color.text.primary,
    textAlign: 'right',
  },
  note: {
    ...textStyle('caption'),
    color: color.text.secondary,
    textAlign: 'center',
  },
});
