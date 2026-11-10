import {
  TASK_ATTACHMENT_EXTENSIONS,
  TASK_ATTACHMENT_MAX_BYTES,
  TASK_NOTE_MAX,
  formatFileSize,
  type TaskFile,
} from '@on-track/core';
import { color, radius, space } from '@on-track/tokens';
import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { textStyle } from '@/theme/text';

/** File dalam antrean unggah; `progress` 0–100. */
type Upload = TaskFile & { progress: number };

/**
 * M44 · Kirim hasil ke Review (bottom sheet). MOCK: unggahan disimulasikan dengan progres naik;
 * nanti file dikirim lewat POST /tasks/{id}/submissions (draf F09). Minimal satu file selesai.
 */
export function SubmitSheet({
  visible,
  title,
  reviewer,
  initialFiles = [],
  initialNote = '',
  onClose,
  onSubmit,
}: {
  visible: boolean;
  title: string;
  reviewer: string;
  initialFiles?: Upload[];
  initialNote?: string;
  onClose: () => void;
  onSubmit: (files: TaskFile[], note: string) => void;
}) {
  const { bottom } = useSafeAreaInsets();
  const [uploads, setUploads] = useState<Upload[]>(initialFiles);
  const [note, setNote] = useState(initialNote);
  const [error, setError] = useState<string | null>(null);

  const uploading = uploads.some((file) => file.progress < 100);

  useEffect(() => {
    if (!uploading) return;
    const timer = setInterval(() => {
      setUploads((list) => list.map((file) => ({ ...file, progress: Math.min(100, file.progress + 14) })));
    }, 250);
    return () => clearInterval(timer);
  }, [uploading]);

  async function addFile() {
    const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: false });
    if (result.canceled) return;
    const picked = result.assets.map((asset) => ({ name: asset.name, sizeBytes: asset.size ?? 0 }));
    const rejected = picked.find((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      return !TASK_ATTACHMENT_EXTENSIONS.includes(ext) || file.sizeBytes > TASK_ATTACHMENT_MAX_BYTES;
    });
    if (rejected) {
      setError(`${rejected.name} tidak bisa dikirim. Pakai PDF, JPG, PNG, AI, atau FIG maks. 20 MB.`);
      return;
    }
    setError(null);
    setUploads((list) => [...list, ...picked.map((file) => ({ ...file, progress: 0 }))]);
  }

  function send() {
    if (uploads.length === 0) {
      setError('Tambahkan minimal satu file hasil kerja.');
      return;
    }
    onSubmit(
      uploads.map(({ name, sizeBytes }) => ({ name, sizeBytes })),
      note,
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <Pressable accessibilityRole="button" accessibilityLabel="Tutup" style={styles.scrim} onPress={onClose} />
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: Math.max(space[32], bottom) }]}>
          <View style={styles.handle} />
          <Text accessibilityRole="header" style={styles.title}>
            Kirim hasil ke Review
          </Text>
          <Text style={styles.description}>
            {title} · Team Lead {reviewer} akan menerima notifikasi.
          </Text>

          {uploads.map((file, index) => {
            const done = file.progress >= 100;
            return (
              <View key={`${file.name}-${index}`} style={styles.file}>
                <Icon name="paperclip" size={24} />
                <View style={styles.fileText}>
                  <Text numberOfLines={1} style={styles.fileName}>
                    {file.name}
                  </Text>
                  <View
                    accessibilityRole="progressbar"
                    accessibilityValue={{ min: 0, max: 100, now: file.progress }}
                    style={styles.track}
                  >
                    <View style={[styles.fill, done && styles.fillDone, { width: `${file.progress}%` }]} />
                  </View>
                  <Text style={styles.fileMeta}>
                    {formatFileSize(file.sizeBytes)} · {done ? 'terunggah' : `${file.progress}%`}
                  </Text>
                </View>
                {done ? (
                  <Icon name="check-24" size={24} />
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Batalkan unggahan ${file.name}`}
                    onPress={() => setUploads((list) => list.filter((_, i) => i !== index))}
                    style={styles.cancel}
                  >
                    <Icon name="close" size={24} />
                  </Pressable>
                )}
              </View>
            );
          })}

          <View style={styles.addRow}>
            <Button variant="ghost" label="Tambah file" icon="upload" onPress={addFile} />
          </View>
          {error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          )}

          <View style={styles.field}>
            <Text nativeID="catatan-team-lead" style={styles.label}>
              Catatan untuk Team Lead
            </Text>
            <TextInput
              accessibilityLabelledBy="catatan-team-lead"
              accessibilityLabel="Catatan untuk Team Lead"
              multiline
              maxLength={TASK_NOTE_MAX}
              value={note}
              onChangeText={setNote}
              style={styles.textarea}
              textAlignVertical="top"
            />
            <View style={styles.meta}>
              <Text style={styles.metaText}>Opsional</Text>
              <Text style={styles.metaText}>
                {note.length}/{TASK_NOTE_MAX}
              </Text>
            </View>
          </View>

          <Button fullWidth label="Kirim ke Review" icon="send" disabled={uploading} onPress={send} />
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
    gap: space[16],
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
    borderRadius: radius.full,
    backgroundColor: color.border.strong,
  },
  title: {
    ...textStyle('headingH2'),
    color: color.text.primary,
  },
  description: {
    ...textStyle('bodyS'),
    color: color.text.secondary,
  },
  file: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    padding: space[16],
    borderRadius: radius.md,
    backgroundColor: color.bg.subtle,
  },
  fileText: {
    flex: 1,
    gap: space[4],
  },
  fileName: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  track: {
    height: 4,
    overflow: 'hidden',
    borderRadius: radius.full,
    backgroundColor: color.border.default,
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: color.bg.inverse,
  },
  fillDone: {
    backgroundColor: color.accent.default,
  },
  fileMeta: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
  cancel: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    margin: -space[8],
  },
  addRow: {
    alignItems: 'flex-start',
  },
  error: {
    ...textStyle('caption'),
    color: color.status.dangerFg,
  },
  field: {
    gap: space[8],
  },
  label: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  textarea: {
    ...textStyle('bodyM'),
    minHeight: 112,
    paddingHorizontal: space[16],
    paddingVertical: space[12],
    borderWidth: 1,
    borderColor: color.border.control,
    borderRadius: radius.md,
    color: color.text.primary,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
});
