'use client';

import { formatMoneyPlain, formatRupiah, type PayrollAdjustment, type PayrollLine } from '@on-track/core';
import Image from 'next/image';
import { Alert } from '@/components/ui/Alert';
import { Drawer } from '@/components/ui/Drawer';
import type { PayrollAudit } from './PayrollProvider';
import styles from './payroll-run.module.css';

/** W62 · Audit log payroll. Tidak dapat diubah atau dihapus (US-10 AC-2). */
export function AuditDrawer({ entries, onClose }: { entries: PayrollAudit[]; onClose: () => void }) {
  return (
    <Drawer
      title="Audit log · Payroll Oktober"
      subtitle="Tidak dapat diubah atau dihapus"
      onClose={onClose}
      onSubmit={(event) => event.preventDefault()}
    >
      <ol className={styles.timeline}>
        {entries.map((entry, index) => (
          <li key={entry.id} className={styles.timelineItem}>
            <span className={styles.rail}>
              <span className={index === 0 ? styles.dotCurrent : styles.dotDone}>
                {index !== 0 && <Image src="/icons/check-12-inverse.svg" alt="" width={12} height={12} unoptimized />}
              </span>
              {index < entries.length - 1 && <span className={styles.line} />}
            </span>
            <span className={styles.timelineText}>
              <span className={styles.timelineTitle}>{entry.title}</span>
              <span className={styles.timelineMeta}>{entry.detail}</span>
            </span>
          </li>
        ))}
      </ol>
    </Drawer>
  );
}

/** W100 · Rincian gaji satu karyawan: pendapatan, potongan, dan penyesuaian. */
export function LineDrawer({
  line,
  adjustments,
  fromProfile,
  onClose,
}: {
  line: PayrollLine;
  adjustments: PayrollAdjustment[];
  /** Profil gaji punya nilai khusus HRD dari F10 (bonus, tarif lembur). */
  fromProfile: boolean;
  onClose: () => void;
}) {
  const earnings = line.items.filter((item) => item.kind === 'earning');
  const deductions = line.items.filter((item) => item.kind === 'deduction');
  const own = adjustments.filter((item) => item.employeeId === line.employeeId);
  return (
    <Drawer
      title={`Rincian gaji · ${line.name}`}
      subtitle={`Oktober 2026 · ${line.position} · ${line.division}`}
      onClose={onClose}
      onSubmit={(event) => event.preventDefault()}
    >
      <section className={styles.block} aria-label="Pendapatan">
        <h3 className={styles.blockTitle}>Pendapatan</h3>
        <dl className={styles.card}>
          {earnings.map((item) => (
            <div key={item.key} className={styles.cardRow}>
              <dt>{item.label}</dt>
              <dd>{formatMoneyPlain(item.amount)}</dd>
            </div>
          ))}
          <div className={`${styles.cardRow} ${styles.total}`}>
            <dt>Total pendapatan</dt>
            <dd>{formatMoneyPlain(line.gross)}</dd>
          </div>
        </dl>
      </section>
      <section className={styles.block} aria-label="Potongan">
        <h3 className={styles.blockTitle}>Potongan</h3>
        <dl className={styles.card}>
          {deductions.map((item) => (
            <div key={item.key} className={styles.cardRow}>
              <dt>{item.label}</dt>
              <dd>– {formatMoneyPlain(item.amount)}</dd>
            </div>
          ))}
          <div className={`${styles.cardRow} ${styles.total}`}>
            <dt>Total potongan</dt>
            <dd className={styles.minus}>– {formatMoneyPlain(line.deductions)}</dd>
          </div>
        </dl>
      </section>
      <div className={styles.netCard}>
        <span>Gaji bersih</span>
        <strong>{formatRupiah(line.net)}</strong>
      </div>
      {own.length > 0 && (
        <Alert tone="info" title="Disesuaikan HRD">
          {own
            .map((item) => `${item.component === 'overtime' ? 'Lembur' : 'Komponen'} Rp ${formatMoneyPlain(item.before)} → Rp ${formatMoneyPlain(item.after)} oleh ${item.by} · ${item.at}: "${item.reason}"`)
            .join(' ')}{' '}
          Tercatat di audit log.
        </Alert>
      )}
      {own.length === 0 && fromProfile && (
        <Alert tone="info" title="Dari profil gaji">
          Bonus proyek dan tarif lembur khusus diambil dari Komponen Gaji. Tidak ada penyesuaian manual untuk{' '}
          {line.name.split(' ')[0]} di payroll ini.
        </Alert>
      )}
    </Drawer>
  );
}
