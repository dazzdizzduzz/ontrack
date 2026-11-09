import {
  formatLeaveRange,
  leaveTypeLabels,
  type LeaveQuota,
  type LeaveRequest,
  type LeaveStatus,
} from '@on-track/core';
import { color, radius, space } from '@on-track/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { textStyle } from '@/theme/text';

export const statusBadges: Record<LeaveStatus, { tone: BadgeTone; label: string }> = {
  menunggu: { tone: 'warning', label: 'Menunggu' },
  disetujui: { tone: 'success', label: 'Disetujui' },
  ditolak: { tone: 'danger', label: 'Ditolak' },
};

/** Kuota cuti tahunan (M16, M05). Sisa tidak mengurangi pengajuan yang masih menunggu. */
export function QuotaCard({ quota, muted }: { quota: LeaveQuota; muted?: boolean }) {
  const ratio = Math.min(1, quota.used / quota.total);
  return (
    <View
      accessible
      accessibilityLabel={`Cuti tahunan terpakai ${quota.used} dari ${quota.total} hari, sisa ${quota.total - quota.used} hari`}
      style={[styles.quota, muted && styles.quotaMuted]}
    >
      <View style={styles.quotaTop}>
        <Text style={styles.quotaLabel}>Cuti tahunan terpakai</Text>
        <Text style={styles.quotaMeta}>
          {quota.used} dari {quota.total} hari · sisa {quota.total - quota.used}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
    </View>
  );
}

/** Kartu pengajuan di M16. */
export function LeaveCard({ request, onPress }: { request: LeaveRequest; onPress?: () => void }) {
  const badge = statusBadges[request.status];
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${leaveTypeLabels[request.type]}, ${formatLeaveRange(request)}, ${badge.label}. ${request.reason}`}
      disabled={!onPress}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>{leaveTypeLabels[request.type]}</Text>
        <Badge tone={badge.tone} label={badge.label} />
      </View>
      <View style={styles.cardDate}>
        <Icon name="calendar-16" size={16} />
        <Text style={styles.cardDateText}>{formatLeaveRange(request)}</Text>
      </View>
      <Text style={styles.cardReason}>{request.reason}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  quota: {
    gap: space[12],
    padding: space[16],
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.lg,
    backgroundColor: color.bg.surface,
  },
  quotaMuted: {
    backgroundColor: color.bg.subtle,
  },
  quotaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[8],
  },
  quotaLabel: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  quotaMeta: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
  track: {
    height: 8,
    overflow: 'hidden',
    borderRadius: radius.full,
    backgroundColor: color.bg.hover,
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: color.accent.default,
  },
  card: {
    gap: space[8],
    padding: space[16],
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.lg,
    backgroundColor: color.bg.surface,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[8],
  },
  cardTitle: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  cardDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
  },
  cardDateText: {
    ...textStyle('bodyS'),
    color: color.text.secondary,
  },
  cardReason: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
});
