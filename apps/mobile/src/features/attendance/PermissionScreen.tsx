import { color, radius, space } from '@on-track/tokens';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { textStyle } from '@/theme/text';
import { useAttendance, type Permission } from './AttendanceProvider';

const needs: Record<Permission, string> = {
  lokasi: 'lokasi untuk memastikan kamu di radius kantor',
  kamera: 'kamera untuk selfie bukti kehadiran',
};

function PermissionItem({ icon, title, body, last }: { icon: IconName; title: string; body: string; last?: boolean }) {
  return (
    <View accessible style={[styles.item, !last && styles.itemBorder]}>
      <View style={styles.itemIcon}>
        <Icon name={icon} size={20} />
      </View>
      <View style={styles.itemText}>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemBody}>{body}</Text>
      </View>
    </View>
  );
}

/** M56: langkah di Pengaturan untuk izin yang ditolak permanen. */
function settingsHint(missing: Permission[]): string {
  const steps = missing.map((name) =>
    name === 'lokasi' ? 'Lokasi, lalu pilih "Saat aplikasi dipakai"' : 'Kamera, lalu aktifkan',
  );
  return `Buka Pengaturan › On-Track › ${steps.join('; lalu ')}.`;
}

/** M13 · Izin Akses Lokasi & Kamera, tampil sebelum clock-in pertama. M56: izin ditolak permanen. */
export function PermissionScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { requestPermissions } = useAttendance();
  const [asking, setAsking] = useState(false);
  // 'tanya-lagi': ditolak sekali, dialog sistem masih bisa muncul. 'pengaturan': harus lewat Pengaturan.
  const [denied, setDenied] = useState<{
    mode: 'tanya-lagi' | 'pengaturan';
    missing: Permission[];
  } | null>(null);

  // Dialog izin lokasi lalu kamera dari sistem. Selalu tanya sistem dulu: bila izin sudah
  // diubah di Pengaturan, langsung lanjut tanpa dialog.
  async function allow() {
    setAsking(true);
    const result = await requestPermissions();
    setAsking(false);
    if (result.granted) {
      router.replace('/clock-in');
      return;
    }
    if (denied?.mode === 'pengaturan') void Linking.openSettings();
    setDenied({ mode: result.canAskAgain ? 'tanya-lagi' : 'pengaturan', missing: result.missing });
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: top + space[48] }]}>
        <View style={styles.illustration}>
          <View style={[styles.bubble, styles.bubbleAccent]}>
            <Icon name="pin-accent" size={34} />
          </View>
          <View style={[styles.bubble, styles.bubbleSubtle]}>
            <Icon name="camera" size={34} />
          </View>
        </View>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>
            Izinkan lokasi & kamera
          </Text>
          <Text style={styles.subtitle}>
            On-Track butuh dua izin ini supaya absensi kamu sah dan cepat.
          </Text>
        </View>
        <View style={styles.list}>
          <PermissionItem
            icon="pin"
            title="Lokasi (GPS)"
            body="Memastikan kamu di radius kantor saat clock-in."
          />
          <PermissionItem
            icon="camera"
            title="Kamera"
            body="Mengambil selfie sebagai bukti kehadiran."
            last
          />
        </View>
        <View style={styles.privacy}>
          <Icon name="shield" size={20} />
          <Text style={styles.privacyText}>
            Lokasi hanya dibaca saat kamu menekan Clock In/Out. Foto disimpan terenkripsi dan dapat
            dihapus sesuai UU PDP No. 27/2022.
          </Text>
        </View>
        {denied && (
          <View style={styles.alert}>
            <Alert
              tone="warning"
              title={
                denied.mode === 'pengaturan'
                  ? `Izin ${denied.missing.join(' dan ')} ditolak`
                  : `Izin ${denied.missing.join(' dan ')} belum diberikan`
              }
              announce
            >
              {denied.mode === 'pengaturan'
                ? settingsHint(denied.missing)
                : `Clock-in butuh ${denied.missing.map((name) => needs[name]).join(' serta ')}.`}
            </Alert>
          </View>
        )}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(space[32], bottom) }]}>
        <Button
          fullWidth
          label={denied?.mode === 'pengaturan' ? 'Buka Pengaturan' : 'Izinkan akses'}
          disabled={asking}
          onPress={allow}
        />
        <Button
          fullWidth
          variant="ghost"
          label="Nanti saja"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/beranda'))}
        />
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
    alignItems: 'center',
    gap: space[24],
    paddingHorizontal: space[20],
    paddingBottom: space[24],
  },
  illustration: {
    flexDirection: 'row',
    gap: space[12],
  },
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: radius.full,
  },
  bubbleAccent: {
    backgroundColor: color.accent.subtle,
  },
  bubbleSubtle: {
    backgroundColor: color.bg.subtle,
  },
  heading: {
    alignItems: 'center',
    gap: space[8],
  },
  title: {
    ...textStyle('headingH1'),
    color: color.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyle('bodyM'),
    color: color.text.secondary,
    textAlign: 'center',
  },
  list: {
    alignSelf: 'stretch',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: color.border.default,
    // Figma memakai sudut 16px untuk daftar izin; belum ada token radius untuk nilai ini.
    borderRadius: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    paddingHorizontal: space[16],
    paddingVertical: space[12],
    backgroundColor: color.bg.surface,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: color.border.default,
  },
  itemIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: color.bg.subtle,
  },
  itemText: {
    flex: 1,
    gap: space[2],
  },
  itemTitle: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  itemBody: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
  privacy: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    gap: space[8],
    padding: space[12],
    borderRadius: radius.md,
    backgroundColor: color.bg.subtle,
  },
  privacyText: {
    ...textStyle('caption'),
    flex: 1,
    color: color.text.secondary,
  },
  alert: {
    alignSelf: 'stretch',
  },
  footer: {
    gap: space[8],
    paddingTop: space[12],
    paddingHorizontal: space[20],
    backgroundColor: color.bg.surface,
  },
});
