'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import styles from './AppSidebar.module.css';

export type SidebarItem = {
  href: string;
  label: string;
  icon: string;
  /** Ikon versi terang untuk latar gelap saat menu aktif. */
  activeIcon?: string;
};

export type SidebarUser = {
  name: string;
  role: string;
  initials: string;
  profileHref: string;
};

type AppSidebarProps = { tenant: string; items: SidebarItem[]; user: SidebarUser };

/** Sidebar web admin dan web karyawan. Halaman tujuan menyusul, jadi tautan tanpa prefetch. */
export function AppSidebar({ tenant, items, user }: AppSidebarProps) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  // W78: saat menu menjadi baris geser, geser sampai menu aktif terlihat.
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active || nav.scrollWidth <= nav.clientWidth) return;
    const start = active.offsetLeft - nav.offsetLeft;
    const end = start + active.offsetWidth;
    if (end > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = end - nav.clientWidth;
    else if (start < nav.scrollLeft) nav.scrollLeft = start;
  }, [pathname]);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.topRow}>
        <div className={styles.logo}>
          <Image src="/icons/logo-mark.svg" alt="" width={14} height={14} unoptimized />
          <span>On-Track</span>
        </div>
        {/* W77/W78: kartu pengguna di bawah sidebar diringkas jadi avatar di bar atas. */}
        <Link
          href={user.profileHref}
          prefetch={false}
          aria-label={`Profil ${user.name}`}
          className={styles.userCompact}
        >
          <Avatar initials={user.initials} size="M" />
        </Link>
      </div>
      <p className={styles.tenant}>{tenant}</p>
      <nav ref={navRef} aria-label="Navigasi utama" className={styles.nav}>
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              aria-current={active ? 'page' : undefined}
              className={`${styles.item} ${active ? styles.active : ''}`}
            >
              <Image
                src={`/icons/${(active && item.activeIcon) || item.icon}.svg`}
                alt=""
                width={20}
                height={20}
                unoptimized
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <Link href={user.profileHref} prefetch={false} className={styles.user}>
        <Avatar initials={user.initials} size="M" />
        <span className={styles.userText}>
          <span className={styles.userName}>{user.name}</span>
          <span className={styles.userRole}>{user.role}</span>
        </span>
      </Link>
    </aside>
  );
}
