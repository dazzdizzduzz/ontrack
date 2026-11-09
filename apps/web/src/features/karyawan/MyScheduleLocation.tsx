import { Alert } from '@/components/ui/Alert';
import { GeofenceMap } from '@/components/ui/GeofenceMap';
import employeeStyles from '@/features/admin/employees/employees.module.css';
import styles from '@/features/admin/schedule/schedule.module.css';
import { sampleMySchedule as sample } from './sampleData';

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.keyValue}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/** KW10 · Jadwal & Lokasi Saya */
export function MyScheduleLocation() {
  return (
    <main className={employeeStyles.main}>
      <header className={employeeStyles.header}>
        <div className={employeeStyles.titleBlock}>
          <h1 className={employeeStyles.title}>Jadwal &amp; Lokasi Saya</h1>
          <p className={employeeStyles.subtitle}>Profil · diatur oleh HRD · zona waktu WITA</p>
        </div>
      </header>

      <div className={styles.readOnlyColumns}>
        <section className={styles.readOnlyCard}>
          <h2 className={employeeStyles.cardTitle}>Jadwal kerja</h2>
          <p className={styles.hours}>{sample.hours}</p>
          <p className={styles.secondaryText}>{sample.scheduleSummary}</p>
          <ul className={styles.dayDots}>
            {sample.days.map((day) => (
              <li
                key={day.name}
                aria-label={`${day.name}: ${day.working ? 'hari kerja' : 'libur'}`}
                className={`${styles.dayDot} ${day.working ? styles.dayDotOn : ''}`}
              >
                <span aria-hidden="true">{day.name.charAt(0)}</span>
              </li>
            ))}
          </ul>
          <dl className={styles.keyValues}>
            <KeyValue label="Toleransi terlambat" value={sample.tolerance} />
            <KeyValue label="Lembur dihitung" value={sample.overtimeAfter} />
            <KeyValue label="Batas lembur harian" value={sample.overtimeLimit} />
          </dl>
        </section>

        <section className={styles.readOnlyCard}>
          <h2 className={employeeStyles.cardTitle}>Lokasi kantor</h2>
          <GeofenceMap radiusMeters={sample.radiusMeters} />
          <p className={styles.locationName}>{sample.locationName}</p>
          <p className={styles.secondaryText}>{sample.address}</p>
          <dl className={styles.keyValues}>
            <KeyValue label="Radius geofence" value={`${sample.radiusMeters} m`} />
            <KeyValue label="Wajib selfie saat clock-in" value={sample.selfieRequired ? 'Ya' : 'Tidak'} />
          </dl>
          <Alert tone="info" title="Diatur oleh HRD">
            Clock-in hanya bisa dalam radius {sample.radiusMeters} m. Hubungi HRD jika jadwal atau
            lokasi kerjamu berubah.
          </Alert>
        </section>
      </div>
    </main>
  );
}
