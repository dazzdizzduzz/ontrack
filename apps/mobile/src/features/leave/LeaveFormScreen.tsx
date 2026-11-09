import {
  LEAVE_ATTACHMENT_MAX_BYTES,
  LEAVE_REASON_MAX,
  formatFileSize,
  formatLeaveDays,
  leaveTypeLabels,
  parseDateInput,
  remainingQuota,
  sampleLeaveApprover,
  sampleLeaveDraft,
  sampleLowLeaveQuota,
  validateLeave,
  type LeaveDraft,
} from '@on-track/core';
import { color, radius, space } from '@on-track/tokens';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import { TopAppBar } from '@/components/ui/TopAppBar';
import { textStyle } from '@/theme/text';
import { QuotaCard } from './LeaveParts';
import { useLeave } from './LeaveProvider';
import { TypeSheet } from './TypeSheet';

export type LeaveFormPreview = 'contoh' | 'jenis' | 'sakit' | 'validasi' | 'kuota';

const WEEKDAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const weekdayOf = (iso: string) =>
  WEEKDAYS[new Date(`${iso}T00:00:00Z`).getUTCDay()] ?? '';

const emptyDraft: LeaveDraft = { type: 'cuti', start: '', end: '', reason: '' };

/** Contoh Figma tiap `?state=`. */
const previewDrafts: Record<LeaveFormPreview, LeaveDraft> = {
  contoh: sampleLeaveDraft,
  jenis: sampleLeaveDraft,
  kuota: sampleLeaveDraft,
  sakit: {
    type: 'sakit',
    start: '13/10/2026',
    end: '14/10/2026',
    reason: 'Demam, istirahat sesuai saran dokter.',
    attachment: { name: 'surat-dokter-13okt.jpg', sizeBytes: 1.2 * 1024 * 1024, kind: 'JPG' },
  },
  validasi: { type: 'izin', start: '20/10/2026', end: '20/10/2026', reason: '' },
};

const goBack = () => (router.canGoBack() ? router.back() : router.replace('/izin'));

/**
 * M05 · Ajukan Izin, M38 · Pilih Jenis, M39 · Sakit + Lampiran, M40 · Validasi, M18 · Kuota Tidak
 * Cukup. MOCK: pengajuan disimpan di memori (LeaveProvider); lampiran belum diunggah ke server.
 */
