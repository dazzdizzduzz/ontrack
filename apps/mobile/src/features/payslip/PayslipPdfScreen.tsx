import { formatPayslipAmount, formatRupiah, latestPaidPayslip, samplePayslipOwner, samplePayslips } from '@on-track/core';
import { color, space } from '@on-track/tokens';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TopAppBar } from '@/components/ui/TopAppBar';
import { textStyle } from '@/theme/text';
import { BottomBar } from './PayslipParts';

const back = () => (router.canGoBack() ? router.back() : router.replace('/slip-gaji'));

/**
 * M47 · Pratinjau slip PDF. MOCK: PDF berkata sandi (tanggal lahir) dibuat server lewat
 * GET /me/payslips/{period}/pdf (draf F12); di sini baru pratinjau isi slip.
 */
export function PayslipPdfScreen() {
  const { periode } = useLocalSearchParams<{ periode?: string }>();
  const [saved, setSaved] = useState(false);
  const slip =
    samplePayslips.find((item) => item.period === periode && item.status === 'dibayar') ?? latestPaidPayslip(samplePayslips);
  if (!slip) return null;
  const owner = samplePayslipOwner;
  const fileName = slip.fileName ?? 'Slip_Gaji.pdf';

  return (
    <View style={styles.screen}>
      <TopAppBar title={fileName} onBack={back} />
      <ScrollView contentContainerStyle={styles.content}>
        {saved && (
          <Alert tone="success" title="Slip diunduh" announce>
            {fileName} tersimpan. Buka dengan tanggal lahirmu (DDMMYYYY) sebagai kata sandi.
          </Alert>
        )}
        <View accessible accessibilityLabel={`Pratinjau ${fileName}`} style={styles.paper}>
          <View style={styles.brand}>
            <View style={styles.dot} />
            <Text style={styles.brandText}>{owner.company} · On-Track</Text>
          </View>
          <Text style={styles.paperTitle}>SLIP GAJI · {slip.label.toUpperCase()}</Text>
          <Text style={styles.meta}>
            {owner.name} · {owner.position} · NIK {owner.employeeNumber}
          </Text>
          {slip.items.map((item) => (
            <View key={item.label} style={styles.row}>
              <Text style={styles.rowLabel}>{item.pdfLabel ?? item.label}</Text>
              <Text style={styles.rowValue}>{formatPayslipAmount(item, false)}</Text>
            </View>
          ))}
          <View style={styles.netRow}>
            <Text style={styles.netText}>Gaji bersih</Text>
            <Text style={styles.netText}>{formatRupiah(slip.net ?? '0.00')}</Text>
          </View>
          <Text style={[styles.meta, styles.foot]}>
            Disetujui {slip.approvedBy} · dokumen rahasia, hanya untuk penerima
          </Text>
        </View>
        <Text style={styles.pageInfo}>Halaman 1 dari 1 · {slip.fileSizeKb} KB</Text>
      </ScrollView>
      <BottomBar>
        <View style={styles.half}>
          <Button
            variant="secondary"
            fullWidth
            label="Bagikan"
            icon="send-ink"
            // MOCK: berbagi berkas PDF perlu expo-sharing setelah file diunduh dari API.
            onPress={() => Share.share({ title: fileName, message: `${fileName} (dilindungi kata sandi)` })}
          />
        </View>
        <View style={styles.half}>
          <Button fullWidth label="Unduh" icon="download-inverse" onPress={() => setSaved(true)} />
        </View>
      </BottomBar>
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
    paddingHorizontal: space[32],
    paddingVertical: space[48],
  },
  paper: {
    gap: space[8],
    padding: space[20],
    borderWidth: 1,
    borderColor: color.border.default,
    backgroundColor: color.bg.surface,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.accent.default,
  },
  brandText: {
    ...textStyle('caption'),
    color: color.text.primary,
  },
  paperTitle: {
    ...textStyle('labelM'),
    marginTop: space[4],
    color: color.text.primary,
  },
  meta: {
    ...textStyle('caption'),
    marginBottom: space[4],
    color: color.text.secondary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space[12],
  },
  rowLabel: {
    ...textStyle('caption'),
    flex: 1,
    color: color.text.secondary,
  },
  rowValue: {
    ...textStyle('caption'),
    color: color.text.primary,
  },
  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space[4],
    paddingTop: space[12],
    borderTopWidth: 1,
    borderTopColor: color.border.default,
  },
  netText: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  foot: {
    marginTop: space[24],
  },
  pageInfo: {
    ...textStyle('caption'),
    color: color.text.secondary,
    textAlign: 'center',
  },
  half: {
    flex: 1,
  },
});
