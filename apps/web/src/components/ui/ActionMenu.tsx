'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import styles from './ActionMenu.module.css';

export type ActionMenuItem = {
  label: string;
  icon: string;
  href: string;
  danger?: boolean;
};

type ActionMenuProps = { label: string; items: ActionMenuItem[] };

const MENU_WIDTH = 208;
const GAP = 4;

/**
 * Tombol titik tiga dengan menu aksi (W81). Menu memakai posisi fixed agar tidak
 * terpotong oleh tabel yang bisa digeser; menutup saat klik di luar, Esc, atau gulir.
 */
export function ActionMenu({ label, items }: ActionMenuProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const open = position !== null;

  function openMenu() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.max(GAP, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - GAP));
    setPosition({ top: rect.bottom + GAP, left });
  }

  function close(returnFocus: boolean) {
    setPosition(null);
    if (returnFocus) triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    const trigger = triggerRef.current;

    // Balik ke atas tombol jika menu melewati bawah layar.
    if (menu && trigger) {
      const rect = trigger.getBoundingClientRect();
      if (rect.bottom + GAP + menu.offsetHeight > window.innerHeight) {
        setPosition((current) =>
          current && { ...current, top: Math.max(GAP, rect.top - GAP - menu.offsetHeight) },
        );
      }
    }
    menu?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menu?.contains(target) && !trigger?.contains(target)) close(false);
    };
    const onScroll = () => close(false);
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  function handleMenuKey(event: KeyboardEvent<HTMLDivElement>) {
    const links = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    const index = links.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    } else if (event.key === 'Tab') {
      close(false);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      links.at((index + step) % links.length)?.focus();
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? close(false) : openMenu())}
      >
        <Image src="/icons/more.svg" alt="" width={20} height={20} unoptimized />
      </button>
      {position && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          className={styles.menu}
          style={{ top: position.top, left: position.left }}
          onKeyDown={handleMenuKey}
        >
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              role="menuitem"
              tabIndex={-1}
              className={`${styles.item} ${item.danger ? styles.danger : ''}`}
              onClick={() => close(false)}
            >
              <Image src={`/icons/${item.icon}.svg`} alt="" width={18} height={18} unoptimized />
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
