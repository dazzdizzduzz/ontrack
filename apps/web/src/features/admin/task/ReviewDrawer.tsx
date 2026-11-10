'use client';

import {
  TASK_NOTE_MAX,
  formatTaskDue,
  formatTaskStamp,
  isImageFile,
  sampleReviewComment,
  sampleRevisionNote,
  taskPriorityLabels,
  type Task,
} from '@on-track/core';
import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Drawer } from '@/components/ui/Drawer';
import { TextareaField } from '@/components/ui/Field';
import detail from '@/features/admin/leave/leave.module.css';
import { FileTile } from '@/features/task/TaskParts';
import { clientLabel, useTasks } from '@/features/task/TaskProvider';
import styles from './task.module.css';

/** Nama depan untuk "Catatan dari Bagus" dan "Terkirim ke Bagus" (W51). */
const firstName = (name: string) => name.split(' ')[0] ?? name;

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={detail.detailRow}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/**
 * W51 · Review task (drawer) dan W53 · Minta revisi (dialog). Setujui memindahkan task ke Done
 * (W52); minta revisi mengembalikannya ke In Progress dengan catatan wajib (FR-18).
 */
export function ReviewDrawer({
  task,
  reviewerId,
  preview,
  onClose,
  onApproved,
  onRevised,
}: {
  task: Task;
  reviewerId: string;
  preview?: 'review' | 'revisi';
  onClose: () => void;
  onApproved: (task: Task) => void;
  onRevised: (task: Task) => void;
}) {
  const { projects, clients, people, approve, requestRevision } = useTasks();
  const [comment, setComment] = useState(preview ? sampleReviewComment : '');
  const [revising, setRevising] = useState(preview === 'revisi');
  const [note, setNote] = useState(preview === 'revisi' ? sampleRevisionNote : '');
  const [touched, setTouched] = useState(false);

  const project = projects.find((item) => item.id === task.projectId);
  const client = clients.find((item) => item.id === project?.clientId);
  const assignee = people.find((item) => item.id === task.assigneeId);
  const name = assignee?.name ?? 'karyawan';
  const files = task.submission?.files ?? [];
  const images = files.filter((file) => isImageFile(file.name));
  const others = files.filter((file) => !isImageFile(file.name));
  const noteMissing = note.trim().length === 0;

  function handleApprove(event: FormEvent) {
    event.preventDefault();
    // MOCK: nanti POST /tasks/{id}/approve (draf F09).
    approve(task.id, comment);
    onApproved(task);
  }

  function handleRevision(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (noteMissing) return;
    // MOCK: nanti POST /tasks/{id}/revisions (draf F09).
    requestRevision(task.id, note, reviewerId);
    onRevised(task);
  }

  return (
    <>
      <Drawer
        title={task.title}
        eyebrow={`${clientLabel(client)}${project ? ` · ${project.shortName}` : ''}`}
        onClose={onClose}
        onSubmit={handleApprove}
        actions={
          <>
            <Button variant="secondary" compact onClick={() => setRevising(true)}>
              Minta revisi
              <Image src="/icons/refresh.svg" alt="" width={20} height={20} unoptimized />
            </Button>
            <Button compact type="submit">
              Setujui · pindah ke Done
              <Image src="/icons/check-inverse-20.svg" alt="" width={20} height={20} unoptimized />
            </Button>
          </>
        }
      >
        <dl className={detail.detail}>
          <DetailRow label="Penanggung jawab" value={name} />
          <DetailRow label="Tenggat" value={task.due ? formatTaskDue(task.due) : '—'} />
          {task.submission && (
            <DetailRow label="Dikirim ke Review" value={formatTaskStamp(task.submission.at).replace(' ', ' · ')} />
          )}
          <DetailRow label="Prioritas" value={taskPriorityLabels[task.priority]} />
        </dl>

        <p className={detail.sectionLabel}>Hasil kerja · {files.length} file</p>
        {images.length > 0 && (
          // MOCK: pratinjau gambar asli dari thumbnail_url setelah API tersambung.
          <ul className={styles.thumbs}>
            {images.map((file, index) => (
              <li key={file.name} className={`${styles.thumb} ${styles[`thumb${index % 3}`]}`}>
                <span className={styles.thumbName}>{file.name}</span>
              </li>
            ))}
          </ul>
        )}
        {others.length > 0 && (
          <div className={styles.otherFiles}>
            {others.map((file) => (
              <FileTile key={file.name} file={file} />
            ))}
          </div>
        )}

        {task.submission?.note && (
          <div className={styles.noteBox}>
            <span className={styles.noteLabel}>Catatan dari {firstName(name)}</span>
            <p className={styles.noteText}>{task.submission.note}</p>
          </div>
        )}

        <TextareaField
          label="Komentar review"
          helper={`Terkirim ke ${firstName(name)}`}
          maxLength={TASK_NOTE_MAX}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
      </Drawer>

      {revising && (
        <Dialog
          title="Minta revisi task ini?"
          description={`Status kembali ke In Progress dan ${name} menerima catatan revisi.`}
          onClose={() => setRevising(false)}
          onSubmit={handleRevision}
          actions={
            <>
              <Button variant="secondary" compact onClick={() => setRevising(false)}>
                Batal
              </Button>
              <Button compact type="submit" disabled={noteMissing}>
                Kirim revisi
              </Button>
            </>
          }
        >
          <TextareaField
            label="Catatan revisi"
            helper="Wajib diisi"
            error={touched && noteMissing ? 'Catatan revisi wajib diisi' : undefined}
            maxLength={TASK_NOTE_MAX}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            onBlur={() => setTouched(true)}
            required
            autoFocus
          />
        </Dialog>
      )}
    </>
  );
}
