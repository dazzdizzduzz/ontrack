import Image from 'next/image';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import styles from './TaskCard.module.css';

type TaskCardProps = {
  client: string;
  title: string;
  due: string;
  assignee: string;
  overdue?: boolean;
};

export function TaskCard({ client, title, due, assignee, overdue = false }: TaskCardProps) {
  return (
    <article className={`${styles.card} ${overdue ? styles.overdue : ''}`}>
      <div className={styles.row}>
        <span className={styles.client}>{client}</span>
        <Badge tone={overdue ? 'danger' : 'neutral'}>{overdue ? 'Overdue' : 'In progress'}</Badge>
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
