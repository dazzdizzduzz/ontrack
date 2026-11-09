import type { ReactNode } from 'react';
import styles from './AuthParts.module.css';

export function AuthStack({ children }: { children: ReactNode }) {
  return <div className={styles.stack}>{children}</div>;
}

export function AuthHeading({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.body}>{children}</p>
    </>
  );
}

export function AuthNote({ children }: { children: ReactNode }) {
  return <p className={styles.note}>{children}</p>;
}
