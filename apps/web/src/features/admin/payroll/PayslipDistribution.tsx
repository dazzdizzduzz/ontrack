'use client';

import {
  deliveryStatus,
  deliveryStatusLabels,
  deliverySummary,
  formatMoneyPlain,
  samplePayrollAdjustments,
  samplePayslipDeliveries,
  samplePayslipIssuedAt,
} from '@on-track/core';
import Image from 'next/image';
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button, ButtonLink } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { Toast } from '@/components/ui/Toast';
import shared from '../employees/employees.module.css';
import { computeLines, usePayroll } from './PayrollProvider';
import styles from './payslip-admin.module.css';

/**
 * W67 · Slip gaji terbit (HRD & CEO). Hanya status kirim/buka/unduh; isi slip tidak tampil di sini.
 * MOCK: status dari `samplePayslipDeliveries`; nanti GET /payroll/runs/{period}/payslips (draf F12).
 */
export function PayslipDistribution() {
  const { run, lines, profiles, rules } = usePayroll();
  // Dibuka langsung tanpa melalui W65: pakai payroll contoh yang sudah disetujui.
  const approvedLines = run.status === 'disetujui' ? lines : computeLines(profiles, rules, samplePayrollAdjustments);
  const [resent, setResent] = useState<string | null>(null);
  const summary = deliverySummary(samplePayslipDeliveries);

  return (
    <main className={shared.main}>
      <ButtonLink variant="ghost" compact href="/payroll" className={shared.back}>
        Kembali ke Payroll Oktober
      </ButtonLink>

      <header className={shared.header}>
        <div className={shared.titleBlock}>
          <h1 className={shared.title}>Slip Gaji · Oktober 2026</h1>
          <p className={shared.subtitle}>
            {summary.issued} slip terbit {samplePayslipIssuedAt} · dikirim lewat aplikasi &amp; email
          </p>
        </div>
        <ButtonLink variant="secondary" compact href="/payroll/akses">
          Log akses payroll
          <Image src="/icons/shield-ink.svg" alt="" width={20} height={20} unoptimized />
        </ButtonLink>
      </header>

      {resent && (
        <Toast tone="success" title="Pengingat dikirim ulang" onDismiss={() => setResent(null)}>
          {resent} menerima notifikasi slip Oktober lewat aplikasi dan email.
        </Toast>
      )}

      <div className={styles.kpis}>
        <StatCard label="Slip terbit" value={String(summary.issued)} meta="semua karyawan" />
        <StatCard label="Sudah dibuka" value={String(summary.opened)} meta={`${summary.openedPercent}%`} />
        <StatCard label="Sudah diunduh" value={String(summary.downloaded)} meta="PDF" />
        <StatCard label="Belum dibuka" value={String(summary.unopened)} meta="pengingat otomatis H+3" />
      </div>

      <div className={shared.tableWrap}>
        <div className={shared.tableScroll}>
          <table className={`${shared.table} ${styles.table}`}>
            <thead>
              <tr>
                <th scope="col">Karyawan</th>
                <th scope="col">Gaji bersih</th>
                <th scope="col">Dikirim</th>
                <th scope="col">Dibuka</th>
                <th scope="col">Diunduh</th>
                <th scope="col" className={styles.colWide}>
                  Status
                </th>
                <th scope="col" className={shared.colActions}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {samplePayslipDeliveries.map((delivery) => {
                const line = approvedLines.find((item) => item.employeeId === delivery.employeeId);
                if (!line) return null;
                const status = deliveryStatus(delivery);
                return (
                  <tr key={delivery.employeeId}>
                    <td>
                      <div className={shared.person}>
                        <Avatar initials={line.initials} size="M" />
                        <div className={shared.personText}>
                          <span className={shared.personName}>{line.name}</span>
                          <span className={styles.role}>{line.division}</span>
                        </div>
                      </div>
                    </td>
                    <td>{formatMoneyPlain(line.net)}</td>
                    <td>{delivery.sentAt}</td>
                    <td className={delivery.openedAt ? undefined : styles.danger}>
                      {delivery.openedAt ?? deliveryStatusLabels.unopened}
                    </td>
                    <td>{delivery.downloadedAt ?? '—'}</td>
                    <td className={styles.strong}>{deliveryStatusLabels[status]}</td>
                    <td className={shared.colActions}>
                      {status === 'unopened' && (
                        <Button
                          variant="ghost"
                          compact
                          aria-label={`Kirim ulang slip ke ${line.name}`}
                          onClick={() => setResent(line.name)}
                        >
                          Kirim ulang
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className={styles.lockNote}>
        <Image src="/icons/lock-16.svg" alt="" width={16} height={16} unoptimized />
        Slip hanya dapat dibuka pemiliknya. HRD &amp; CEO melihat status pengiriman, bukan isi slip dari akun
        karyawan.
      </p>
    </main>
  );
}
