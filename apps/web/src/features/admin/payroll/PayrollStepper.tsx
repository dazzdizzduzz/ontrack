import type { PayrollStatus } from '@on-track/core';
import styles from './payroll-run.module.css';

const steps = [
  { title: 'Draft', meta: 'Dihitung otomatis' },
  { title: 'Diajukan', meta: 'Menunggu CEO' },
  { title: 'Disetujui CEO', meta: 'Payroll terkunci' },
  { title: 'Slip terbit', meta: 'Karyawan dinotifikasi' },
];

/** Langkah aktif per status: belum = belum ada; disetujui = semua selesai (slip langsung terbit). */
const currentIndex: Record<PayrollStatus, number> = { belum: -1, draft: 0, diajukan: 1, disetujui: 4 };

/** Stepper status payroll (W59, W07, W14, W65). */
export function PayrollStepper({ status }: { status: PayrollStatus }) {
  const current = currentIndex[status];
  return (
    <ol className={styles.stepper} aria-label="Status payroll">
      {steps.map((step, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'pending';
        return (
          <li key={step.title} className={styles.step} aria-current={state === 'current' ? 'step' : undefined}>
            <span className={`${styles.stepNum} ${styles[state]}`}>{index + 1}</span>
            <span className={styles.stepText}>
              <span className={`${styles.stepTitle} ${state === 'pending' && status !== 'belum' ? styles.muted : ''}`}>
                {step.title}
              </span>
              <span className={styles.stepMeta}>{step.meta}</span>
            </span>
            {index < steps.length - 1 && <span className={styles.stepLine} aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
