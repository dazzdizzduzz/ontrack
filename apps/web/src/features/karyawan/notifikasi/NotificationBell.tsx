'use client';

import { sampleNotifications, type AppNotification, type NotificationKind } from '@on-track/core';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState, type MouseEvent } from 'react';
import styles from './notifikasi.module.css';

const icons: Record<NotificationKind, string> = {
  leave_approved: 'check-ink',
  leave_rejected: 'close-20',
  task_assigned: 'task',
  task_revision: 'revision',
  task_overdue: 'clock',
  task_comment: 'message',
  clockout_reminder: 'bell',
  payslip_published: 'wallet',
};

/** Halaman tujuan per jenis; task (F08) dan slip gaji (F11) belum punya halaman. */
function targetOf(notification: AppNotification): string | null {
  if (notification.leaveId) return '/karyawan/izin';
  if (notification.kind === 'clockout_reminder') return '/karyawan/beranda';
  return null;
}

/**
 * KW25 · lonceng di header web karyawan yang membuka popover notifikasi (FR-15, FR-20). Memakai
 * <dialog> modal agar fokus terkunci, Esc menutup, dan latar meredup seperti Figma. MOCK: status
 * baca hanya di memori halaman; nanti GET /me/notifications (draf F07).
 */
export function NotificationBell({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>(sampleNotifications);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const bellRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const unread = items.filter((item) => item.unread).length;

  function open() {
    const rect = bellRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  function select(notification: AppNotification) {
    setItems((list) => list.map((item) => (item.id === notification.id ? { ...item, unread: false } : item)));
    const target = targetOf(notification);
    if (target) {
      close();
      router.push(target);
    }
  }

  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) close();
  }

  return (
    <>
      <button
        ref={(node) => {
          bellRef.current = node;
          // Pratinjau KW25: buka sekali setelah tombol terpasang.
          if (node && defaultOpen && !dialogRef.current?.open) requestAnimationFrame(open);
        }}
        type="button"
        aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : 'Notifikasi'}
        aria-haspopup="dialog"
        className={styles.bell}
        onClick={open}
      >
        <Image src="/icons/bell.svg" alt="" width={20} height={20} unoptimized />
      </button>

      <dialog
        ref={dialogRef}
        className={styles.popover}
        style={{ top: position.top, right: position.right }}
        aria-labelledby="notifikasi-judul"
        onClick={handleClick}
      >
        <div className={styles.header}>
          {/* Fokus awal ke judul agar pembaca layar membacanya, bukan ke daftar yang bisa digulir. */}
          <h2 id="notifikasi-judul" className={styles.title} tabIndex={-1} autoFocus>
            Notifikasi
          </h2>
          <p className={styles.count}>{unread > 0 ? `${unread} belum dibaca` : 'Semua sudah dibaca'}</p>
        </div>
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`${styles.item} ${item.unread ? styles.unread : ''}`}
                onClick={() => select(item)}
              >
                <span className={styles.iconWrap}>
                  <Image src={`/icons/${icons[item.kind]}.svg`} alt="" width={20} height={20} unoptimized />
                </span>
                <span className={styles.text}>
                  <span className={styles.itemTitle}>
                    {item.unread && <span className={styles.srOnly}>Belum dibaca. </span>}
                    {item.title}
                  </span>
                  <span className={styles.body}>{item.body}</span>
                  <span className={styles.time}>{item.time}</span>
                </span>
                <span className={`${styles.dot} ${item.unread ? styles.dotUnread : ''}`} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </dialog>
    </>
  );
}
