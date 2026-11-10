import {
  TASK_COMMENT_MAX,
  formatFileSize,
  formatOverdueBy,
  formatTaskDue,
  formatTaskStamp,
  isImageFile,
  isOverdue,
  sampleRevision,
  sampleSubmissionDraft,
  sampleTaskNow,
  sampleTaskUserId,
  taskPriorityLabels,
  taskStatusLabels,
  type Task,
} from '@on-track/core';
import { color, radius, space } from '@on-track/tokens';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert as NativeAlert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { textStyle } from '@/theme/text';
import { SubmitSheet } from './SubmitSheet';
import { taskBadge } from './taskBadge';
import { clientLabel, useTasks } from './TaskProvider';

const statuses = ['todo', 'in_progress', 'review', 'done'] as const;

/** Pratinjau `?state=`: `kirim` (M44), `review` (M45), `revisi` (M46). */
function applyPreview(task: Task, state?: string): Task {
  if (state === 'review') {
    return {
      ...task,
      status: 'review',
      submission: { files: sampleSubmissionDraft.files, note: sampleSubmissionDraft.note, at: '2026-10-01T16:40' },
    };
  }
  if (state === 'revisi') return { ...task, status: 'in_progress', revision: sampleRevision };
  return task;
}

function MetaRow({ icon, label, value, danger, last }: { icon: IconName; label: string; value: string; danger?: boolean; last?: boolean }) {
  return (
    <View style={[styles.metaRow, !last && styles.divider]}>
      <Icon name={icon} size={18} />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={[styles.metaValue, danger && styles.danger]}>{value}</Text>
    </View>
  );
}

/**
 * M19 · Detail task, M44 · Unggah hasil (sheet), M45 · Dikirim ke Review, M46 · Perlu revisi.
 * Penanggung jawab hanya mengubah To Do ↔ In Progress; Review lewat kiriman hasil, Done oleh Team Lead.
 */
