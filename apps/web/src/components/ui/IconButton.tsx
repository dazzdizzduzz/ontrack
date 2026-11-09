import Image from 'next/image';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import styles from './IconButton.module.css';

type IconLinkProps = ComponentProps<typeof Link> & { icon: string; label: string };

/** Tautan ikon dengan target sentuh 44×44 dan label untuk screen reader. */
export function IconLink({ icon, label, ...props }: IconLinkProps) {
  return (
    <Link aria-label={label} className={styles.iconButton} {...props}>
      <Image src={`/icons/${icon}.svg`} alt="" width={20} height={20} unoptimized />
    </Link>
  );
}
