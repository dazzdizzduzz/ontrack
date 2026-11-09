import Image from 'next/image';
import type { ReactNode } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import styles from './AuthParts.module.css';
import { authHref, portals, type Portal } from './portals';

export function AuthStack({ children }: { children: ReactNode }) {
  return <div className={styles.stack}>{children}</div>;
}

type IconBadgeProps = {
  portal: Portal;
  icon: string;
  /** subtle: 64px, accent/neutral: 80px; ukuran ikon mengikuti file SVG dari Figma. */
  tone?: 'subtle' | 'accent' | 'neutral';
};

const iconSizes = { subtle: 27, accent: 34, neutral: 34 };

export function AuthIconBadge({ portal, icon, tone = 'subtle' }: IconBadgeProps) {
  const size = iconSizes[tone];
  const center = portals[portal].centerIcons ? styles.center : '';

  return (
    <div className={`${styles.badge} ${styles[tone]} ${center}`}>
      <Image src={`/icons/${icon}.svg`} alt="" width={size} height={size} unoptimized />
    </div>
  );
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

export function BackToLoginLink({ portal }: { portal: Portal }) {
  return (
    <div className={portals[portal].centerIcons ? styles.center : styles.start}>
      <ButtonLink variant="ghost" href={authHref(portal, 'login')}>
        Kembali ke login
        <Image src="/icons/back.svg" alt="" width={20} height={20} unoptimized />
      </ButtonLink>
    </div>
  );
}
