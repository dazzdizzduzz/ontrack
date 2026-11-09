'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import styles from './Drawer.module.css';

type DrawerProps = {
  title: string;
  /** Baris kecil di bawah judul, misalnya jabatan dan atasan (W40). */
  subtitle?: string;
  /** Elemen di kiri judul, misalnya avatar (W40). */
  leading?: ReactNode;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  /** Tanpa aksi (panel baca saja seperti W94), footer tidak ditampilkan. */
  actions?: ReactNode;
  children: ReactNode;
};

/** Panel kanan memakai <dialog> asli: fokus terkunci di dalam panel dan Esc menutup. */
export function Drawer({ title, subtitle, leading, onClose, onSubmit, actions, children }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();

  // Fokus awal ke judul agar screen reader membacanya, bukan ke tombol tutup.
  useEffect(() => {
    ref.current?.showModal();
    headingRef.current?.focus();
  }, []);

  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === ref.current) onClose();
  }

  return (
    <dialog
      ref={ref}
      className={styles.drawer}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={handleClick}
    >
      <form className={styles.content} onSubmit={onSubmit} noValidate>
        <header className={styles.header}>
          {leading}
          <div className={styles.heading}>
            <h2 id={titleId} ref={headingRef} tabIndex={-1} className={styles.title}>
              {title}
            </h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <button type="button" className={styles.close} aria-label="Tutup" onClick={onClose}>
            <Image src="/icons/close-20.svg" alt="" width={20} height={20} unoptimized />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        {actions && <footer className={styles.footer}>{actions}</footer>}
      </form>
    </dialog>
  );
}
