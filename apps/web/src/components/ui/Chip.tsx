import Image from 'next/image';
import Link from 'next/link';
import type { ButtonHTMLAttributes, ComponentProps } from 'react';
import styles from './Chip.module.css';

type ChipLinkProps = ComponentProps<typeof Link> & { selected?: boolean };

export function ChipLink({ selected = false, ...props }: ChipLinkProps) {
  return (
    <Link
      aria-current={selected ? 'page' : undefined}
      className={`${styles.chip} ${selected ? styles.selected : ''}`}
      {...props}
    />
  );
}

type ChipButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  /** Chip pilihan tunggal seperti lokasi di W89 tidak memakai ikon centang. */
  showCheck?: boolean;
};

/** Chip filter: saat dipilih berwarna gelap dengan ikon centang. */
export function ChipButton({
  selected = false,
  showCheck = true,
  children,
  ...props
}: ChipButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`${styles.chip} ${selected ? styles.selected : ''}`}
      {...props}
    >
      {selected && showCheck && <Image src="/icons/check-inverse.svg" alt="" width={16} height={16} unoptimized />}
      {children}
    </button>
  );
}
