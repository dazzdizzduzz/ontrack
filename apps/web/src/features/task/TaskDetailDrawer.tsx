'use client';

import {
  TASK_COMMENT_MAX,
  formatOverdueBy,
  formatTaskDue,
  formatTaskStamp,
  isOverdue,
  sampleTaskNow,
  taskPriorityLabels,
  type Task,
} from '@on-track/core';
import Image from 'next/image';
import { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { SubmitDialog } from './SubmitDialog';
import { CommentItem, FileTile, MetaList, SectionLabel, StatusChips } from './TaskParts';
import { clientLabel, useTasks } from './TaskProvider';
import styles from './task-detail.module.css';

/** Badge status task, termasuk "Perlu revisi" (M46) dan "Overdue" (FR-20). */
export function taskBadge(task: Task): { tone: 'neutral' | 'warning' | 'success' | 'danger'; label: string } {
  if (isOverdue(task, sampleTaskNow)) return { tone: 'danger', label: 'Overdue' };
  if (task.revision && task.status === 'in_progress') return { tone: 'warning', label: 'Perlu revisi' };
  return {
    todo: { tone: 'neutral' as const, label: 'To do' },
    in_progress: { tone: 'neutral' as const, label: 'In progress' },
    review: { tone: 'warning' as const, label: 'Review' },
    done: { tone: 'success' as const, label: 'Done' },
  }[task.status];
}

/**
 * KW22 · Detail task (drawer) di web karyawan, dengan alur kirim ke Review (US-07 AC-1) dan
 * banner Terkirim / Perlu revisi seperti M45 dan M46.
 */
export function TaskDetailDrawer({
  taskId,
  userId,
  initialSubmitOpen = false,
  onClose,
}: {
  taskId: string;
  userId: string;
  initialSubmitOpen?: boolean;
  onClose: () => void;
}) {
  const { tasks, projects, clients, people, setStatus, submit, addComment } = useTasks();
  const [comment, setComment] = useState('');
  const [submitOpen, setSubmitOpen] = useState(initialSubmitOpen);

  const task = tasks.find((item) => item.id === taskId);
  if (!task) return null;

  const project = projects.find((item) => item.id === task.projectId);
  const client = clients.find((item) => item.id === project?.clientId);
  const person = (id?: string) => people.find((item) => item.id === id);
  const reviewer = person(task.createdById)?.name ?? 'Team Lead';
  const badge = taskBadge(task);
  const late = task.due && isOverdue(task, sampleTaskNow);
  const inReview = task.status === 'review';
  const files = task.attachments ?? [];
  const comments = task.comments ?? [];

  function sendComment() {
    if (!comment.trim()) return;
    // MOCK: nanti POST /tasks/{id}/comments (draf F09).
    addComment(task!.id, userId, comment);
    setComment('');
  }

  let dueValue = task.due ? formatTaskDue(task.due) : 'Tanpa tenggat';
  if (task.revision?.due) dueValue = `${formatTaskDue(task.revision.due)} (tenggat baru)`;
  else if (late && task.due) dueValue = `${dueValue} (${formatOverdueBy(task.due, sampleTaskNow)})`;

  return (
    <>
      <Drawer
        title="Detail task"
        onClose={onClose}
        onSubmit={(event) => event.preventDefault()}
        actions={
          task.status !== 'done' ? (
            <div className={styles.footer}>
              <div className={styles.commentRow}>
                <label className={styles.commentField}>
                  <Image src="/icons/meta-message.svg" alt="" width={20} height={20} unoptimized />
                  <span className={styles.srOnly}>Komentar</span>
                  <input
                    className={styles.commentInput}
                    placeholder="Tulis komentar…"
                    maxLength={TASK_COMMENT_MAX}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        sendComment();
                      }
                    }}
                  />
                </label>
                <button
                  type="button"
                  className={styles.send}
                  aria-label="Kirim komentar"
                  disabled={!comment.trim()}
                  onClick={sendComment}
                >
                  <Image src="/icons/send.svg" alt="" width={20} height={20} unoptimized />
                </button>
              </div>
              <Button fullWidth disabled={inReview} onClick={() => setSubmitOpen(true)}>
                {inReview ? 'Menunggu review Team Lead' : 'Unggah hasil & kirim ke Review'}
                <Image src="/icons/upload-inverse.svg" alt="" width={20} height={20} unoptimized />
              </Button>
            </div>
          ) : undefined
        }
      >
        {inReview && task.submission && (
          <Alert tone="success" title={`Terkirim ke Review · ${formatTaskStamp(task.submission.at)}`}>
            {reviewer} sudah dinotifikasi. Status tidak lagi overdue selama menunggu review.
          </Alert>
        )}
        {task.revision && task.status === 'in_progress' && (
          <Alert tone="warning" title={`Perlu revisi · dari ${person(task.revision.byId)?.name ?? 'Team Lead'}`}>
            &quot;{task.revision.note}&quot;
            {task.revision.due ? ` Tenggat baru ${formatTaskDue(task.revision.due)}.` : ''}
          </Alert>
        )}

        <div className={styles.heading}>
          <div className={styles.headingTop}>
            <span className={styles.context}>
              {clientLabel(client)}
              {project ? ` · ${project.shortName}` : ''}
            </span>
            <Badge tone={badge.tone}>{badge.label}</Badge>
          </div>
          <p className={styles.title}>{task.title}</p>
        </div>

        <MetaList
          rows={[
            { icon: 'user', label: 'Penanggung jawab', value: person(task.assigneeId)?.name ?? '—' },
            { icon: 'clock', label: 'Tenggat', value: dueValue, danger: Boolean(late && !task.revision?.due) },
            { icon: 'flag', label: 'Prioritas', value: taskPriorityLabels[task.priority] },
            { icon: 'user', label: 'Dibuat oleh', value: reviewer },
          ]}
        />

        <SectionLabel>Status</SectionLabel>
        <StatusChips
          value={task.status}
          locked={inReview || task.status === 'done'}
          onChange={(status) => setStatus(task.id, status)}
          onReview={() => setSubmitOpen(true)}
        />

        {task.description && (
          <>
            <SectionLabel>Deskripsi</SectionLabel>
            <p className={styles.description}>{task.description}</p>
          </>
        )}

        {files.length > 0 && (
          <>
            <SectionLabel>Lampiran · {files.length}</SectionLabel>
            <div className={styles.files}>
              {files.map((file) => (
                <FileTile key={file.name} file={file} />
              ))}
            </div>
          </>
        )}

        <SectionLabel>Komentar · {comments.length}</SectionLabel>
        {comments.map((item) => (
          <CommentItem key={item.id} comment={item} author={person(item.authorId)} />
        ))}
        {comments.length === 0 && <p className={styles.empty}>Belum ada komentar.</p>}
      </Drawer>

      {submitOpen && (
        <SubmitDialog
          title={task.title}
          reviewer={reviewer}
          onClose={() => setSubmitOpen(false)}
          onSubmit={(sent, note) => {
            // MOCK: nanti POST /tasks/{id}/submissions (draf F09).
            submit(task.id, sent, note);
            setSubmitOpen(false);
          }}
        />
      )}
    </>
  );
}
