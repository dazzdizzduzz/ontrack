import { sampleNotifications, type AppNotification } from '@on-track/core';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type NotificationValue = {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
};

const NotificationContext = createContext<NotificationValue | null>(null);

/**
 * MOCK: status baca tersimpan di memori aplikasi. Saat integrasi: GET /me/notifications,
 * POST /me/notifications/{id}/read, dan POST /me/notifications/read-all (draf F07).
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(sampleNotifications);

  const markRead = useCallback((id: string) => {
    setNotifications((items) => items.map((item) => (item.id === id ? { ...item, unread: false } : item)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((items) => items.map((item) => ({ ...item, unread: false })));
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications.filter((item) => item.unread).length,
      markRead,
      markAllRead,
    }),
    [markAllRead, markRead, notifications],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const value = useContext(NotificationContext);
  if (!value) throw new Error('useNotifications harus dipakai di dalam NotificationProvider');
  return value;
}
