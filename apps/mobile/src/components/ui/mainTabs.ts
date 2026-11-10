import { router } from 'expo-router';

import type { BottomNavItem } from './BottomNav';

/**
 * Tab bawah aplikasi karyawan (M02, M06, M16, M21).
 */
export const mainTabs: BottomNavItem[] = [
  { label: 'Beranda', icon: 'tab-home', onPress: () => router.navigate('/beranda') },
  { label: 'Task', icon: 'tab-task', onPress: () => router.navigate('/task') },
  { label: 'Izin', icon: 'tab-calendar', onPress: () => router.navigate('/izin') },
  { label: 'Profil', icon: 'tab-user', onPress: () => router.navigate('/profil') },
];
