'use client';

import {
  TASK_ATTACHMENT_EXTENSIONS,
  TASK_ATTACHMENT_MAX_BYTES,
  TASK_DESCRIPTION_MAX,
  TASK_TITLE_MAX,
  formatFileSize,
  parseTaskDue,
  taskPriorityLabels,
  taskPriorityOrder,
  validateTask,
  type Task,
  type TaskDraft,
} from '@on-track/core';
import Image from 'next/image';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ChipButton } from '@/components/ui/Chip';
import { Dialog } from '@/components/ui/Dialog';
import { SelectField, TextareaField, TextField } from '@/components/ui/Field';
import { useTasks } from './TaskProvider';
import styles from './task.module.css';

const NO_PROJECT = 'Tanpa proyek';

export const emptyTaskDraft: TaskDraft = {
  title: '',
  projectId: '',
  assigneeId: '',
  due: '',
  priority: 'sedang',
  description: '',
};

type Attachment = { name: string; sizeBytes: number };

/**
 * W10 · Task baru (modal) dan W49 · Validasi. Judul dan penanggung jawab wajib (US-06 AC-2);
 * setelah percobaan simpan yang gagal, tombol Simpan nonaktif sampai semuanya terisi.
 */
export function TaskFormDialog({
  initialDraft,
  initialSubmitted = false,
  onClose,
  onCreated,
}: {
  initialDraft: TaskDraft;
  initialSubmitted?: boolean;
  onClose: () => void;
  onCreated: (task: Task) => void;
}) {
  const { projects, people, tasks } = useTasks();
  const [draft, setDraft] = useState<TaskDraft>(initialDraft);
  const [submitted, setSubmitted] = useState(initialSubmitted);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const errors = validateTask(draft);
  const invalid = Object.keys(errors).length > 0;
  const shown = submitted ? errors : {};
  const missingRequired = submitted && (errors.title || errors.assigneeId);

  const projectNames = [NO_PROJECT, ...projects.map((project) => project.name)];
  const personNames = people.map((person) => person.name);

  function update(patch: Partial<TaskDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function pickFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    const rejected = files.find((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      return !TASK_ATTACHMENT_EXTENSIONS.includes(ext) || file.size > TASK_ATTACHMENT_MAX_BYTES;
    });
    if (rejected) {
      setFileError(`${rejected.name} tidak bisa dilampirkan. Pakai PDF, JPG, PNG, AI, atau FIG maks. 20 MB.`);
      return;
    }
    setFileError(null);
    setAttachments((list) => [...list, ...files.map((file) => ({ name: file.name, sizeBytes: file.size }))]);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (invalid) return;
    // MOCK: nanti POST /tasks (multipart). Task baru selalu masuk To Do (US-06 AC-1).
    onCreated({
      id: `t-${tasks.length + 1}-${Date.now()}`,
      title: draft.title.trim(),
      description: draft.description.trim() || undefined,
      projectId: draft.projectId || undefined,
      assigneeId: draft.assigneeId,
      priority: draft.priority,
      status: 'todo',
      due: parseTaskDue(draft.due) ?? undefined,
      attachments: attachments.length ? attachments : undefined,
    });
  }

  return (
    <Dialog
      title="Task baru"
      size="xl"
      showClose
      onClose={onClose}
      onSubmit={handleSubmit}
      actions={
        <>
          <Button variant="secondary" compact onClick={onClose}>
            Batal
          </Button>
          <Button compact type="submit" disabled={submitted && invalid}>
            Simpan task
          </Button>
        </>
      }
    >
      {missingRequired && (
        <Alert tone="danger" title="Task belum bisa disimpan">
          Lengkapi judul dan penanggung jawab terlebih dahulu.
        </Alert>
      )}

      <TextField
        label="Judul task *"
        helper="Wajib diisi"
        error={shown.title}
        maxLength={TASK_TITLE_MAX}
        value={draft.title}
        onChange={(event) => update({ title: event.target.value })}
        autoFocus
      />

      <div className={styles.formRow}>
        <SelectField
          label="Proyek"
          options={projectNames}
          value={projects.find((project) => project.id === draft.projectId)?.name ?? NO_PROJECT}
          onChange={(event) =>
            update({ projectId: projects.find((project) => project.name === event.target.value)?.id ?? '' })
          }
        />
        <SelectField
          label="Penanggung jawab *"
          placeholder="Pilih karyawan"
          options={personNames}
          error={shown.assigneeId}
          value={people.find((person) => person.id === draft.assigneeId)?.name ?? ''}
          onChange={(event) =>
            update({ assigneeId: people.find((person) => person.name === event.target.value)?.id ?? '' })
          }
        />
      </div>

      <div className={styles.formRow}>
        <TextField
          label="Tenggat"
          placeholder="07/10/2026 · 17.00"
          error={shown.due}
          value={draft.due}
          onChange={(event) => update({ due: event.target.value })}
        />
        <div className={styles.priority}>
          <span className={styles.fieldLabel} id="prioritas-label">
            Prioritas
          </span>
          <div className={styles.chips} role="group" aria-labelledby="prioritas-label">
            {taskPriorityOrder.map((priority) => (
              <ChipButton
                key={priority}
                selected={draft.priority === priority}
                onClick={() => update({ priority })}
              >
                {taskPriorityLabels[priority]}
              </ChipButton>
            ))}
          </div>
        </div>
      </div>

      <TextareaField
        label="Deskripsi"
        helper="Opsional"
        maxLength={TASK_DESCRIPTION_MAX}
        value={draft.description}
        onChange={(event) => update({ description: event.target.value })}
      />

      <div className={styles.attach}>
        <span className={styles.fieldLabel}>Lampiran (opsional)</span>
        {attachments.map((file, index) => (
          <div key={`${file.name}-${index}`} className={styles.file}>
            <Image src="/icons/paperclip.svg" alt="" width={20} height={20} unoptimized />
            <span className={styles.fileText}>
              <span className={styles.fileName}>{file.name}</span>
              <span className={styles.fileMeta}>{formatFileSize(file.sizeBytes)}</span>
            </span>
            <button
              type="button"
              className={styles.remove}
              aria-label={`Hapus lampiran ${file.name}`}
              onClick={() => setAttachments((list) => list.filter((_, i) => i !== index))}
            >
              <Image src="/icons/close-20.svg" alt="" width={20} height={20} unoptimized />
            </button>
          </div>
        ))}
        <label className={styles.upload}>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.ai,.fig"
            className={styles.fileInput}
            onChange={pickFiles}
          />
          <span className={styles.uploadIcon}>
            <Image src="/icons/upload.svg" alt="" width={20} height={20} unoptimized />
          </span>
          <span className={styles.fileText}>
            <span className={styles.fileName}>Unggah brief, referensi, atau aset</span>
            <span className={styles.fileMeta}>PDF, JPG, PNG, AI, FIG · maks. 20 MB</span>
          </span>
        </label>
        {fileError && (
          <span className={styles.error} role="alert">
            {fileError}
          </span>
        )}
      </div>
    </Dialog>
  );
}
