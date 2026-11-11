import { formatLeaveRangeShort, leaveTypeLabels, sampleLeaveApprover, type LeaveRequest } from '@on-track/core';
import { color, radius, size, space } from '@on-track/tokens';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/Icon';
import { textStyle } from '@/theme/text';
import { statusBadges } from './LeaveParts';

type LeaveMenuSheetProps = {
  request: LeaveRequest | null;
  onDetail: (request: LeaveRequest) => void;
  onCancel: (request: LeaveRequest) => void;
  onClose: () => void;
};

/** M59 · Menu pengajuan: lihat detail, atau batalkan selama masih menunggu. */
export function LeaveMenuSheet({ request, onDetail, onCancel, onClose }: LeaveMenuSheetProps) {
  const { bottom } = useSafeAreaInsets();
  const pending = request?.status === 'menunggu';
  const status = request
    ? pending
      ? `Menunggu persetujuan ${sampleLeaveApprover.name}`
      : `${statusBadges[request.status].label}${request.decidedBy ? ` oleh ${request.decidedBy}` : ''}`
    : '';

  return (
    <Modal visible={Boolean(request)} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Pressable accessibilityRole="button" accessibilityLabel="Tutup" style={styles.scrim} onPress={onClose} />
        {request && (
          <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: Math.max(space[24], bottom) }]}>
            <View style={styles.handle} />
            <View style={styles.head}>
              <Text accessibilityRole="header" style={styles.title}>
                {leaveTypeLabels[request.type]} · {formatLeaveRangeShort(request)}/{request.end.slice(0, 4)}
              </Text>
              <Text style={styles.meta}>{status}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => onDetail(request)} style={styles.item}>
              <Icon name="eye" size={20} />
              <Text style={styles.itemText}>Lihat detail</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !pending }}
              disabled={!pending}
              onPress={() => onCancel(request)}
              style={[styles.item, !pending && styles.itemDisabled]}
            >
              <Icon name="close-danger" size={20} />
              <Text style={[styles.itemText, styles.danger]}>Batalkan pengajuan</Text>
            </Pressable>
            <Text style={styles.note}>
              {pending
                ? 'Pengajuan hanya bisa dibatalkan selama masih menunggu.'
                : `Sudah ${statusBadges[request.status].label.toLowerCase()}, tidak bisa dibatalkan.`}
            </Text>
          </View>
        )}
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
    gap: space[4],
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
  head: {
    gap: space[2],
    paddingTop: space[12],
    paddingBottom: space[8],
  },
  title: {
    ...textStyle('headingH3'),
    color: color.text.primary,
  },
  meta: {
    ...textStyle('bodyS'),
    color: color.text.secondary,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    minHeight: size.iconTarget + space[8],
  },
  itemDisabled: {
    opacity: 0.4,
  },
  itemText: {
    ...textStyle('bodyM'),
    color: color.text.primary,
  },
  danger: {
    color: color.status.dangerFg,
  },
  note: {
    ...textStyle('caption'),
    paddingTop: space[8],
    color: color.text.secondary,
  },
});
