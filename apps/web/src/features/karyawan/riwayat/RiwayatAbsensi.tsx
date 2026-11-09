'use client';

import {
  CALENDAR_WEEKDAYS,
  calendarWeeks,
  formatDayShort,
  formatDayTable,
  formatDuration,
  formatPeriod,
  isWeekend,
  sampleAttendance,
  sampleDefaultPeriod,
  sampleEmptyPeriod,
  samplePeriods,
  summarize,
  workedMinutes,
  type DayStatus,
} from '@on-track/core';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { SelectField } from '@/components/ui/Field';
import { EmptyRecord } from './EmptyRecord';
import { statusBadge, statusLabels } from './status';
import styles from './riwayat.module.css';

const legend: DayStatus[] = ['hadir', 'terlambat', 'izin', 'alpha'];
const periodLabels = samplePeriods.map(formatPeriod);

/**
 * KW16 · Riwayat Absensi (Web): data absensi pribadi per bulan, hanya bisa dilihat. KW28: periode
 * tanpa catatan (`preview="kosong"` membuka Juni 2026).
 * MOCK: riwayat contoh Juli–Oktober 2026 dari `@on-track/core` sampai API riwayat ada.
 */
export function RiwayatAbsensi({ preview }: { preview?: 'kosong' }) {
  const [label, setLabel] = useState(
    formatPeriod(preview === 'kosong' ? sampleEmptyPeriod : sampleDefaultPeriod),
  );
  const period = samplePeriods[periodLabels.indexOf(label)] ?? sampleDefaultPeriod;
  const days = sampleAttendance(period);
  const byDate = new Map(days.map((day) => [day.date, day]));
  const summary = summarize(days);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Riwayat Absensi</h1>
        <p className={styles.subtitle}>Data absensi pribadi per bulan · hanya bisa dilihat</p>
      </header>

      {days.length === 0 ? (
        <>
          <div className={styles.periodOnly}>
            <SelectField
              label="Periode"
              options={periodLabels}
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          </div>
          <EmptyRecord message={`Tidak ada clock-in di ${label}. Pilih periode lain di atas.`} />
        </>
      ) : (
        <div className={styles.columns}>
          <section className={styles.card} aria-label="Kalender absensi">
            <SelectField
              label="Periode"
              options={periodLabels}
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />

            <dl className={styles.stats}>
              {legend.map((status) => (
                <div key={status} className={styles.stat}>
                  <dt className={styles.statLabel}>{statusLabels[status]}</dt>
                  <dd className={styles.statValue}>{summary[status]}</dd>
                </div>
              ))}
            </dl>

            <div className={styles.calendar}>
              <table className={styles.calendarGrid}>
                <thead>
                  <tr>
                    {CALENDAR_WEEKDAYS.map((name) => (
                      <th key={name} scope="col">
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {calendarWeeks(period).map((week, index) => (
                    <tr key={index}>
                      {week.map((date, cell) => {
                        if (!date) return <td key={`kosong-${cell}`} />;
                        const record = byDate.get(date);
                        const weekend = isWeekend(date);
                        return (
                          <td key={date}>
                            <span
                              className={`${styles.day} ${weekend ? styles.dayOff : ''}`}
                              aria-label={`${formatDayShort(date)}${
                                record
                                  ? `, ${statusLabels[record.status]}`
                                  : weekend
                                    ? ', libur'
                                    : ''
                              }`}
                            >
                              {Number(date.slice(8))}
                              <span
                                className={`${styles.dot} ${record ? styles[record.status] : ''}`}
                                aria-hidden="true"
                              />
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className={styles.legend} aria-label="Keterangan warna">
                {legend.map((status) => (
                  <li key={status}>
                    <span className={`${styles.legendDot} ${styles[status]}`} aria-hidden="true" />
                    {statusLabels[status]}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className={styles.card} aria-labelledby="detail-harian">
            <h2 id="detail-harian" className={styles.cardTitle}>
              Detail harian · {formatPeriod(period)}
            </h2>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Tanggal</th>
                    <th scope="col">Masuk</th>
                    <th scope="col">Pulang</th>
                    <th scope="col">Jam kerja</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => {
                    const worked = workedMinutes(day);
                    const badge = statusBadge(day);
                    return (
                      <tr key={day.date}>
                        <td>{formatDayTable(day.date)}</td>
                        <td>{day.clockIn ?? '—'}</td>
                        <td>{day.clockOut ?? '—'}</td>
                        <td>{worked !== null ? formatDuration(worked) : '—'}</td>
                        <td title={statusBadge(day, true).label}>
                          <Badge tone={badge.tone}>{badge.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                  {days.length === 0 && (
                    <tr>
                      <td colSpan={5} className={styles.empty}>
                        Belum ada catatan absensi di periode ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className={styles.footnote}>
              Menampilkan {days.length} dari {days.length} hari kerja
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
