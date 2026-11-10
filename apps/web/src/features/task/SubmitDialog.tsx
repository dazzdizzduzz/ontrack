'use client';

import {
  TASK_ATTACHMENT_EXTENSIONS,
  TASK_ATTACHMENT_MAX_BYTES,
  TASK_NOTE_MAX,
  formatFileSize,
  type TaskFile,
} from '@on-track/core';
import Image from 'next/image';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { TextareaField } from '@/components/ui/Field';
import styles from './task-detail.module.css';

/**
 * Kirim hasil ke Review di web karyawan. Figma hanya punya versi mobile (M44 bottom sheet), jadi
 * web memakai isi yang sama di dalam dialog. Minimal satu file (US-07 AC-1).
 */
export function SubmitDialog({
  title,
  reviewer,
  initialFiles = [],
  initialNote = '',
  onClose,
  onSubmit,
}: {
  title: string;
  reviewer: string;
  initialFiles?: TaskFile[];
  initialNote?: string;
  onClose: () => void;
  onSubmit: (files: TaskFile[], note: string) => void;
}) {
  const [files, setFiles] = useState<TaskFile[]>(initialFiles);
  const [note, setNote] = useState(initialNote);
  const [error, setError] = useState<string | null>(null);

  function pick(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = '';
    const rejected = picked.find((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      return !TASK_ATTACHMENT_EXTENSIONS.includes(ext) || file.size > TASK_ATTACHMENT_MAX_BYTES;
    });
    if (rejected) {
      setError(`${rejected.name} tidak bisa dikirim. Pakai PDF, JPG, PNG, AI, atau FIG maks. 20 MB.`);
      return;
    }
    setError(null);
    setFiles((list) => [...list, ...picked.map((file) => ({ name: file.name, sizeBytes: file.size }))]);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (files.length === 0) {
      setError('Tambahkan minimal satu file hasil kerja.');
      return;
    }
    onSubmit(files, note);
  }

  return (
    <Dialog
      title="Kirim hasil ke Review"
      description={`${title} · Team Lead ${reviewer} akan menerima notifikasi.`}
      size="xl"
      showClose
      onClose={onClose}
      onSubmit={handleSubmit}
      actions={
        <>
          <Button variant="secondary" compact onClick={onClose}>
            Batal
          </Button>
          <Button compact type="submit">
            Kirim ke Review
            <Image src="/icons/send.svg" alt="" width={20} height={20} unoptimized />
          </Button>
        </>
      }
    >
      <ul className={styles.uploadList} aria-label="File hasil kerja">
        {files.map((file, index) => (
          <li key={`${file.name}-${index}`} className={styles.uploadItem}>
            <Image src="/icons/paperclip.svg" alt="" width={20} height={20} unoptimized />
            <span className={styles.uploadText}>
              <span className={styles.uploadName}>{file.name}</span>
              <span className={styles.uploadMeta}>{formatFileSize(file.sizeBytes)} · terunggah</span>
            </span>
            <button
              type="button"
              className={styles.iconButton}
              aria-label={`Hapus ${file.name}`}
              onClick={() => setFiles((list) => list.filter((_, i) => i !== index))}
            >
              <Image src="/icons/close-20.svg" alt="" width={20} height={20} unoptimized />
            </button>
          </li>
        ))}
      </ul>
      <label className={styles.addFile}>
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.ai,.fig"
          className={styles.fileInput}
          onChange={pick}
        />
        Tambah file
        <Image src="/icons/upload.svg" alt="" width={20} height={20} unoptimized />
      </label>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <TextareaField
        label="Catatan untuk Team Lead"
        helper="Opsional"
        maxLength={TASK_NOTE_MAX}
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
    </Dialog>
  );
}
