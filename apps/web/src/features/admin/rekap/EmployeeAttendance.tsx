'use client';

import {
  formatDayTable,
  formatDuration,
  formatPeriod,
  formatShortDuration,
  sampleAttendance,
  sampleDefaultPeriod,
  sampleEmptyPeriod,
  samplePeriods,
  summarize,
  workedMinutes,
} from '@on-track/core';
import Image from 'next/image';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/Field';
import { StatCard } from '@/components/ui/StatCard';
import { Toast } from '@/components/ui/Toast';
import { EmptyRecord } from '@/features/karyawan/riwayat/EmptyRecord';
import { lateMinutes, statusBadge } from '@/features/karyawan/riwayat/status';
import shared from '../employees/employees.module.css';
import { rekapProfiles, rekapRows } from './data';
import { ExportDialog, PreviewDialog, type ExportOptions } from './ExportDialogs';
import { exportFile } from './exportFile';
import styles from './rekap.module.css';
import { usePdfExport } from './usePdfExport';

const PAGE_SIZE = 6;
const periodLabels = samplePeriods.map(formatPeriod);
const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

/**
 * W37 · Detail Absensi Karyawan. MOCK: riwayat harian contoh hanya ada untuk Dhais Alfa Rysy
 * (sama dengan M15 dan KW16); karyawan lain menampilkan keterangan data belum tersedia.
 */
