import Image from 'next/image';
import styles from './Badge.module.css';

type Tone = 'neutral' | 'danger' | 'warning' | 'success' | 'inverse';

const dots: Record<Tone, string> = {
  neutral: 'dot-neutral',
  danger: 'dot-danger',
  warning: 'dot-warning',
  success: 'dot-success',
  inverse: 'dot-accent',
};

/** Warna selalu disertai label teks (WCAG 1.4.1). */
export function Badge({ tone, children }: { tone: Tone; children: string }) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      <Image src={`/icons/${dots[tone]}.svg`} alt="" width={6} height={6} unoptimized />
      {children}
    </span>
  );
}
