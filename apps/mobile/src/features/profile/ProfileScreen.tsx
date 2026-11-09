import { formatPeriod, sampleAttendance, sampleDefaultPeriod, summarize } from '@on-track/core';
import { color, radius, space } from '@on-track/tokens';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomNav } from '@/components/ui/BottomNav';
import { Icon, type IconName } from '@/components/ui/Icon';
import { mainTabs } from '@/components/ui/mainTabs';
import { TopAppBar } from '@/components/ui/TopAppBar';
import { sampleOffice, sampleSchedule, sampleSummary } from '@/features/attendance/data';
import { textStyle } from '@/theme/text';

/** MOCK: profil contoh Figma M21; nanti dari API profil karyawan. */
const sampleProfile = {
  name: 'Dhais Alfa Rysy',
  initials: 'DA',
  position: 'Lead Graphic Designer',
  division: 'Design',
  email: 'daze@studiotigapagi.com',
  lastPayslip: 'September 2026',
  version: 'On-Track v1.0 · Studio Tigapagi',
};

const history = summarize(sampleAttendance(sampleDefaultPeriod));
const historyMonth = formatPeriod(sampleDefaultPeriod).split(' ')[0];

type MenuItem = {
  icon: IconName;
  title: string;
  description?: string;
  /** Kosong: fiturnya belum dibuat, baris tetap tampil sesuai Figma. */
  onPress?: () => void;
};

const menu: MenuItem[] = [
  {
    icon: 'history',
    title: 'Riwayat absensi',
    description: `${historyMonth}: ${history.hadir} hadir · ${history.terlambat} terlambat`,
    onPress: () => router.push('/riwayat'),
  },
  // MOCK: slip gaji (F12), ubah kata sandi, dan privasi belum dibuat.
  { icon: 'wallet', title: 'Slip gaji', description: `Terakhir: ${sampleProfile.lastPayslip}` },
  {
    icon: 'calendar',
    title: 'Izin & cuti',
    description: `Sisa cuti tahunan ${sampleSummary.leaveLeft} hari`,
    onPress: () => router.push('/izin'),
  },
  { icon: 'key-menu', title: 'Ubah kata sandi' },
  {
    icon: 'shield-menu',
    title: 'Privasi & data pribadi',
    description: 'Kelola izin lokasi, kamera, hapus data',
  },
];

function MenuRow({ item }: { item: MenuItem }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[item.title, item.description].filter(Boolean).join(', ')}
      accessibilityState={{ disabled: !item.onPress }}
      onPress={item.onPress}
      style={({ pressed }) => [styles.row, styles.rowBorder, pressed && styles.rowPressed]}
    >
      <View style={styles.iconWrap}>
        <Icon name={item.icon} size={20} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        {item.description && <Text style={styles.rowMeta}>{item.description}</Text>}
      </View>
      <Icon name="chevron-right" size={20} />
    </Pressable>
  );
}

