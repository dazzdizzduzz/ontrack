import type { ReactNode } from 'react';
import styles from './AppShell.module.css';

export function AppShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <div className={styles.layout}>
      {sidebar}
      {children}
    </div>
  );
}