export function LeaveFormScreen({ preview }: { preview?: LeaveFormPreview }) {
  const { bottom } = useSafeAreaInsets();
  const leave = useLeave();
  const quota = preview === 'kuota' ? sampleLowLeaveQuota : leave.quota;
  const [draft, setDraft] = useState<LeaveDraft>(preview ? previewDrafts[preview] : emptyDraft);
  const [submitted, setSubmitted] = useState(preview === 'validasi');
  const [sheetOpen, setSheetOpen] = useState(preview === 'jenis');
  const [fileError, setFileError] = useState<string | null>(null);

  const { errors, days } = validateLeave(draft, quota, { checkRequired: submitted });
  const quotaBlocked = draft.type === 'cuti' && errors.form?.title === 'Kuota cuti tidak cukup';
  const startIso = parseDateInput(draft.start);
  const endIso = parseDateInput(draft.end);
  const isSick = draft.type === 'sakit';

  const update = (patch: Partial<LeaveDraft>) => setDraft((current) => ({ ...current, ...patch }));

  async function pickFile() {
    setFileError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg'],
        copyToCacheDirectory: true,
      });
      const file = result.assets?.[0];
      if (result.canceled || !file) return;
      if ((file.size ?? 0) > LEAVE_ATTACHMENT_MAX_BYTES) {
        setFileError('Ukuran file lebih dari 5 MB.');
        return;
      }
      const kind = file.mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'JPG';
      // MOCK: file hanya disimpan namanya; unggah ke server setelah API pengajuan ada.
      update({ attachment: { name: file.name, sizeBytes: file.size ?? 0, kind } });
    } catch {
      setFileError('File tidak bisa dibuka. Coba pilih file lain.');
    }
  }

  function submit() {
    setSubmitted(true);
    const result = validateLeave(draft, quota);
    if (Object.keys(result.errors).length > 0 || !startIso || !endIso) return;
    leave.submit({
      // MOCK: id sementara; nanti dari server.
      id: `${draft.type}-${startIso}-${leave.requests.length}`,
      type: draft.type,
      start: startIso,
      end: endIso,
      days: result.days,
      reason: draft.reason.trim(),
      status: 'menunggu',
      attachment: draft.attachment,
    });
    router.replace('/izin/terkirim');
  }

  const showForm = errors.form && (submitted || quotaBlocked);
  const endHelper =
    endIso && startIso && !errors.end ? `${weekdayOf(endIso)} · ${formatLeaveDays(days)} kerja` : undefined;

  return (
    <View style={styles.screen}>
      <TopAppBar title="Ajukan Izin" onBack={goBack} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {/* Kuota hanya relevan untuk cuti tahunan (M39, M40 tidak menampilkannya). */}
        {draft.type === 'cuti' && <QuotaCard quota={quota} muted />}
        {showForm && errors.form && (
          <Alert tone="danger" title={errors.form.title} announce>
            {errors.form.body}
          </Alert>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Jenis pengajuan</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Jenis pengajuan ${leaveTypeLabels[draft.type]}. Ketuk untuk mengganti.`}
            onPress={() => setSheetOpen(true)}
            style={styles.select}
          >
            <Text style={styles.selectValue}>{leaveTypeLabels[draft.type]}</Text>
            <Icon name="chevron-down" size={20} />
          </Pressable>
        </View>

        <View style={styles.dates}>
          <View style={styles.date}>
            <TextField
              label="Tanggal mulai"
              value={draft.start}
              onChangeText={(start) => update({ start })}
              placeholder="dd/mm/yyyy"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              helper={startIso ? weekdayOf(startIso) : ' '}
              error={errors.start}
            />
          </View>
          <View style={styles.date}>
            <TextField
              label="Tanggal selesai"
              value={draft.end}
              onChangeText={(end) => update({ end })}
              placeholder="dd/mm/yyyy"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              helper={endHelper ?? ' '}
              error={errors.end}
            />
          </View>
        </View>

        <TextField
          label="Alasan"
          value={draft.reason}
          onChangeText={(reason) => update({ reason })}
          multiline
          maxLength={LEAVE_REASON_MAX}
          helper="Wajib diisi"
          error={errors.reason}
          meta={`${draft.reason.length}/${LEAVE_REASON_MAX}`}
        />

        <View style={styles.field}>
          <Text style={styles.label}>
            {isSick ? 'Surat dokter (wajib untuk sakit > 1 hari)' : 'Lampiran (opsional)'}
          </Text>
          {draft.attachment ? (
            <View accessible style={styles.file}>
              <Icon name="paperclip-20" size={20} />
              <View style={styles.fileText}>
                <Text style={styles.fileName}>{draft.attachment.name}</Text>
                <Text style={styles.fileMeta}>
                  {draft.attachment.kind} · {formatFileSize(draft.attachment.sizeBytes)} · terunggah
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Hapus lampiran ${draft.attachment.name}`}
                hitSlop={space[12]}
                onPress={() => update({ attachment: undefined })}
              >
                <Icon name="close-20" size={20} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Unggah surat dokter atau dokumen, PDF atau JPG, maksimal 5 MB"
              onPress={pickFile}
              style={[styles.upload, errors.attachment && styles.uploadError]}
            >
              <View style={styles.uploadIcon}>
                <Icon name="upload" size={20} />
              </View>
              <View style={styles.fileText}>
                <Text style={styles.fileName}>Unggah surat dokter / dokumen</Text>
                <Text style={styles.fileMeta}>PDF atau JPG, maks. 5 MB</Text>
              </View>
            </Pressable>
          )}
          {(fileError ?? errors.attachment) && (
            <Text style={styles.error}>{fileError ?? errors.attachment}</Text>
          )}
        </View>

        {!showForm && (
          <Alert tone="info" title={draft.type === 'cuti' ? `Dikirim ke ${sampleLeaveApprover.role}` : 'Tidak memotong kuota cuti'}>
            {sampleLeaveApprover.name} akan menerima notifikasi untuk menyetujui.
          </Alert>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(space[24], bottom) }]}>
        <Button
          fullWidth
          label={`Ajukan ${leaveTypeLabels[draft.type].replace(' tahunan', '')}`}
          disabled={quotaBlocked}
          onPress={submit}
        />
      </View>

      <TypeSheet
        visible={sheetOpen}
        value={draft.type}
        remaining={remainingQuota(quota)}
        onSelect={(type) => {
          update({ type });
          setSheetOpen(false);
        }}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.surface,
  },
  content: {
    gap: space[16],
    padding: space[20],
  },
  field: {
    gap: space[8],
  },
  label: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: space[16],
    paddingVertical: space[12],
    borderWidth: 1,
    borderColor: color.border.control,
    borderRadius: radius.md,
    backgroundColor: color.bg.surface,
  },
  selectValue: {
    ...textStyle('bodyM'),
    color: color.text.primary,
  },
  dates: {
    flexDirection: 'row',
    gap: space[12],
  },
  date: {
    flex: 1,
  },
  upload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    padding: space[16],
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.border.control,
    borderRadius: radius.md,
    backgroundColor: color.bg.subtle,
  },
  uploadError: {
    borderColor: color.status.dangerFg,
  },
  uploadIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.full,
    backgroundColor: color.bg.surface,
  },
  file: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    padding: space[12],
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.md,
  },
  fileText: {
    flex: 1,
    gap: space[2],
  },
  fileName: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  fileMeta: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
  error: {
    ...textStyle('caption'),
    color: color.status.dangerFg,
  },
  footer: {
    paddingTop: space[12],
    paddingHorizontal: space[20],
    borderTopWidth: 1,
    borderTopColor: color.border.default,
    backgroundColor: color.bg.surface,
  },
});
