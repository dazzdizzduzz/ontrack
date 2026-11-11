'use client';

import { SALARY_PROFILES_NOT_LISTED, formatMoneyPlain } from '@on-track/core';
import Image from 'next/image';
import { Avatar } from '@/components/ui/Avatar';
import { ButtonLink } from '@/components/ui/Button';
import shared from '../employees/employees.module.css';
import { LockNote } from './LockNote';
import { usePayroll } from './PayrollProvider';
import styles from './payroll.module.css';

/** W54 · Komponen gaji per karyawan. Profil tanpa BPJS/potongan ditandai "Belum lengkap". */
export function SalaryList() {
  const { profiles } = usePayroll();
  const incomplete = profiles.filter((profile) => !profile.components).length;
  const total = profiles.length + SALARY_PROFILES_NOT_LISTED;

  return (
    <main className={shared.main}>
      <ButtonLink variant="ghost" compact href="/payroll" className={shared.back}>
        Kembali ke Payroll
      </ButtonLink>

      <header className={shared.header}>
        <div className={shared.titleBlock}>
          <h1 className={shared.title}>Komponen Gaji</h1>
          <p className={shared.subtitle}>
            {total} karyawan · {total - incomplete} profil lengkap · {incomplete} belum lengkap · berlaku
            untuk payroll berikutnya
          </p>
        </div>
        <ButtonLink variant="secondary" compact href="/payroll/aturan">
          Aturan global
          <Image src="/icons/settings.svg" alt="" width={20} height={20} unoptimized />
        </ButtonLink>
      </header>

      <div className={shared.tableWrap}>
        <div className={shared.tableScroll}>
          <table className={`${shared.table} ${styles.table}`}>
            <thead>
              <tr>
                <th scope="col">Karyawan</th>
                <th scope="col">Gaji pokok</th>
                <th scope="col">Tunjangan</th>
                <th scope="col">BPJS (Kes/TK)</th>
                <th scope="col">Potongan</th>
                <th scope="col">Diperbarui</th>
                <th scope="col" className={shared.colActions}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => {
                const c = profile.components;
                return (
                  <tr key={profile.id}>
                    <td>
                      <div className={shared.person}>
                        <Avatar initials={profile.initials} size="M" />
                        <div className={shared.personText}>
                          <span className={shared.personName}>{profile.name}</span>
                          {profile.adjusted && <span className={styles.adjusted}>Disesuaikan HRD</span>}
                        </div>
                      </div>
                    </td>
                    <td>{formatMoneyPlain(profile.base)}</td>
                    <td>{formatMoneyPlain(profile.transport)}</td>
                    <td className={c ? undefined : styles.missing}>
                      {c ? `${c.bpjsHealthPercent}% / ${c.bpjsEmploymentPercent}%` : '—'}
                    </td>
                    <td className={c ? undefined : styles.missing}>{c ? 'Terlambat · Alpha' : '—'}</td>
                    <td className={c ? styles.strong : styles.missingText}>
                      {c ? profile.updatedAt : 'Belum lengkap'}
                    </td>
                    <td className={shared.colActions}>
                      <ButtonLink
                        variant="ghost"
                        compact
                        href={`/payroll/komponen/${profile.id}`}
                        aria-label={`${c ? 'Atur' : 'Lengkapi'} komponen gaji ${profile.name}`}
                      >
                        {c ? 'Atur' : 'Lengkapi'}
                      </ButtonLink>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <LockNote />
    </main>
  );
}
