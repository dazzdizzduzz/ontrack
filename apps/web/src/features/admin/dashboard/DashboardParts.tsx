'use client';

import {
  dashboardRangeLabels,
  presentPercent,
  sampleDashboardContext,
  type AttendanceKpis,
  type DashboardRange,
  type Task,
  type WeekBar,
} from '@on-track/core';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import styles from './dashboard.module.css';

/** Badge LIVE + waktu pembaruan terakhir. */
export function LiveStamp({ label }: { label: string }) {
  return (
    <span className={styles.live} aria-live="polite">
      <span className={styles.liveBadge}>Live</span>
      {label}
    </span>
  );
}

export function RangeTabs({ value, onChange }: { value: DashboardRange; onChange: (range: DashboardRange) => void }) {
  return (
    <div className={styles.tabs} role="group" aria-label="Periode ringkasan">
      {(Object.keys(dashboardRangeLabels) as DashboardRange[]).map((range) => (
        <button
          key={range}
          type="button"
          className={styles.tab}
          aria-pressed={range === value}
          onClick={() => onChange(range)}
        >
          {dashboardRangeLabels[range]}
        </button>
      ))}
    </div>
  );
}

/**
 * Ekspor PDF dashboard memakai alur ekspor rekap F05 (US-08 AC-2).
 * `href` mengarah ke dialog ekspor W38.
 */
export function ExportLink({ href = '/kehadiran?state=ekspor' }: { href?: string }) {
  return (
    <ButtonLink variant="secondary" compact href={href}>
      Ekspor PDF
      <Image src="/icons/download.svg" alt="" width={20} height={20} unoptimized />
    </ButtonLink>
  );
}

/** Empat KPI kehadiran (W69, W01, W72). Kartu "Belum absen" bisa membuka W70. */
export function AttendanceKpiRow({
  kpis,
  lateNote,
  range = 'hari',
  notCheckedInHref,
  memberLabel = 'karyawan',
}: {
  kpis: AttendanceKpis;
  lateNote?: string;
  range?: DashboardRange;
  notCheckedInHref?: string;
  memberLabel?: string;
}) {
  const today = range === 'hari';
  const notCheckedIn = (
    <StatCard
      label="Belum absen"
      value={String(kpis.notCheckedIn)}
      meta={kpis.notCheckedIn ? `batas toleransi ${sampleDashboardContext.toleranceUntil}` : 'semua sudah tercatat'}
    />
  );
  return (
    <div className={styles.kpis}>
      <StatCard
        label="Hadir"
        value={String(kpis.present)}
        meta={`dari ${kpis.total} ${memberLabel}${memberLabel === 'karyawan' ? ` · ${presentPercent(kpis)}%` : ''}`}
      />
      <StatCard
        label="Terlambat"
        value={String(kpis.late)}
        meta={lateNote ?? (kpis.late ? `rata-rata ${kpis.lateAverageMinutes} menit` : '—')}
      />
      <StatCard label="Izin / Cuti" value={String(kpis.leave)} meta={kpis.leave ? kpis.leaveNote : '—'} />
      {today && notCheckedInHref && kpis.notCheckedIn > 0 ? (
        <Link href={notCheckedInHref} className={styles.kpiLink} aria-label={`${kpis.notCheckedIn} karyawan belum absen, lihat detail`}>
          {notCheckedIn}
        </Link>
      ) : (
        notCheckedIn
      )}
    </div>
  );
}