export function EmployeeAttendance({ id, preview }: { id: string; preview?: 'kosong' }) {
  const row = rekapRows.find((item) => item.id === id);
  const profile = rekapProfiles[id];
  const [label, setLabel] = useState(
    formatPeriod(preview === 'kosong' ? sampleEmptyPeriod : sampleDefaultPeriod),
  );
  const [page, setPage] = useState(0);
  const pdf = usePdfExport();
  const [exported, setExported] = useState<ExportOptions | null>(null);

  const period = samplePeriods[periodLabels.indexOf(label)] ?? sampleDefaultPeriod;
  const days = profile ? sampleAttendance(period) : [];
  const summary = summarize(days);
  const pages = Math.max(1, Math.ceil(days.length / PAGE_SIZE));
  const shown = days.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const late = days.reduce((sum, day) => sum + lateMinutes(day), 0);
  const worked = days.reduce((sum, day) => sum + (workedMinutes(day) ?? 0), 0);
  const overtime = days.reduce((sum, day) => sum + day.overtimeMinutes, 0);
  const exportPeriod = {
    label,
    range: `01–${new Date(Date.UTC(period.year, period.month, 0)).getUTCDate()}/${String(period.month).padStart(2, '0')}/${period.year}`,
    short: `${MONTHS_SHORT[period.month - 1]}${period.year}`,
  };

  const file = exported && exportFile(exportPeriod, exported, 1, `Kehadiran ${row?.name ?? ''}`);

  function choosePeriod(next: string) {
    setLabel(next);
    setPage(0);
  }

  return (
    <main className={shared.main}>
      <ButtonLink variant="ghost" compact href="/kehadiran" className={shared.back}>
        Kembali ke rekap
      </ButtonLink>

      <header className={shared.header}>
        <div className={shared.titleBlock}>
          <h1 className={shared.title}>{row?.name ?? 'Karyawan tidak ditemukan'}</h1>
          {row && (
            <p className={shared.subtitle}>
              {[row.division, profile?.schedule, profile?.office, profile && label]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
        {profile && (
          <Button variant="secondary" compact onClick={pdf.open}>
            Ekspor PDF
            <Image src="/icons/download.svg" alt="" width={20} height={20} unoptimized />
          </Button>
        )}
      </header>

      {pdf.ready && file && (
        <Toast tone="success" title="PDF siap diunduh" onDismiss={pdf.dismiss}>
          {file.fileName} · {file.summary}
        </Toast>
      )}

      {!profile ? (
        <p className={shared.subtitle}>
          Riwayat harian contoh baru tersedia untuk Dhais Alfa Rysy. Data karyawan lain muncul
          setelah API riwayat absensi tersambung.
        </p>
      ) : (
        <>
          <div className={styles.periodField}>
            <SelectField
              label="Periode"
              options={periodLabels}
              value={label}
              onChange={(event) => choosePeriod(event.target.value)}
            />
          </div>

          {days.length === 0 ? (
            <EmptyRecord
              message={`${row?.name ?? 'Karyawan ini'} tidak punya catatan di ${label}.`}
            />
          ) : (
            <>
              <div className={styles.stats}>
                <StatCard
                  label="Hadir"
                  value={String(summary.hadir)}
                  meta={`dari ${days.length} hari kerja`}
                />
                <StatCard
                  label="Terlambat"
                  value={String(summary.terlambat)}
                  meta={late > 0 ? `total ${formatShortDuration(late)}` : 'tidak ada'}
                />
                <StatCard
                  label="Izin / Cuti / Sakit"
                  value={String(summary.izin)}
                  meta={summary.izin > 0 ? `${summary.izin} izin` : 'tidak ada'}
                />
                <StatCard
                  label="Total jam kerja"
                  value={`${Math.floor(worked / 60)} j`}
                  meta={`lembur ${Math.floor(overtime / 60)} j disetujui`}
                />
              </div>

              <div className={shared.tableWrap}>
                <div className={shared.tableScroll}>
                  <table className={`${shared.table} ${styles.table}`}>
                    <thead>
                      <tr>
                        <th scope="col">Tanggal</th>
                        <th scope="col" className={styles.colDivision}>
                          Masuk
                        </th>
                        <th scope="col" className={styles.colNumber}>
                          Pulang
                        </th>
                        <th scope="col" className={styles.colNumber}>
                          Jam kerja
                        </th>
                        <th scope="col" className={styles.colShort}>
                          Lembur
                        </th>
                        <th scope="col" className={styles.colShort}>
                          Selfie
                        </th>
                        <th scope="col" className={styles.colHours}>
                          Lokasi
                        </th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((day) => {
                        const minutes = workedMinutes(day);
                        const badge = statusBadge(day);
                        const attended = day.clockIn !== undefined;
                        return (
                          <tr key={day.date}>
                            <td className={styles.strong}>{formatDayTable(day.date)}</td>
                            <td>{day.clockIn ?? '—'}</td>
                            <td>{day.clockOut ?? '—'}</td>
                            <td>{minutes !== null ? formatDuration(minutes) : '—'}</td>
                            <td>
                              {day.overtimeMinutes > 0
                                ? formatShortDuration(day.overtimeMinutes)
                                : '—'}
                            </td>
                            {/* MOCK: foto selfie disimpan server; "Ada" bila clock-in tercatat. */}
                            <td>{attended ? 'Ada' : '—'}</td>
                            <td>{attended ? profile.office : '—'}</td>
                            <td title={statusBadge(day, true).label}>
                              <Badge tone={badge.tone}>{badge.label}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                      {days.length === 0 && (
                        <tr>
                          <td colSpan={8} className={shared.empty}>
                            Belum ada catatan absensi di periode ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className={shared.pagination}>
                  <p className={shared.paginationText}>
                    Menampilkan {shown.length} dari {days.length} hari kerja
                  </p>
                  <div className={shared.paginationNav}>
                    <Button
                      variant="secondary"
                      compact
                      disabled={page === 0}
                      onClick={() => setPage((current) => current - 1)}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="secondary"
                      compact
                      disabled={page >= pages - 1}
                      onClick={() => setPage((current) => current + 1)}
                    >
                      Berikutnya
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {pdf.step === 'ekspor' && (
        <ExportDialog
          periods={periodLabels}
          divisions={[]}
          defaultPeriod={label}
          onClose={pdf.close}
          onExport={(options) => {
            setExported(options);
            pdf.preview();
          }}
        />
      )}
      {(pdf.step === 'pratinjau' || pdf.step === 'membuat') && file && (
        <PreviewDialog
          {...file}
          subheading={`${row?.name ?? ''} · periode ${exportPeriod.range}`}
          generating={pdf.step === 'membuat'}
          onClose={pdf.close}
          onDownload={pdf.download}
        />
      )}
    </main>
  );
}
