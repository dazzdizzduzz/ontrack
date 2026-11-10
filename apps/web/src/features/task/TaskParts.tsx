import {
  formatFileSize,
  isImageFile,
  taskStatusLabels,
  type TaskComment,
  type TaskFile,
  type TaskPerson,
} from '@on-track/core';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { ChipButton } from '@/components/ui/Chip';
import styles from './task-parts.module.css';

/** Baris info berikon di detail task (M19, KW22): Penanggung jawab, Tenggat, Prioritas, Dibuat oleh. */
export function MetaList({
  rows,
}: {
  rows: { icon: 'user' | 'clock' | 'flag'; label: string; value: ReactNode; danger?: boolean }[];
}) {
  return (
    <dl className={styles.meta}>
      {rows.map((row) => (
        <div key={row.label} className={styles.metaRow}>
          <Image src={`/icons/meta-${row.icon}.svg`} alt="" width={18} height={18} unoptimized />
          <dt>{row.label}</dt>
          <dd className={row.danger ? styles.danger : undefined}>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Kartu lampiran: ikon gambar atau klip, nama, dan ukuran. */
export function FileTile({ file }: { file: TaskFile }) {
  return (
    <div className={styles.file}>
      <Image
        src={isImageFile(file.name) ? '/icons/meta-image.svg' : '/icons/meta-paperclip.svg'}
        alt=""
        width={18}
        height={18}
        unoptimized
      />
      <span className={styles.fileText}>
        <span className={styles.fileName}>{file.name}</span>
        <span className={styles.fileSize}>{formatFileSize(file.sizeBytes)}</span>
      </span>
    </div>
  );
}

/** Komentar task (Figma "Comment"): avatar + gelembung berisi nama, jam, dan isi. */
export function CommentItem({ comment, author }: { comment: TaskComment; author?: TaskPerson }) {
  return (
    <div className={styles.comment}>
      <Avatar initials={author?.initials ?? '?'} />
      <div className={styles.bubble}>
        <div className={styles.bubbleHead}>
          <span className={styles.author}>{author?.name ?? 'Anggota tim'}</span>
          <span className={styles.time}>{comment.at.split('T')[1]}</span>
        </div>
        <p className={styles.commentText}>{comment.text}</p>
      </div>
    </div>
  );
}

const statuses = ['todo', 'in_progress', 'review', 'done'] as const;

/**
 * Chip status (FR-18). Penanggung jawab hanya boleh To Do ↔ In Progress; Review lewat kiriman
 * hasil dan Done lewat persetujuan Team Lead, jadi kedua chip itu hanya membuka alur masing-masing.
 */
export function StatusChips({
  value,
  locked,
  onChange,
  onReview,
}: {
  value: (typeof statuses)[number];
  /** Saat menunggu review, status tidak bisa diubah (M45). */
  locked?: boolean;
  onChange: (status: 'todo' | 'in_progress') => void;
  onReview: () => void;
}) {
  return (
    <div className={styles.chips} role="group" aria-label="Status">
      {statuses.map((status) => (
        <ChipButton
          key={status}
          selected={value === status}
          disabled={locked || (status === 'done' && value !== 'done')}
          title={status === 'done' ? 'Done diberikan Team Lead setelah review' : undefined}
          onClick={() => {
            if (status === 'review') onReview();
            else if (status !== 'done') onChange(status);
          }}
        >
          {taskStatusLabels[status]}
        </ChipButton>
      ))}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className={styles.sectionLabel}>{children}</p>;
}
