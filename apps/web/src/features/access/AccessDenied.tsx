import { sampleIncidentCode } from '@on-track/core';
import Image from 'next/image';
import { ButtonLink } from '@/components/ui/Button';
import styles from './access-denied.module.css';

const moduleNames: Record<string, string> = { payroll: 'Payroll' };

/**
 * W08 · 403 Akses ditolak. Server mencatat percobaan dan mengirim kode insiden di ProblemDetails
 * (draf F12, `PayrollAccessLog.incident_code`); kode yang sama tampil di log W68.
 */
export function AccessDenied({ module = 'payroll', code = sampleIncidentCode }: { module?: string; code?: string }) {
  const name = moduleNames[module] ?? 'halaman ini';
  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <span className={styles.icon}>
          <Image src="/icons/lock-danger.svg" alt="" width={28} height={28} unoptimized />
        </span>
        <p className={styles.eyebrow}>403 · Akses ditolak</p>
        <h1 className={styles.title}>Kamu tidak punya akses ke {name}</h1>
        <p className={styles.text}>
          Halaman ini hanya dapat dibuka oleh HRD dan CEO/Owner. Percobaan akses ini sudah dicatat. Untuk melihat
          gaji kamu sendiri, buka Slip Gaji.
        </p>
        <div className={styles.actions}>
          <ButtonLink variant="secondary" href="/karyawan/beranda">
            Kembali ke Beranda
          </ButtonLink>
          <ButtonLink href="/karyawan/slip-gaji">
            Lihat Slip Gaji Saya
            <Image src="/icons/arrow-right-inverse.svg" alt="" width={20} height={20} unoptimized />
          </ButtonLink>
        </div>
        <p className={styles.code}>Kode insiden: {code}</p>
      </div>
    </main>
  );
}
