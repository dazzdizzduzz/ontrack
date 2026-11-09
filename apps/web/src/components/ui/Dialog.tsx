'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import styles from './Dialog.module.css';

type DialogProps = {
  title: string;
  /** Kalimat di bawah judul; W38 tidak memakainya. */
  description?: string;
  /** Tombol tutup (×) di kanan judul, seperti W38 dan W39. */
  showClose?: boolean;
  /** sm 400 px (bawaan), md 520 px (W38), lg 640 px (W39). */
  size?: 'sm' | 'md' | 'lg';
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  actions: ReactNode;
  children?: ReactNode;
};

/** Memakai <dialog> asli: fokus terkunci di dalam dialog dan Esc menutup. */
export function Dialog({
  title,
  description,
  showClose = false,
  size = 'sm',
  onClose,
  onSubmit,
  actions,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === ref.current) onClose();
  }

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${styles[size]}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={onClose}
      onClick={handleClick}
    >
      <form className={styles.content} onSubmit={onSubmit} noValidate>
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {showClose && (
            <button type="button" className={styles.close} aria-label="Tutup" onClick={onClose}>
              <Image src="/icons/close-20.svg" alt="" width={20} height={20} unoptimized />
            </button>
          )}
        </header>
        {description && (
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
        )}
        {children}
        <div className={styles.actions}>{actions}</div>
      </form>
    </dialog>
  );
}
