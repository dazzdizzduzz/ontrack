import type { AppNotification, NotificationKind } from '@on-track/core';
import { color, radius, space } from '@on-track/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';
import { textStyle } from '@/theme/text';

const icons: Record<NotificationKind, IconName> = {
  leave_approved: 'check',
  leave_rejected: 'close-20',
  task_assigned: 'task',
  task_revision: 'revision',
  task_overdue: 'clock',
  task_comment: 'message',
  clockout_reminder: 'bell',
  payslip_published: 'wallet',
};

/** Item notifikasi M20. Belum dibaca = latar aksen + titik merah (Figma "Notification Item"). */
export function NotificationItem({
  notification,
  onPress,
}: {
  notification: AppNotification;
  onPress: () => void;
}) {
  const { unread } = notification;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${unread ? 'Belum dibaca. ' : ''}${notification.title}. ${notification.body}. ${notification.time}`}
      onPress={onPress}
      style={({ pressed }) => [styles.item, unread && styles.unread, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Icon name={icons[notification.kind]} size={20} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.body}>{notification.body}</Text>
        <Text style={styles.time}>{notification.time}</Text>
      </View>
      <View style={[styles.dot, unread && styles.dotUnread]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[12],
    padding: space[16],
    borderBottomWidth: 1,
    borderBottomColor: color.border.default,
    backgroundColor: color.bg.surface,
  },
  unread: {
    backgroundColor: color.accent.subtle,
  },
  pressed: {
    opacity: 0.8,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.full,
    backgroundColor: color.bg.surface,
  },
  text: {
    flex: 1,
    gap: space[4],
  },
  title: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  body: {
    ...textStyle('bodyS'),
    color: color.text.secondary,
  },
  time: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  dotUnread: {
    backgroundColor: color.status.dangerFg,
  },
});