/** Kartu Task W69/W72: aktif, overdue, selesai, dan satu task yang perlu dilihat. */
export function TaskSummaryCard({
  active,
  overdue,
  done,
  highlight,
  highlightMeta,
}: {
  active: number;
  overdue: number;
  done: number;
  highlight?: Task;
  highlightMeta?: string;
}) {
  const late = highlight && overdue > 0;
  return (
    <section className={styles.card} aria-labelledby="dash-task">
      <div className={styles.cardHead}>
        <h2 id="dash-task" className={styles.cardTitle}>
          Task
        </h2>
        <ButtonLink variant="ghost" compact href="/task">
          Buka board
          <Image src="/icons/arrow-right.svg" alt="" width={20} height={20} unoptimized />
        </ButtonLink>
      </div>
      <dl className={styles.taskStats}>
        <div className={styles.taskStat}>
          <dt>Aktif</dt>
          <dd>{active}</dd>
        </div>
        <div className={styles.taskStat}>
          <dt>Overdue</dt>
          <dd className={overdue ? styles.danger : undefined}>{overdue}</dd>
        </div>
        <div className={styles.taskStat}>
          <dt>Selesai bln ini</dt>
          <dd>{done}</dd>
        </div>
      </dl>
      {highlight && (
        <div className={`${styles.highlightTask} ${late ? styles.overdue : ''}`}>
          <span className={styles.highlightText}>
            <span className={styles.highlightTitle}>{highlight.title}</span>
            <span className={styles.cardMeta}>{highlightMeta}</span>
          </span>
          {late ? <Badge tone="danger">Overdue</Badge> : <Badge tone="inverse">Berjalan</Badge>}
        </div>
      )}
    </section>
  );
}

/** Grafik 7 hari dengan tabel tersembunyi sebagai alternatif teks. */
export function WeekChart({ bars }: { bars: WeekBar[] }) {
  const max = Math.max(...bars.map((bar) => bar.present + bar.late));
  return (
    <section className={styles.card} aria-labelledby="dash-week">
      <h2 id="dash-week" className={styles.cardTitle}>
        Kehadiran 7 hari
      </h2>
      <ol className={styles.chart} aria-hidden="true">
        {bars.map((bar, index) => (
          <li key={index} className={styles.bar}>
            <span className={styles.stack}>
              {bar.late > 0 && <span className={styles.segLate} style={{ height: `${(bar.late / max) * 100}%` }} />}
              <span
                className={`${styles.segPresent} ${bar.today ? styles.segToday : ''}`}
                style={{ height: `${(bar.present / max) * 100}%` }}
              />
            </span>
            <span className={styles.barLabel}>{bar.label}</span>
          </li>
        ))}
      </ol>
      <table className={styles.srOnly}>
        <caption>Kehadiran 7 hari terakhir</caption>
        <thead>
          <tr>
            <th scope="col">Hari</th>
            <th scope="col">Hadir</th>
            <th scope="col">Terlambat</th>
          </tr>
        </thead>
        <tbody>
          {bars.map((bar, index) => (
            <tr key={index}>
              <th scope="row">{bar.label}</th>
              <td>{bar.present}</td>
              <td>{bar.late}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className={styles.legend}>
        <li>
          <span className={`${styles.dot} ${styles.dotPresent}`} />
          Hadir
        </li>
        <li>
          <span className={`${styles.dot} ${styles.dotLate}`} />
          Terlambat
        </li>
      </ul>
    </section>
  );
}

export type AttentionItem = { key: string; icon: string; text: string; action: string; href: string };

/** Daftar "Perlu perhatian" W69/W72. */
export function AttentionCard({ items, action }: { items: AttentionItem[]; action?: ReactNode }) {
  return (
    <section className={styles.card} aria-labelledby="dash-attention">
      <div className={styles.cardHead}>
        <h2 id="dash-attention" className={styles.cardTitle}>
          Perlu perhatian
        </h2>
        {action}
      </div>
      {items.length ? (
        <ul className={styles.attention}>
          {items.map((item) => (
            <li key={item.key} className={styles.attentionItem}>
              <Image src={`/icons/${item.icon}.svg`} alt="" width={24} height={24} unoptimized />
              <span className={styles.attentionText}>{item.text}</span>
              <Link href={item.href} className={styles.attentionLink} aria-label={`${item.action}: ${item.text}`}>
                {item.action}
                <Image src="/icons/chevron-right-20.svg" alt="" width={20} height={20} unoptimized />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.cardMeta}>Tidak ada yang perlu ditindaklanjuti.</p>
      )}
    </section>
  );
}

export function LiveMapLink() {
  return (
    <ButtonLink variant="secondary" compact href="/dashboard/kehadiran">
      Lihat peta live
      <Image src="/icons/map.svg" alt="" width={20} height={20} unoptimized />
    </ButtonLink>
  );
}
