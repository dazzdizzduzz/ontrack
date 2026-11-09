import Image from 'next/image';
import type { ReactNode } from 'react';
import styles from './Alert.module.css';

type AlertProps = {
  tone: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  children: ReactNode;
};

const icons = {
  success: 'check-success',
  warning: 'alert-warning',
  danger: 'alert-danger',
  info: 'info',
};

export function Alert({ tone, title, children }: AlertProps) {
  return (
    <div
      role={tone === 'info' || tone === 'success' ? 'status' : 'alert'}
      className={`${styles.alert} ${styles[tone]}`}
    >
      <Image src={`/icons/${icons[tone]}.svg`} alt="" width={20} height={20} unoptimized />
      <div className={styles.text}>
        <p className={styles.title}>{title}</p>
        <p className={styles.body}>{children}</p>
      </div>
    </div>
  );
}
