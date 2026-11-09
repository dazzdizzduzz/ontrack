import styles from './Badge.module.css';

type Tone = 'neutral' | 'danger' | 'warning' | 'success' | 'inverse';

/** Warna selalu disertai label teks (WCAG 1.4.1). */
export function Badge({ tone, children }: { tone: Tone; children: string }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
