'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ActionMenu, type ActionMenuItem } from '@/components/ui/ActionMenu';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ChipButton } from '@/components/ui/Chip';
import { SearchField } from '@/components/ui/Field';
import { IconLink } from '@/components/ui/IconButton';
import { Toast } from '@/components/ui/Toast';
import {
  ACTIVE_NOT_LISTED,
  filterDivisions,
  initialsOf,
  sampleInvited,
  statusBadges,
  type Employee,
} from './data';
import { EmployeeSubNav } from './EmployeeSubNav';
import { useEmployees } from './EmployeesProvider';
import styles from './employees.module.css';

type EmployeeListProps = {
  /** W30: email karyawan yang baru ditambahkan. */
  addedEmail?: string;
};

/** W81: karyawan nonaktif tidak punya aksi Nonaktifkan; aktifkan kembali ada di W90. */
function menuItems(row: Employee): ActionMenuItem[] {
  const items: ActionMenuItem[] = [
    { label: 'Lihat detail', icon: 'menu-eye', href: `/data-karyawan/${row.id}` },
    { label: 'Edit', icon: 'menu-edit', href: `/data-karyawan/${row.id}/edit` },
  ];
  if (row.status !== 'nonaktif') {
    items.push({
      label: 'Nonaktifkan',
      icon: 'menu-lock-danger',
      href: `/data-karyawan/${row.id}?aksi=nonaktifkan`,
      danger: true,
    });
  }
  return items;
}

/** W15 · Karyawan, W30 · Berhasil Ditambahkan, W81 · Menu Aksi */
export function EmployeeList({ addedEmail }: EmployeeListProps) {
  const { employees } = useEmployees();
  const [query, setQuery] = useState('');
  const [division, setDivision] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(Boolean(addedEmail));

  const rows = useMemo(() => {
    // Pratinjau W30 lewat URL menampilkan contoh Figma walau belum ada yang ditambahkan.
    const isPreview = addedEmail === sampleInvited.email;
    const hasSample = employees.some((row) => row.email === sampleInvited.email);
    return isPreview && !hasSample ? [sampleInvited, ...employees] : employees;
  }, [addedEmail, employees]);

  const inactive = rows.filter((row) => row.status === 'nonaktif').length;
  const active = rows.length - inactive + ACTIVE_NOT_LISTED;

  const keyword = query.trim().toLowerCase();
  const visible = rows.filter(
    (row) =>
      (!division || row.division === division) &&
      [row.name, row.position, row.email].some((text) => text.toLowerCase().includes(keyword)),
  );
  // MOCK: total memakai angka Figma selama daftar belum difilter.
  const unfiltered = !division && !keyword;
  const total = visible.length + (unfiltered ? ACTIVE_NOT_LISTED : 0);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Karyawan</h1>
          <p className={styles.subtitle}>
            {active} aktif · {inactive} nonaktif · Studio Tigapagi
          </p>
        </div>
        <ButtonLink compact href="/data-karyawan/tambah">
          Tambah karyawan
          <Image src="/icons/plus-inverse.svg" alt="" width={20} height={20} unoptimized />
        </ButtonLink>
      </header>

      {toastOpen && addedEmail && (
        <Toast
          tone="success"
          title="Karyawan berhasil ditambahkan"
          onDismiss={() => setToastOpen(false)}
        >
          Undangan login dikirim ke {addedEmail}.
        </Toast>
      )}

      <EmployeeSubNav current="/data-karyawan" />

      <div className={styles.tools}>
        <div className={styles.search}>
          <SearchField
            aria-label="Cari karyawan"
            placeholder="Cari nama, jabatan, atau email…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <ChipButton selected={!division} onClick={() => setDivision(null)}>
          Semua divisi
        </ChipButton>
        {filterDivisions.map((name) => (
          <ChipButton key={name} selected={division === name} onClick={() => setDivision(name)}>
            {name}
          </ChipButton>
        ))}
      </div>

      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Karyawan</th>
              <th scope="col" className={styles.colPosition}>
                Jabatan
              </th>
              <th scope="col" className={styles.colMeta}>
                Divisi
              </th>
              <th scope="col" className={styles.colMeta}>
                Peran
              </th>
              <th scope="col" className={styles.colMeta}>
                Status kerja
              </th>
              <th scope="col" className={styles.colMeta}>
                Status
              </th>
              <th scope="col" className={styles.colActions}>
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const badge = statusBadges[row.status];
              const inactive = row.status === 'nonaktif';
              return (
                <tr key={row.id}>
                  <td>
                    <div className={styles.person}>
                      <Avatar initials={initialsOf(row.name)} size="M" muted={inactive} />
                      <div className={`${styles.personText} ${inactive ? styles.personInactive : ''}`}>
                        <Link href={`/data-karyawan/${row.id}`} className={styles.personName}>
                          {row.name}
                        </Link>
                        <span className={styles.personEmail}>{row.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{row.position}</td>
                  <td>{row.division}</td>
                  <td>{row.role}</td>
                  <td>{row.employment}</td>
                  <td>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </td>
                  <td className={styles.colActions}>
                    <div className={styles.actions}>
                      <IconLink
                        href={`/data-karyawan/${row.id}/edit`}
                        icon="edit"
                        label={`Edit ${row.name}`}
                      />
                      <ActionMenu label={`Aksi untuk ${row.name}`} items={menuItems(row)} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  Tidak ada karyawan yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
        {visible.length > 0 && (
          <div className={styles.pagination}>
            <p className={styles.paginationText}>
              Menampilkan 1–{visible.length} dari {total} karyawan
            </p>
            <div className={styles.paginationNav}>
              <Button variant="secondary" compact disabled>
                Sebelumnya
              </Button>
              {/* MOCK: sisa karyawan tidak ada di data contoh, jadi belum ada halaman berikutnya. */}
              <Button variant="secondary" compact disabled>
                Berikutnya
                <Image src="/icons/arrow-right.svg" alt="" width={20} height={20} unoptimized />
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
