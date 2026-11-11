import {
  formatPayslipAmount,
  formatRupiah,
  payslipStatusLabels,
  samplePayslipOwner,
  type Payslip,
} from '@on-track/core';
import Image from 'next/image';
import styles from './slip.module.css';

/** Kartu hitam "Gaji bersih diterima" (KW23). */
export function NetCard({ slip }: { slip: Payslip }) {
  return (
    <section className={styles.netCard} aria-label="Gaji bersih">
      <div className={styles.netTop}>
        <span>Gaji bersih diterima</span>
        <span className={styles.netStatus}>{payslipStatusLabels[slip.status]}</span>
      </div>
      <p className={styles.netValue}>{formatRupiah(slip.net ?? '0.00')}</p>
      <p className={styles.netMeta}>
        Ditransfer {slip.paidAt} · {slip.bankAccount}
      </p>
    </section>
  );
}

/** Tabel Pendapatan / Potongan dengan baris total. */
export function ItemTable({ slip, kind }: { slip: Payslip; kind: 'earning' | 'deduction' }) {
  const earning = kind === 'earning';
  const items = slip.items.filter((item) => item.kind === kind);
  const total = (earning ? slip.gross : slip.deductions) ?? '0.00';
  return (
    <section className={styles.table}>
      <h3 className={styles.tableTitle}>{earning ? 'Pendapatan' : 'Potongan'}</h3>
      <dl className={styles.rows}>
        {items.map((item) => (
          <div key={item.label} className={styles.row}>
            <dt>{item.label}</dt>
            <dd>{formatPayslipAmount(item)}</dd>
          </div>
        ))}
        <div className={`${styles.row} ${styles.total}`}>
          <dt>{earning ? 'Total pendapatan' : 'Total potongan'}</dt>
          <dd className={earning ? undefined : styles.minus}>
            {earning ? formatRupiah(total) : `– ${formatRupiah(total)}`}
          </dd>
        </div>
      </dl>
    </section>
  );
}

export function PrivacyNote({ children = 'Slip ini hanya dapat dilihat oleh kamu.' }: { children?: string }) {
  return (
    <p className={styles.lockNote}>
      <Image src="/icons/lock-16.svg" alt="" width={16} height={16} unoptimized />
      {children}
    </p>
  );
}

/** Isi dokumen slip PDF (KW24). Sama dengan pratinjau mobile M47. */
export function PayslipPaper({ slip }: { slip: Payslip }) {
  const owner = samplePayslipOwner;
  return (
    <article className={styles.paper} aria-label={`Pratinjau ${slip.fileName}`}>
      <span className={styles.paperBrand}>
        <span className={styles.paperDot} aria-hidden="true" />
        {owner.company} · On-Track
      </span>
      <h3 className={styles.paperTitle}>Slip gaji · {slip.label}</h3>
      <p className={styles.paperMeta}>
        {owner.name} · {owner.position} · NIK {owner.employeeNumber}
      </p>
      <dl className={styles.paperRows}>
        {slip.items.map((item) => (
          <div key={item.label} className={styles.paperRow}>
            <dt>{item.pdfLabel ?? item.label}</dt>
            <dd>{formatPayslipAmount(item, false)}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.paperNet}>
        <span>Gaji bersih</span>
        <span>{formatRupiah(slip.net ?? '0.00')}</span>
      </p>
      <p className={styles.paperFoot}>Disetujui {slip.approvedBy} · dokumen rahasia, hanya untuk penerima</p>
    </article>
  );
}
