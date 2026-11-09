import {
  formatFileSize,
  formatLeaveRangeShort,
  formatLeaveSpan,
  formatWorkingDays,
  leaveDayLabels,
  leaveTypeLabels,
  remainingQuota,
  sampleLeaveApprover,
  sampleLeaveDetails,
  type LeaveRequest,
} from '@on-track/core';
import { color, radius, space } from '@on-track/tokens';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { TopAppBar } from '@/components/ui/TopAppBar';
import { textStyle } from '@/theme/text';
import { statusBadges } from './LeaveParts';
import { useLeave } from './LeaveProvider';

/** MOCK: nama depan pengaju di riwayat status ("oleh Dhais"). */
const SUBMITTER = 'Dhais';

type Step = { state: 'done' | 'current' | 'pending' | 'rejected'; title: string; meta: string };

const decisionMeta = (request: LeaveRequest, note: string) =>
  request.decidedAt ? `${request.decidedAt} · ${note}` : note.charAt(0).toUpperCase() + note.slice(1);

function steps(request: LeaveRequest): Step[] {
  const submitted: Step = {
    state: 'done',
    title: 'Diajukan',
    meta: request.submittedAt ? `${request.submittedAt} oleh ${SUBMITTER}` : `oleh ${SUBMITTER}`,
  };
  const synced = `${formatLeaveRangeShort(request)} otomatis tercatat sebagai ${leaveDayLabels[request.type]}`;
  if (request.status === 'disetujui') {
    return [
      submitted,
      { state: 'done', title: `Disetujui ${request.decidedBy ?? 'atasan'}`, meta: decisionMeta(request, 'notifikasi terkirim') },
      { state: 'done', title: 'Tercatat di data kehadiran', meta: synced },
    ];
  }
  if (request.status === 'ditolak') {
    return [
      submitted,
      { state: 'rejected', title: `Ditolak ${request.decidedBy ?? 'atasan'}`, meta: decisionMeta(request, 'alasan terkirim') },
    ];
  }
  return [
    submitted,
    {
      state: 'current',
      title: `Menunggu persetujuan ${sampleLeaveApprover.role}`,
      meta: `Notifikasi terkirim ke ${sampleLeaveApprover.name}`,
    },
    { state: 'pending', title: 'Tercatat di data kehadiran', meta: 'Otomatis setelah disetujui' },
  ];
}

