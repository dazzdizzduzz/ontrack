import Image from 'next/image';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import styles from './TaskCard.module.css';

type TaskCardStatus = 'todo' | 'in_progress' | 'review' | 'done';

type TaskCardProps = {
  client: string;
  title: string;
  due: string;
  assignee: string;
  overdue?: boolean;
  /** Status di badge; bawaan "In progress" seperti beranda karyawan (KW08). */
  status?: TaskCardStatus;
  /** W50: task yang baru dibuat diberi garis aksen. */
  highlight?: boolean;
  /** Membuka detail (KW22, W51). Tombol menutupi seluruh kartu dan diberi nama task. */
  onOpen?: () => void;
};

const badges: Record<TaskCardStatus, { tone: 'neutral' | 'warning' | 'success'; label: string }> = {
  todo: { tone: 'neutral', label: 'To do' },
  in_progress: { tone: 'neutral', label: 'In progress' },
  review: { tone: 'warning', label: 'Review' },
  done: { tone: 'success', label: 'Done' },
};

/** Kartu Kanban (FR-19). Overdue = garis merah + badge + ikon jam merah (FR-20). */
export function TaskCard({
  client,
  title,
  due,
  assignee,
  overdue = false,
  status = 'in_progress',
  highlight = false,
  onOpen,
}: TaskCardProps) {
  const badge = overdue ? { tone: 'danger' as const, label: 'Overdue' } : badges[status];
  return (
    <article
      className={`${styles.card} ${overdue ? styles.overdue : ''} ${highlight ? styles.highlight : ''} ${onOpen ? styles.clickable : ''}`}
    >
      {onOpen && (
        <button type="button" className={styles.open} onClick={onOpen}>
          <span className={styles.srOnly}>Buka detail {title}</span>
        </button>
      )}
      <div className={styles.row}>
        <span className={styles.client}>{client}</span>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>
      <p className={styles.title}>{title}</p>
      <div className={styles.row}>
        <span className={`${styles.due} ${overdue ? styles.dueOverdue : ''}`}>
          <Image
            src={overdue ? '/icons/clock-small-danger.svg' : '/icons/clock-small.svg'}
            alt=""
            width={16}
            height={16}
            unoptimized
          />
          {due}
        </span>
        <Avatar initials={assignee} />
      </div>
    </article>
  );
}
