import { sampleLeaveDetails, type LeaveRequest, type LeaveStatus } from '@on-track/core';
import { color, radius, space } from '@on-track/tokens';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Alert } from '@/components/ui/Alert';
import { BottomNav } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/Button';
import { mainTabs } from '@/components/ui/mainTabs';
import { TopAppBar } from '@/components/ui/TopAppBar';
import { textStyle } from '@/theme/text';
import { LeaveCard, QuotaCard } from './LeaveParts';
import { LeaveMenuSheet } from './LeaveMenuSheet';
import { useLeave } from './LeaveProvider';

const filters: { label: string; value: LeaveStatus | null }[] = [
  { label: 'Semua', value: null },
  { label: 'Menunggu', value: 'menunggu' },
  { label: 'Disetujui', value: 'disetujui' },
  { label: 'Ditolak', value: 'ditolak' },
];

/** Pengajuan cuti contoh M59 (06–08/10, menunggu) untuk pratinjau `?state=menu`. */
const previewPending = sampleLeaveDetails.menunggu;

/**
 * M16 · Izin Saya: kuota cuti, filter status, dan daftar pengajuan. Ketuk kartu membuka M59 (menu
 * pengajuan). Pratinjau `?state=menu` menampilkan M59 untuk cuti yang masih menunggu.
 */
export function LeaveListScreen() {
  const { state } = useLocalSearchParams<{ state?: string }>();
  const { requests, quota, cancel } = useLeave();
  const [filter, setFilter] = useState<LeaveStatus | null>(null);
  // Parameter rute bisa baru terbaca setelah render pertama, jadi pratinjau dihitung, bukan nilai awal state.
  const [menuId, setMenuId] = useState<string | null | 'auto'>('auto');
  const [previewGone, setPreviewGone] = useState(false);
  const [cancelled, setCancelled] = useState<LeaveRequest | null>(null);
  const withPreview =
    state === 'menu' && !previewGone && !requests.some((item) => item.status === 'menunggu')
      ? [previewPending, ...requests]
      : requests;
  const visible = withPreview.filter((request) => !filter || request.status === filter);
  const openId = menuId === 'auto' ? (state === 'menu' ? previewPending.id : null) : menuId;
  const menuRequest = withPreview.find((item) => item.id === openId) ?? null;

  return (
    <View style={styles.screen}>
      <TopAppBar title="Izin & Cuti" />
      <ScrollView contentContainerStyle={styles.content}>
        {cancelled && (
          <Alert tone="success" title="Pengajuan dibatalkan" announce>
            {`Pengajuan ${cancelled.type === 'cuti' ? 'cuti' : 'kamu'} sudah dibatalkan dan atasan tidak perlu menyetujui lagi.`}
          </Alert>
        )}
        <QuotaCard quota={quota} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {filters.map((item) => {
            const selected = item.value === filter;
            return (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                aria-pressed={selected}
                onPress={() => setFilter(item.value)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {visible.map((request) => (
          <LeaveCard
            key={request.id}
            request={request}
            onPress={() => setMenuId(request.id)}
          />
        ))}
        {visible.length === 0 && <Text style={styles.empty}>Belum ada pengajuan dengan status ini.</Text>}
      </ScrollView>
      <View style={styles.footer}>
        <Button fullWidth label="Ajukan izin baru" icon="plus-inverse" onPress={() => router.push('/izin/ajukan')} />
      </View>
      <BottomNav items={mainTabs} active="Izin" />
      <LeaveMenuSheet
        request={menuRequest}
        onClose={() => setMenuId(null)}
        onDetail={(request) => {
          setMenuId(null);
          router.push({ pathname: '/izin/[id]', params: { id: request.id } });
        }}
        onCancel={(request) => {
          setMenuId(null);
          if (request.id === previewPending.id) setPreviewGone(true);
          else cancel(request.id);
          setCancelled(request);
        }}
      />
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
  chips: {
    gap: space[8],
  },
  chip: {
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: space[12],
    borderWidth: 1,
    borderColor: color.border.strong,
    borderRadius: radius.full,
    backgroundColor: color.bg.surface,
  },
  chipSelected: {
    borderColor: color.bg.inverse,
    backgroundColor: color.bg.inverse,
  },
  chipLabel: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  chipLabelSelected: {
    color: color.text.inverse,
  },
  empty: {
    ...textStyle('bodyS'),
    paddingVertical: space[24],
    color: color.text.secondary,
    textAlign: 'center',
  },
  footer: {
    paddingTop: space[12],
    paddingBottom: space[16],
    paddingHorizontal: space[20],
    borderTopWidth: 1,
    borderTopColor: color.border.default,
    backgroundColor: color.bg.surface,
  },
});