/** M21 · Profil (F02 › Tampilan Karyawan): data diri, jadwal & lokasi, menu, dan keluar. */
export function ProfileScreen() {
  // MOCK: preferensi notifikasi tersimpan di memori sampai API pengaturan ada.
  const [notifications, setNotifications] = useState(true);

  return (
    <View style={styles.screen}>
      <TopAppBar title="Profil" />
      <ScrollView contentContainerStyle={styles.content}>
        <View accessible style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{sampleProfile.initials}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{sampleProfile.name}</Text>
            <Text style={styles.position}>
              {sampleProfile.position} · {sampleProfile.division}
            </Text>
            <Text style={styles.email}>{sampleProfile.email}</Text>
          </View>
        </View>

        {/* Figma: "Profil → kartu Jadwal" membuka M26. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Jadwal Senin sampai Jumat ${sampleSchedule.start} sampai ${sampleSchedule.end}, kantor ${sampleOffice.name} radius ${sampleOffice.radiusMeters} meter. Buka jadwal dan lokasi.`}
          onPress={() => router.push('/jadwal-lokasi')}
          style={styles.facts}
        >
          <View style={styles.fact}>
            <Text style={styles.factLabel}>Jadwal</Text>
            {/* Figma: dua baris tetap, agar sama di semua lebar layar. */}
            <Text style={styles.factValue}>
              {`Sen–Jum\n${sampleSchedule.start}–${sampleSchedule.end}`}
            </Text>
          </View>
          <View style={styles.fact}>
            <Text style={styles.factLabel}>Kantor</Text>
            <Text style={styles.factValue}>
              {sampleOffice.name.replace('Kantor ', '')} · radius {sampleOffice.radiusMeters} m
            </Text>
          </View>
        </Pressable>

        <View style={styles.menu}>
          {menu.map((item) => (
            <MenuRow key={item.title} item={item} />
          ))}
          {/* Toggle Figma: jalur ink dengan bulatan aksen saat aktif. */}
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: notifications }}
            aria-checked={notifications}
            accessibilityLabel="Notifikasi push"
            onPress={() => setNotifications((value) => !value)}
            style={styles.toggleRow}
          >
            <View style={[styles.track, notifications && styles.trackOn]}>
              <View style={[styles.knob, notifications && styles.knobOn]} />
            </View>
            <Text style={styles.toggleLabel}>Notifikasi push</Text>
          </Pressable>
        </View>

        {/* MOCK: keluar belum menghapus sesi karena belum ada API auth. */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/login')}
          style={({ pressed }) => [styles.menu, styles.row, pressed && styles.rowPressed]}
        >
          <View style={[styles.iconWrap, styles.iconDanger]}>
            <Icon name="logout-danger" size={20} />
          </View>
          <Text style={[styles.rowTitle, styles.danger]}>Keluar</Text>
        </Pressable>

        <Text style={styles.version}>{sampleProfile.version}</Text>
      </ScrollView>
      <BottomNav items={mainTabs} active="Profil" />
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
    paddingHorizontal: space[20],
    paddingVertical: space[16],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[16],
    padding: space[16],
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.lg,
    backgroundColor: color.bg.surface,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.full,
    backgroundColor: color.accent.subtle,
  },
  avatarText: {
    ...textStyle('headingH3'),
    color: color.text.accent,
  },
  info: {
    flex: 1,
    gap: space[2],
  },
  name: {
    ...textStyle('headingH2'),
    color: color.text.primary,
  },
  position: {
    ...textStyle('bodyS'),
    color: color.text.secondary,
  },
  email: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
  facts: {
    flexDirection: 'row',
    gap: space[8],
  },
  fact: {
    flex: 1,
    gap: space[2],
    padding: space[12],
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.md,
    backgroundColor: color.bg.surface,
  },
  factLabel: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
  factValue: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  menu: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.lg,
    backgroundColor: color.bg.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    minHeight: 64,
    paddingHorizontal: space[16],
    paddingVertical: space[12],
    backgroundColor: color.bg.surface,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: color.border.default,
  },
  rowPressed: {
    backgroundColor: color.bg.hover,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: color.bg.subtle,
  },
  iconDanger: {
    backgroundColor: color.status.dangerBg,
  },
  rowText: {
    flex: 1,
    gap: space[2],
  },
  rowTitle: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  rowMeta: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
  danger: {
    color: color.status.dangerFg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    padding: space[16],
  },
  track: {
    justifyContent: 'center',
    width: 44,
    height: 24,
    paddingHorizontal: 3,
    borderRadius: radius.full,
    backgroundColor: color.border.strong,
  },
  trackOn: {
    backgroundColor: color.bg.inverse,
  },
  knob: {
    width: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: color.bg.surface,
  },
  knobOn: {
    alignSelf: 'flex-end',
    backgroundColor: color.accent.default,
  },
  toggleLabel: {
    ...textStyle('bodyS'),
    color: color.text.primary,
  },
  version: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
});
