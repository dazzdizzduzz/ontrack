import Image from 'next/image';
import styles from './payroll.module.css';

/** Catatan akses di bawah W54 dan W58. */
export function LockNote() {
  return (
    <p className={styles.lockNote}>
      <Image src="/icons/lock-16.svg" alt="" width={16} height={16} unoptimized />
      Perubahan komponen tercatat di log dan berlaku mulai payroll periode berikutnya. Hanya HRD dan
      CEO/Owner yang dapat mengakses.
    </p>
  );
}
