'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { ChipButton } from '@/components/ui/Chip';
import { overtimeDivisions } from './data';
import styles from './overtime.module.css';

type DivisionMenuProps = {
  /** null = semua divisi. */
  value: string | null;
  onChange: (division: string | null) => void;
  /** Pratinjau W95 membuka menu sejak awal. */
  defaultOpen?: boolean;
};

const options: { label: string; value: string | null }[] = [
  { label: 'Semua divisi', value: null },
  ...overtimeDivisions.map((name) => ({ label: name, value: name })),
];

/**
 * W95 · Pilih divisi: chip yang membuka daftar pilihan tunggal. Menutup saat klik di luar atau
 * Esc; panah atas/bawah berpindah pilihan.
 */
export function DivisionMenu({ value, onChange, defaultOpen = false }: DivisionMenuProps) {
  const [open, setOpen] = useState(defaultOpen);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  function focusItem(step: number) {
    const items = Array.from(
      wrapRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [],
    );
    const index = items.indexOf(document.activeElement as HTMLElement);
    items[(index + step + items.length) % items.length]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      setOpen(false);
      wrapRef.current?.querySelector<HTMLElement>('button')?.focus();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusItem(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusItem(-1);
    }
  }

  function choose(next: string | null) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className={styles.menuWrap} onKeyDown={onKeyDown}>
      <ChipButton
        selected={value !== null}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        {value ?? 'Semua divisi'}
      </ChipButton>
      {open && (
        <div id={menuId} role="menu" aria-label="Pilih divisi" className={styles.menu}>
          {options.map((option) => {
            const checked = option.value === value;
            return (
              <button
                key={option.label}
                type="button"
                role="menuitemradio"
                aria-checked={checked}
                className={styles.menuItem}
                onClick={() => choose(option.value)}
              >
                <span className={styles.menuCheck}>
                  {checked && (
                    <Image src="/icons/check-ink.svg" alt="" width={14} height={14} unoptimized />
                  )}
                </span>
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
