import type { ReactNode } from 'react';
import { AuthBrandPanel } from './AuthBrandPanel';
import styles from './AuthShell.module.css';

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <AuthBrandPanel />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
