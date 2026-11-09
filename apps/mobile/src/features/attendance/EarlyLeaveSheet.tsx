import { formatDuration } from '@on-track/core';
import { color, radius, space } from '@on-track/tokens';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import { textStyle } from '@/theme/text';
import { sampleSchedule } from './data';

/** Batas catatan pulang cepat. Tidak ada di Figma; disamakan dengan alasan nonaktif (F02). */
const NOTE_MAX_LENGTH = 200;

type EarlyLeaveSheetProps = {
  visible: boolean;
  /** Jam clock-out, "15:30". */
  time: string;
  earlyMinutes: number;
  initialNote?: string;
  onConfirm: (note: string) => void;
  onCancel: () => void;
};

/** M34 · Konfirmasi pulang cepat (bottom sheet) dengan catatan opsional untuk atasan. */
export function EarlyLeaveSheet({
  visible,
  time,
  earlyMinutes,
  initialNote = '',
  onConfirm,
  onCancel,
}: EarlyLeaveSheetProps) {
  const { bottom } = useSafeAreaInsets();
  const [note, setNote] = useState(initialNote);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tutup"
          style={styles.scrim}
          onPress={onCancel}
        />
        <View
          accessibilityViewIsModal
          style={[styles.sheet, { paddingBottom: Math.max(space[32], bottom) }]}
        >
          <View style={styles.handle} />
          <View style={styles.iconWrap}>
            <Icon name="clock" size={24} />
          </View>
          <Text accessibilityRole="header" style={styles.title}>
            Clock-out sebelum jam pulang?
          </Text>
          <Text style={styles.body}>
            Jam pulang kamu {sampleSchedule.end}. Jika clock-out sekarang ({time}), status hari ini
            tercatat Pulang Cepat {formatDuration(earlyMinutes)}.
          </Text>
          <View style={styles.field}>
            <TextField
              label="Catatan (opsional)"
              helper="Terlihat oleh atasan di rekap kehadiran"
              value={note}
              onChangeText={setNote}
              maxLength={NOTE_MAX_LENGTH}
              placeholder="Contoh: kontrol ke dokter"
            />
          </View>
          <Button fullWidth label="Tetap clock out" onPress={() => onConfirm(note)} />
          <Button fullWidth variant="ghost" label="Batal" onPress={onCancel} />
        </View>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    gap: space[16],
    paddingTop: space[12],
    paddingHorizontal: space[24],
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: color.bg.surface,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.border.strong,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: color.status.warningBg,
  },
  title: {
    ...textStyle('headingH2'),
    color: color.text.primary,
    textAlign: 'center',
  },
  body: {
    ...textStyle('bodyM'),
    color: color.text.secondary,
    textAlign: 'center',
  },
  field: {
    alignSelf: 'stretch',
  },
});
