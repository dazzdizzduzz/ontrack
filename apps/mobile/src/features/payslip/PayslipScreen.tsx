import { formatRupiah, latestPaidPayslip, payslipStatusLabels, samplePayslips } from '@on-track/core';
import { color, radius, space } from '@on-track/tokens';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { TopAppBar } from '@/components/ui/TopAppBar';
import { textStyle } from '@/theme/text';
import { BottomBar, ItemCard, PeriodSheet } from './PayslipParts';

const back = () => (router.canGoBack() ? router.back() : router.replace('/profil'));

/**
 * M09 · Slip gaji milik sendiri dan M48 · Slip belum terbit (FR-26, US-11 AC-2). Pratinjau lewat
 * `?state=belum` (Oktober). MOCK: `samplePayslips`; nanti GET /me/payslips (draf F12).
 */
export function PayslipScreen() {
  const { state } = useLocalSearchParams<{ state?: string }>();
  const slips = samplePayslips;
  const latest = latestPaidPayslip(slips);
  // Parameter rute bisa baru terbaca setelah render pertama, jadi pratinjau dihitung, bukan nilai awal state.
  const [chosen, setChosen] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const period = chosen ?? (state === 'belum' ? slips[0]?.period : latest?.period);
  const slip = slips.find((item) => item.period === period) ?? latest;
  if (!slip) return null;
  const issued = slip.status === 'dibayar';

  return (
    <View style={styles.screen}>
      <TopAppBar title="Slip Gaji" onBack={back} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Periode</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Periode ${slip.label}. Ganti periode`}
            onPress={() => setSheetOpen(true)}
            style={styles.select}
          >
            <Text style={styles.selectText}>{slip.label}</Text>
            <Icon name="chevron-down" size={20} />
          </Pressable>
        </View>

        {issued ? (
          <>
            <View accessible style={styles.netCard}>
              <View style={styles.netTop}>
                <Text style={styles.netLabel}>Gaji bersih diterima</Text>
                <Text style={styles.netStatus}>{payslipStatusLabels.dibayar}</Text>
              </View>
              <Text style={styles.netValue}>{formatRupiah(slip.net ?? '0.00')}</Text>
              <Text style={styles.netMeta}>
                Ditransfer {slip.paidAt} · {slip.bankAccount}
              </Text>
            </View>
            <ItemCard slip={slip} kind="earning" />
            <ItemCard slip={slip} kind="deduction" />
          </>
        ) : (
          <View style={styles.pending}>
            <View style={styles.pendingIcon}>
              <Icon name="clock-muted" size={24} />
            </View>
            <Text accessibilityRole="header" style={styles.pendingTitle}>
              Slip {slip.month} belum terbit
            </Text>
            <Text style={styles.pendingText}>
              Slip terbit setelah payroll disetujui CEO. Kamu akan menerima notifikasi.
            </Text>
            {latest && (
              <Button
                variant="secondary"
                label={`Lihat slip ${latest.month}`}
                icon="arrow-right"
                onPress={() => setChosen(latest.period)}
              />
            )}
          </View>
        )}

        <View style={styles.privacy}>
          <Icon name="lock-16" size={16} />
          <Text style={styles.privacyText}>Slip ini hanya dapat dilihat oleh kamu.</Text>
        </View>
      </ScrollView>

      <BottomBar>
        <View style={styles.grow}>
          <Button
            fullWidth
            label="Unduh PDF"
            icon={issued ? 'download-inverse' : 'download'}
            disabled={!issued}
            onPress={() => router.push({ pathname: '/slip-gaji/pdf', params: { periode: slip.period } })}
          />
        </View>
      </BottomBar>

      <PeriodSheet
        visible={sheetOpen}
        slips={slips}
        value={slip.period}
        onClose={() => setSheetOpen(false)}
        onSelect={(next) => {
          setChosen(next);
          setSheetOpen(false);
        }}
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
    minHeight: 52,
    paddingHorizontal: space[16],
    borderWidth: 1,
    borderColor: color.border.control,
    borderRadius: radius.md,
    backgroundColor: color.bg.surface,
  },
  selectText: {
    ...textStyle('bodyM'),
    color: color.text.primary,
  },
  netCard: {
    gap: space[8],
    padding: space[20],
    borderRadius: radius.lg,
    backgroundColor: color.bg.inverse,
  },
  netTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[12],
  },
  netLabel: {
    ...textStyle('bodyS'),
    color: color.text.inverse,
  },
  netStatus: {
    ...textStyle('labelS'),
    color: color.text.inverse,
  },
  netValue: {
    ...textStyle('numericKpi'),
    color: color.text.inverse,
  },
  netMeta: {
    ...textStyle('caption'),
    color: color.text.inverse,
  },
  pending: {
    alignItems: 'center',
    gap: space[12],
    paddingTop: space[32],
    paddingBottom: space[24],
    paddingHorizontal: space[12],
  },
  pendingIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.full,
    backgroundColor: color.bg.subtle,
  },
  pendingTitle: {
    ...textStyle('headingH3'),
    color: color.text.primary,
    textAlign: 'center',
  },
  pendingText: {
    ...textStyle('bodyS'),
    color: color.text.secondary,
    textAlign: 'center',
  },
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  grow: {
    flex: 1,
  },
  privacyText: {
    ...textStyle('caption'),
    flex: 1,
    color: color.text.secondary,
  },
});
