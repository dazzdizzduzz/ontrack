import { notificationDayLabels, type AppNotification } from '@on-track/core';
import { color, space } from '@on-track/tokens';
import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { TopAppBar } from '@/components/ui/TopAppBar';
import { textStyle } from '@/theme/text';
import { NotificationItem } from './NotificationItem';
import { useNotifications } from './NotificationProvider';

const days: AppNotification['day'][] = ['hari-ini', 'kemarin'];

/**
 * M20 · Notifikasi. Item izin membuka detail status (M42/M43); halaman task (F08) dan slip gaji
 * (F11) belum ada, jadi item lain hanya ditandai dibaca.
 */
export function NotificationsScreen() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  function open(notification: AppNotification) {
    markRead(notification.id);
    if (notification.leaveId) {
      router.push({ pathname: '/izin/[id]', params: { id: notification.leaveId } });
    } else {
      // MOCK: halaman tujuan dikerjakan di fitur masing-masing.
      Alert.alert(notification.title, 'Halaman tujuan notifikasi ini belum tersedia.');
    }
  }

  return (
    <View style={styles.screen}>
      <TopAppBar title="Notifikasi" onBack={() => router.back()} />
      <ScrollView>
        <View style={styles.actions}>
          <Text style={styles.unread}>
            {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
          </Text>
          <Button
            variant="ghost"
            label="Tandai semua dibaca"
            disabled={unreadCount === 0}
            onPress={markAllRead}
          />
        </View>
        {days.map((day) => {
          const items = notifications.filter((item) => item.day === day);
          if (items.length === 0) return null;
          return (
            <View key={day}>
              <View style={styles.group}>
                <Text accessibilityRole="header" style={styles.groupLabel}>
                  {notificationDayLabels[day]}
                </Text>
              </View>
              {items.map((item) => (
                <NotificationItem key={item.id} notification={item} onPress={() => open(item)} />
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.surface,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space[8],
    paddingLeft: space[20],
    paddingRight: space[4],
  },
  unread: {
    ...textStyle('labelM'),
    color: color.text.secondary,
  },
  group: {
    paddingHorizontal: space[20],
    paddingVertical: space[8],
    backgroundColor: color.bg.subtle,
  },
  groupLabel: {
    ...textStyle('labelS'),
    color: color.text.secondary,
  },
});
