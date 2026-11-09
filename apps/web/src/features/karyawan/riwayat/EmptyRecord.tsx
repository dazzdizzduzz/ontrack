import Image from 'next/image';
import styles from './riwayat.module.css';

/** Periode tanpa catatan absensi: KW28 (web karyawan) dan W96 (web admin). */
export function EmptyRecord({ message }: { message: string }) {
  return (
    <section className={styles.empty} aria-live="polite">
      <span className={styles.emptyIcon}>
        <Image src="/icons/nav-calendar.svg" alt="" width={20} height={20} unoptimized />
      </span>
      <h2 className={styles.emptyTitle}>Belum ada catatan absensi</h2>
      <p className={styles.emptyBody}>{message}</p>
    </section>
  );
}
