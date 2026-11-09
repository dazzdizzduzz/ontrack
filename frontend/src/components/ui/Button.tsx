import Link from 'next/link';
import type { ButtonHTMLAttributes, ComponentProps } from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';

type Common = {
  variant?: Variant;
  fullWidth?: boolean;
  /** Ukuran M (padding 8/16) untuk aksi di dalam kartu; bawaan ukuran L. */
  compact?: boolean;
};

const cx = ({ variant = 'primary', fullWidth, compact }: Common, className?: string) =>
  [styles.button, styles[variant], fullWidth && styles.fullWidth, compact && styles.compact, className]
    .filter(Boolean)
    .join(' ');

export function Button({
  variant,
  fullWidth,
  compact,
  className,
  type = 'button',
  ...props
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={cx({ variant, fullWidth, compact }, className)} {...props} />;
}

export function ButtonLink({
  variant,
  fullWidth,
  compact,
  className,
  ...props
}: Common & ComponentProps<typeof Link>) {
  return <Link className={cx({ variant, fullWidth, compact }, className)} {...props} />;
}
