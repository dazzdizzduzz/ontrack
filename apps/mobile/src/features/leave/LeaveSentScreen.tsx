import {
  formatLeaveRange,
  formatLeaveDays,
  leaveTypeLabels,
  parseDateInput,
  sampleLeaveApprover,
  sampleLeaveDetails,
  sampleLeaveDraft,
  workingDaysBetween,
  type LeaveRequest,
} from '@on-track/core';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AttendanceResult } from '@/features/attendance/AttendanceResult';
import { statusBadges } from './LeaveParts';
import { useLeave } from './LeaveProvider';

/** Contoh M41 bila dibuka langsung lewat URL. */
function sampleSent(): LeaveRequest {
  const start = parseDateInput(sampleLeaveDraft.start) ?? '2026-10-06';
  const end = parseDateInput(sampleLeaveDraft.end) ?? '2026-10-08';
  return {
    id: 'cuti-contoh',
    type: 'cuti',
    start,
    end,
    days: workingDaysBetween(start, end),
    reason: sampleLeaveDraft.reason,
    status: 'menunggu',
  };
}

const backToList = () => (router.canDismiss() ? router.dismissTo('/izin') : router.replace('/izin'));

/** M41 · Pengajuan Terkirim: status Menunggu, atasan dinotifikasi (US-04 AC-1). */
export function LeaveSentScreen() {
  const { lastSubmitted, quota } = useLeave();
  const request = lastSubmitted ?? sampleSent();
  const range = formatLeaveRange(request).split(' · ')[0];
  // Sisa sebelum pengajuan ini; sesudah disetujui berkurang sebanyak hari cuti.
  const before = quota.total - quota.used;
  const badge = statusBadges[request.status];

  return (
    <View style={styles.screen}>
      <AttendanceResult
        tone="success"
        title="Pengajuan terkirim"
        subtitle={`${leaveTypeLabels[request.type]} · ${range}`}
        rows={[
          { label: 'Status', value: <Badge tone={badge.tone} label={badge.label} /> },
          { label: 'Durasi', value: `${formatLeaveDays(request.days)} kerja` },
          { label: 'Atasan', value: sampleLeaveApprover.name },
          { label: 'Notifikasi', value: 'Terkirim ke atasan' },
          {
            label: 'Sisa kuota',
            value:
              request.type === 'cuti'
                ? `${before} → ${before - request.days} hari bila disetujui`
                : 'Tidak berubah',
          },
        ]}
        note="Kamu akan mendapat notifikasi saat atasan menyetujui atau menolak pengajuan ini."
        primary={{
          label: 'Lihat detail pengajuan',
          onPress: () =>
            router.replace({
              pathname: '/izin/[id]',
              params: { id: lastSubmitted?.id ?? sampleLeaveDetails.menunggu.id },
            }),
        }}
        secondary={<Button fullWidth variant="ghost" label="Kembali ke Izin & Cuti" onPress={backToList} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