export function TaskDetailScreen() {
  const { id, state } = useLocalSearchParams<{ id: string; state?: string }>();
  const { top, bottom } = useSafeAreaInsets();
  const { tasks, projects, clients, people, setStatus, submit, addComment } = useTasks();
  const [comment, setComment] = useState('');
  const [sheetOpen, setSheetOpen] = useState(state === 'kirim');
  const [previewState, setPreviewState] = useState(state);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/task'));
  const stored = tasks.find((task) => task.id === id);

  if (!stored) {
    return (
      <View style={styles.screen}>
        <Text style={styles.missing}>Task tidak ditemukan.</Text>
        <Button variant="secondary" label="Kembali ke Task Saya" onPress={goBack} />
      </View>
    );
  }

  const task = applyPreview(stored, previewState);
  const project = projects.find((item) => item.id === task.projectId);
  const client = clients.find((item) => item.id === project?.clientId);
  const person = (personId?: string) => people.find((item) => item.id === personId);
  const reviewer = person(task.createdById)?.name ?? 'Team Lead';
  const badge = taskBadge(task);
  const late = isOverdue(task, sampleTaskNow);
  const inReview = task.status === 'review';
  const done = task.status === 'done';
  const files = task.attachments ?? [];
  const comments = task.comments ?? [];

  let dueValue = task.due ? formatTaskDue(task.due) : 'Tanpa tenggat';
  if (task.revision?.due) dueValue = `${formatTaskDue(task.revision.due)} (tenggat baru)`;
  else if (task.due && late) {
    dueValue = `${dueValue} (${formatOverdueBy(task.due, sampleTaskNow)})`;
  } else if (task.due && inReview && task.submission && task.submission.at > task.due) {
    // Dikirim setelah tenggat: tetap ditandai terlambat, dihitung sampai waktu kirim.
    dueValue = `${dueValue} (${formatOverdueBy(task.due, task.submission.at)})`;
  }

  function sendComment() {
    if (!comment.trim()) return;
    addComment(task.id, sampleTaskUserId, comment);
    setComment('');
  }

  function choose(status: (typeof statuses)[number]) {
    if (status === 'review') setSheetOpen(true);
    else if (status === 'done') NativeAlert.alert('Status Done', 'Task pindah ke Done setelah Team Lead menyetujui hasilnya.');
    else setStatus(task.id, status);
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.bar, { paddingTop: top }]}>
        <View style={styles.barRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Kembali" onPress={goBack} style={styles.barButton}>
            <Icon name="back" size={20} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.barTitle}>
            Detail Task
          </Text>
          {/* MOCK: menu lainnya (salin tautan, laporkan) belum didesain. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Menu lainnya"
            onPress={() => NativeAlert.alert('Menu', 'Pilihan lainnya belum tersedia.')}
            style={styles.barButton}
          >
            <Icon name="more" size={20} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {inReview && task.submission && (
          <Alert tone="success" title={`Terkirim ke Review · ${formatTaskStamp(task.submission.at)}`} announce>
            {reviewer} sudah dinotifikasi. Status tidak lagi overdue selama menunggu review.
          </Alert>
        )}
        {task.revision && task.status === 'in_progress' && (
          <Alert tone="warning" title={`Perlu revisi · dari ${person(task.revision.byId)?.name ?? 'Team Lead'}`}>
            &quot;{task.revision.note}&quot;{task.revision.due ? ` Tenggat baru ${formatTaskDue(task.revision.due)}.` : ''}
          </Alert>
        )}

        <View style={styles.heading}>
          <View style={styles.headingTop}>
            <Text numberOfLines={1} style={styles.context}>
              {clientLabel(client)}
              {project ? ` · ${project.shortName}` : ''}
            </Text>
            <Badge tone={badge.tone} label={badge.label} />
          </View>
          <Text style={styles.title}>{task.title}</Text>
        </View>

        <View style={styles.meta}>
          <MetaRow icon="meta-user" label="Penanggung jawab" value={person(task.assigneeId)?.name ?? '—'} />
          <MetaRow icon="meta-clock" label="Tenggat" value={dueValue} danger={late} />
          <MetaRow icon="meta-flag" label="Prioritas" value={taskPriorityLabels[task.priority]} />
          <MetaRow icon="meta-user" label="Dibuat oleh" value={reviewer} last />
        </View>

        <Text style={styles.section}>Status</Text>
        <View accessibilityRole="radiogroup" style={styles.chips}>
          {statuses.map((status) => {
            const selected = task.status === status;
            const disabled = inReview || done;
            return (
              <Pressable
                key={status}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected, disabled }}
                aria-checked={selected}
                disabled={disabled}
                onPress={() => choose(status)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                {selected && <Icon name="check-inverse" size={16} />}
                <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{taskStatusLabels[status]}</Text>
              </Pressable>
            );
          })}
        </View>

        {task.description && (
          <>
            <Text style={styles.section}>Deskripsi</Text>
            <Text style={styles.description}>{task.description}</Text>
          </>
        )}

        {files.length > 0 && (
          <>
            <Text style={styles.section}>Lampiran · {files.length}</Text>
            <View style={styles.files}>
              {files.map((file) => (
                <View key={file.name} style={styles.file}>
                  <Icon name={isImageFile(file.name) ? 'meta-image' : 'meta-paperclip'} size={18} />
                  <View style={styles.fileText}>
                    <Text numberOfLines={1} style={styles.fileName}>
                      {file.name}
                    </Text>
                    <Text style={styles.fileSize}>{formatFileSize(file.sizeBytes)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={styles.section}>Komentar · {comments.length}</Text>
        {comments.map((item) => {
          const author = person(item.authorId);
          return (
            <View key={item.id} style={styles.comment}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{author?.initials ?? '?'}</Text>
              </View>
              <View style={styles.bubble}>
                <View style={styles.bubbleHead}>
                  <Text style={styles.author}>{author?.name ?? 'Anggota tim'}</Text>
                  <Text style={styles.time}>{item.at.split('T')[1]}</Text>
                </View>
                <Text style={styles.commentText}>{item.text}</Text>
              </View>
            </View>
          );
        })}
        {comments.length === 0 && <Text style={styles.time}>Belum ada komentar.</Text>}
      </ScrollView>

      {!done && (
        <View style={[styles.footer, { paddingBottom: Math.max(bottom, space[16]) + space[16] }]}>
          <View style={styles.commentRow}>
            <View style={styles.commentField}>
              <Icon name="meta-message" size={20} />
              <TextInput
                accessibilityLabel="Tulis komentar"
                placeholder="Tulis komentar…"
                placeholderTextColor={color.text.secondary}
                maxLength={TASK_COMMENT_MAX}
                value={comment}
                onChangeText={setComment}
                onSubmitEditing={sendComment}
                returnKeyType="send"
                style={styles.commentInput}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kirim komentar"
              accessibilityState={{ disabled: !comment.trim() }}
              disabled={!comment.trim()}
              onPress={sendComment}
              style={[styles.send, !comment.trim() && styles.sendDisabled]}
            >
              <Icon name="send" size={20} />
            </Pressable>
          </View>
          <Button
            fullWidth
            label={inReview ? 'Menunggu review Team Lead' : 'Unggah hasil & kirim ke Review'}
            icon={inReview ? undefined : 'upload-inverse'}
            disabled={inReview}
            onPress={() => setSheetOpen(true)}
          />
        </View>
      )}

      <SubmitSheet
        visible={sheetOpen}
        title={task.title}
        reviewer={reviewer}
        initialFiles={
          state === 'kirim'
            ? [
                { ...sampleSubmissionDraft.files[0]!, progress: 100 },
                { ...sampleSubmissionDraft.files[1]!, progress: 72 },
              ]
            : []
        }
        initialNote={state === 'kirim' ? sampleSubmissionDraft.note : ''}
        onClose={() => setSheetOpen(false)}
        onSubmit={(sent, note) => {
          submit(task.id, sent, note);
          setPreviewState(undefined);
          setSheetOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.surface,
  },
  missing: {
    ...textStyle('bodyS'),
    padding: space[20],
    color: color.text.secondary,
  },
  bar: {
    borderBottomWidth: 1,
    borderBottomColor: color.border.default,
    backgroundColor: color.bg.surface,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    minHeight: 56,
    paddingHorizontal: space[4],
  },
  barButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  barTitle: {
    ...textStyle('headingH2'),
    flex: 1,
    color: color.text.primary,
  },
  content: {
    gap: space[16],
    paddingHorizontal: space[20],
    paddingVertical: space[16],
  },
  heading: {
    gap: space[8],
  },
  headingTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[8],
  },
  context: {
    ...textStyle('labelS'),
    flexShrink: 1,
    color: color.text.secondary,
  },
  title: {
    ...textStyle('headingH1'),
    color: color.text.primary,
  },
  meta: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    paddingHorizontal: space[16],
    paddingVertical: space[12],
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: color.border.default,
  },
  metaLabel: {
    ...textStyle('bodyS'),
    flex: 1,
    color: color.text.secondary,
  },
  metaValue: {
    ...textStyle('labelM'),
    flexShrink: 1,
    color: color.text.primary,
    textAlign: 'right',
  },
  danger: {
    color: color.status.dangerFg,
  },
  section: {
    ...textStyle('labelS'),
    textTransform: 'none',
    color: color.text.secondary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[8],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
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
  description: {
    ...textStyle('bodyM'),
    color: color.text.primary,
  },
  files: {
    flexDirection: 'row',
    gap: space[8],
  },
  file: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
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
    ...textStyle('labelS'),
    textTransform: 'none',
    color: color.text.primary,
  },
  fileSize: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
  comment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[12],
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.full,
    backgroundColor: color.accent.subtle,
  },
  avatarText: {
    ...textStyle('caption'),
    fontFamily: 'Inter_500Medium',
    color: color.text.accent,
  },
  bubble: {
    flex: 1,
    gap: space[4],
    padding: space[12],
    borderRadius: radius.md,
    backgroundColor: color.bg.subtle,
  },
  bubbleHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space[8],
  },
  author: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  time: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
  commentText: {
    ...textStyle('bodyS'),
    color: color.text.primary,
  },
  footer: {
    gap: space[8],
    paddingTop: space[12],
    paddingHorizontal: space[20],
    borderTopWidth: 1,
    borderTopColor: color.border.default,
    backgroundColor: color.bg.surface,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  commentField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    paddingHorizontal: space[16],
    borderWidth: 1,
    borderColor: color.border.control,
    borderRadius: radius.md,
  },
  commentInput: {
    ...textStyle('bodyM'),
    flex: 1,
    minHeight: 48,
    color: color.text.primary,
  },
  send: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: color.bg.inverse,
  },
  sendDisabled: {
    backgroundColor: color.bg.disabled,
  },
});
