import type { ReactNode } from 'react';
import { AuthBrandPanel } from './AuthBrandPanel';
import styles from './AuthShell.module.css';
import type { Portal } from './portals';

export function AuthShell({ portal, children }: { portal: Portal; children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <AuthBrandPanel portal={portal} />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