/** Satu baris "Riwayat status" (Figma "Timeline Item"): Done = ink + check, Current = lime, Pending = outline. */
function TimelineRow({ step, last }: { step: Step; last: boolean }) {
  return (
    <View style={styles.step}>
      <View style={styles.rail}>
        <View
          style={[
            styles.dot,
            step.state === 'current' && styles.dotCurrent,
            step.state === 'pending' && styles.dotPending,
          ]}
        >
          {step.state === 'done' && <Icon name="check-12-inverse" size={12} />}
          {step.state === 'rejected' && <Icon name="close-12-inverse" size={12} />}
        </View>
        {!last && <View style={styles.line} />}
      </View>
      <View style={styles.stepText}>
        <Text style={[styles.stepTitle, step.state === 'pending' && styles.muted]}>{step.title}</Text>
        <Text style={styles.stepMeta}>{step.meta}</Text>
      </View>
    </View>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoDivider]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function infoRows(request: LeaveRequest, quotaLeft?: number): { label: string; value: string }[] {
  const rows = [{ label: 'Alasan', value: request.reason }];
  const by = request.decidedBy ? ` oleh ${request.decidedBy}` : '';
  const quota = request.type === 'cuti' && quotaLeft !== undefined;
  if (request.status === 'menunggu') {
    if (request.submittedAt) rows.push({ label: 'Diajukan', value: request.submittedAt });
    rows.push({ label: 'Atasan', value: `${sampleLeaveApprover.name} (${sampleLeaveApprover.role})` });
    if (quota) rows.push({ label: 'Sisa kuota setelah disetujui', value: `${quotaLeft} hari` });
  } else if (request.status === 'disetujui') {
    if (request.decidedAt) rows.push({ label: 'Disetujui', value: `${request.decidedAt}${by}` });
    if (request.decisionNote) rows.push({ label: 'Catatan atasan', value: `"${request.decisionNote}"` });
    if (quota) rows.push({ label: 'Sisa kuota cuti', value: `${quotaLeft} hari` });
  } else {
    if (request.decidedAt) rows.push({ label: 'Ditolak', value: `${request.decidedAt}${by}` });
    if (request.decisionNote) rows.push({ label: 'Alasan penolakan', value: request.decisionNote });
    if (quota) rows.push({ label: 'Sisa kuota cuti', value: `${quotaLeft} hari (tidak berubah)` });
  }
  return rows;
}

/**
 * M17 · Detail Izin (menunggu), M42 (disetujui + tercatat di kehadiran), M43 (ditolak + alasan).
 * MOCK: pengajuan dari memori aplikasi atau contoh Figma; nanti GET /me/leave-requests/{id}.
 */
export function LeaveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bottom } = useSafeAreaInsets();
  const { requests, quota, cancel } = useLeave();
  const samples = Object.values(sampleLeaveDetails);
  const request = requests.find((item) => item.id === id) ?? samples.find((item) => item.id === id);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/izin'));

  if (!request) {
    return (
      <View style={styles.screen}>
        <TopAppBar title="Detail Izin" onBack={goBack} />
        <Text style={styles.missing}>Pengajuan tidak ditemukan. Mungkin sudah dibatalkan.</Text>
      </View>
    );
  }

  const badge = statusBadges[request.status];
  // Pengajuan baru: sisa sebelum pengajuan ini dikurangi hari cutinya.
  const quotaLeft =
    request.quotaLeft ?? (request.type === 'cuti' ? remainingQuota(quota) + quota.pending - request.days : undefined);
  const rows = infoRows(request, quotaLeft);
  const timeline = steps(request);

  function confirmCancel() {
    Alert.alert('Batalkan pengajuan?', `${leaveTypeLabels[request!.type]} · ${formatLeaveSpan(request!)} akan dihapus dan atasan diberi tahu.`, [
      { text: 'Kembali', style: 'cancel' },
      {
        text: 'Batalkan pengajuan',
        style: 'destructive',
        onPress: () => {
          // MOCK: nanti POST /me/leave-requests/{id}/cancel (draf F07).
          cancel(request!.id);
          goBack();
        },
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      <TopAppBar title="Detail Izin" onBack={goBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summary}>
          <View style={styles.summaryTop}>
            <Text accessibilityRole="header" style={styles.summaryTitle}>
              {leaveTypeLabels[request.type]}
            </Text>
            <Badge tone={badge.tone} label={badge.label} />
          </View>
          <Text style={styles.summaryMeta}>
            {formatLeaveSpan(request)} · {formatWorkingDays(request.days)}
          </Text>
        </View>

        <View style={styles.info}>
          {rows.map((row, index) => (
            <InfoRow key={row.label} label={row.label} value={row.value} last={index === rows.length - 1} />
          ))}
        </View>

        {request.attachment && request.status === 'menunggu' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Unduh lampiran ${request.attachment.name}`}
            // MOCK: berkas belum disimpan di server.
            onPress={() => Alert.alert('Lampiran', 'Unduhan tersedia setelah API pengajuan tersambung.')}
            style={styles.file}
          >
            <Icon name="paperclip-20" size={20} />
            <View style={styles.fileText}>
              <Text style={styles.fileName} numberOfLines={1}>
                {request.attachment.name}
              </Text>
              <Text style={styles.fileMeta}>
                {request.attachment.kind} · {formatFileSize(request.attachment.sizeBytes)}
              </Text>
            </View>
            <Icon name="download" size={20} />
          </Pressable>
        )}

        <Text style={styles.sectionLabel}>Riwayat status</Text>
        <View>
          {timeline.map((step, index) => (
            <TimelineRow key={step.title} step={step} last={index === timeline.length - 1} />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(bottom, space[16]) + space[16] }]}>
        {request.status === 'menunggu' && (
          <Button fullWidth variant="secondary" label="Batalkan pengajuan" onPress={confirmCancel} />
        )}
        {request.status === 'disetujui' && (
          <Button fullWidth variant="secondary" label="Lihat di riwayat absensi" onPress={() => router.push('/riwayat')} />
        )}
        {request.status === 'ditolak' && (
          <Button fullWidth label="Ajukan ulang dengan tanggal lain" onPress={() => router.push('/izin/ajukan')} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.surface,
  },
  content: {
    gap: space[16],
    padding: space[20],
  },
  missing: {
    ...textStyle('bodyS'),
    padding: space[20],
    color: color.text.secondary,
  },
  summary: {
    gap: space[8],
    padding: space[16],
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.lg,
    backgroundColor: color.bg.subtle,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[8],
  },
  summaryTitle: {
    ...textStyle('headingH2'),
    flexShrink: 1,
    color: color.text.primary,
  },
  summaryMeta: {
    ...textStyle('bodyS'),
    color: color.text.secondary,
  },
  info: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.lg,
  },
  infoRow: {
    gap: space[2],
    paddingHorizontal: space[16],
    paddingVertical: space[12],
  },
  infoDivider: {
    borderBottomWidth: 1,
    borderBottomColor: color.border.default,
  },
  infoLabel: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
  infoValue: {
    ...textStyle('bodyM'),
    color: color.text.primary,
  },
  file: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    minHeight: 44,
    padding: space[12],
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.md,
  },
  fileText: {
    flex: 1,
    gap: space[2],
  },
  fileName: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  fileMeta: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
  // Figma memakai Label/S tanpa huruf kapital untuk judul bagian ini.
  sectionLabel: {
    ...textStyle('labelS'),
    textTransform: 'none',
    color: color.text.secondary,
  },
  step: {
    flexDirection: 'row',
    gap: space[12],
  },
  rail: {
    alignItems: 'center',
    width: 20,
  },
  dot: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: color.bg.inverse,
  },
  dotCurrent: {
    borderWidth: 1.5,
    borderColor: color.text.primary,
    backgroundColor: color.accent.default,
  },
  dotPending: {
    borderWidth: 1.5,
    borderColor: color.border.control,
    backgroundColor: color.bg.surface,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: color.border.default,
  },
  stepText: {
    flex: 1,
    gap: space[2],
    paddingBottom: space[20],
  },
  stepTitle: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  muted: {
    color: color.text.secondary,
  },
  stepMeta: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
  footer: {
    paddingTop: space[12],
    paddingHorizontal: space[20],
    borderTopWidth: 1,
    borderTopColor: color.border.default,
    backgroundColor: color.bg.surface,
  },
});
