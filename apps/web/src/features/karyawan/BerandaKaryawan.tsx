import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { TaskCard } from '@/components/ui/TaskCard';
import { ClockInCard, type ClockInPreview } from './clock-in/ClockInCard';
import { sampleClockIn, sampleClockOutTime } from './clock-in/data';
import { TodayHeading } from './clock-in/TodayHeading';
import { NotificationBell } from './notifikasi/NotificationBell';
import styles from './BerandaKaryawan.module.css';
import { sampleBeranda as data, sampleEmployee as employee } from './sampleData';

/**
 * KW08 · Beranda Karyawan, dengan clock-in web KW11–KW13. Tautan menuju halaman fitur
 * berikutnya, jadi tanpa prefetch.
 */
export function BerandaKaryawan({
  preview,
  notificationsOpen = false,
}: {
  preview?: ClockInPreview;
  /** KW25: popover notifikasi terbuka sejak awal (`?state=notifikasi`). */
  notificationsOpen?: boolean;
}) {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <TodayHeading
          name={employee.greetingName}
          previewTime={
            preview === 'clock-out' || preview === 'clock-out-berhasil' || preview === 'pulang-cepat'
              ? sampleClockOutTime
              : preview && sampleClockIn.time
          }
        />
        <NotificationBell defaultOpen={notificationsOpen} />
      </header>

      <div className={styles.rowTop}>
        <ClockInCard preview={preview} />

        <div className={styles.summary}>
          {data.stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>

      <div className={styles.rowBottom}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Task hari ini</h2>
            <Link href="/karyawan/task" prefetch={false} className={styles.panelLink}>
              Lihat semua
            </Link>
          </div>
          {data.tasks.map((task) => (
            <TaskCard key={task.title} assignee={employee.initials} {...task} />
          ))}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Izin &amp; cuti</h2>
            <ButtonLink compact href="/karyawan/izin/ajukan" prefetch={false}>
              Ajukan izin
              <Image src="/icons/plus-inverse.svg" alt="" width={20} height={20} unoptimized />
            </ButtonLink>
          </div>
          {data.leaves.map((leave) => (
            <div key={leave.title} className={styles.leave}>
              <div className={styles.rowText}>
                <p className={styles.rowTitle}>{leave.title}</p>
                <p className={styles.rowDetail}>{leave.detail}</p>
              </div>
              <Badge tone={leave.tone}>{leave.status}</Badge>
            </div>
          ))}
          <div className={styles.slip}>
            <Image src="/icons/wallet.svg" alt="" width={20} height={20} unoptimized />
            <div className={styles.rowText}>
              <p className={styles.rowTitle}>{data.slip.title}</p>
              <p className={styles.rowDetail}>{data.slip.detail}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
