import Image from 'next/image';
import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

type EmptyStateProps = {
  /** Nama file di /public/icons tanpa ekstensi. */
  icon: string;
  title: string;
  children?: ReactNode;
  /** Satu aksi sekunder, misalnya "Hapus pencarian" (W104) atau "Task baru" (W106). */
  action?: ReactNode;
};

/** Empty state Foundations: ikon dalam lingkaran, judul, penjelasan, dan satu aksi opsional. */
export function EmptyState({ icon, title, children, action }: EmptyStateProps) {
  return (
    <div className={styles.empty} role="status">
      <span className={styles.icon}>
        <Image src={`/icons/${icon}.svg`} alt="" width={20} height={20} unoptimized />
      </span>
      <p className={styles.title}>{title}</p>
      {children && <p className={styles.text}>{children}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
