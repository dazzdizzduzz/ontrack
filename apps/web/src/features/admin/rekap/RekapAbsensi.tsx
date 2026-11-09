'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/Field';
import { StatCard } from '@/components/ui/StatCard';
import { Toast } from '@/components/ui/Toast';
import { initialsOf } from '../employees/data';
import shared from '../employees/employees.module.css';
import { sampleOvertime } from '../overtime/data';
import {
  rekapDivisions,
  rekapPeriod,
  rekapRows,
  rekapStats,
  ROWS_NOT_LISTED,
  todayBadges,
  type TodayStatus,
} from './data';
import { ExportDialog, PreviewDialog, type ExportOptions } from './ExportDialogs';
import { exportFile } from './exportFile';
import styles from './rekap.module.css';
import { usePdfExport, type ExportPreview } from './usePdfExport';

export type RekapPreview = ExportPreview;

const ALL_DIVISIONS = 'Semua divisi';
const ALL_STATUS = 'Semua status';
const statusOptions: { label: string; value: TodayStatus }[] = [
  { label: 'Hadir', value: 'hadir' },
  { label: 'Terlambat', value: 'terlambat' },
  { label: 'Sakit', value: 'sakit' },
  { label: 'WFH', value: 'wfh' },
];

const total = rekapRows.length + ROWS_NOT_LISTED;
const pendingOvertime = sampleOvertime.filter((row) => row.status === 'menunggu').length;
const exportPeriods = [rekapPeriod.label];
const exportDivisions = [`${ALL_DIVISIONS} (${total} karyawan)`, ...rekapDivisions];
const defaultOptions: ExportOptions = {
  period: exportPeriods[0] ?? '',
  division: exportDivisions[0] ?? '',
  summary: true,
  daily: true,
  selfie: false,
};

/**
 * W05 · Rekap Absensi, W38 · Ekspor PDF (dialog), W39 · Pratinjau PDF, W97 · Sedang dibuat,
 * W98 · PDF siap. MOCK: angka dan 6 baris dari Figma; 10 karyawan lain belum ada di data
 * contoh. PDF dibuat server setelah API tersedia, jadi pratinjau masih sketsa.
 */
export function RekapAbsensi({ preview }: { preview?: RekapPreview }) {
  const [division, setDivision] = useState(ALL_DIVISIONS);
  const [status, setStatus] = useState(ALL_STATUS);
  const pdf = usePdfExport(preview);
  const [exported, setExported] = useState<ExportOptions>(defaultOptions);

  const statusValue = statusOptions.find((option) => option.label === status)?.value;
  const visible = rekapRows.filter(
    (row) =>
      (division === ALL_DIVISIONS || row.division === division) &&
      (!statusValue || row.today === statusValue),
  );
  const unfiltered = division === ALL_DIVISIONS && !statusValue;
  const file = exportFile(rekapPeriod, exported, total);

  return (
    <main className={shared.main}>
      <header className={shared.header}>
        <div className={shared.titleBlock}>
          <h1 className={shared.title}>Rekap Absensi</h1>
          <p className={shared.subtitle}>
            Periode {rekapPeriod.range} · {total} karyawan · data hingga {rekapPeriod.until}
          </p>
        </div>
        <div className={styles.headerActions}>
          <ButtonLink variant="secondary" compact href="/kehadiran/lembur">
            Persetujuan lembur · {pendingOvertime}
            <Image src="/icons/clock-20.svg" alt="" width={20} height={20} unoptimized />
          </ButtonLink>
          <Button variant="secondary" compact onClick={pdf.open}>
            Ekspor PDF
            <Image src="/icons/download.svg" alt="" width={20} height={20} unoptimized />
          </Button>
        </div>
      </header>

      {pdf.ready && (
        <Toast tone="success" title="PDF siap diunduh" onDismiss={pdf.dismiss}>
          {file.fileName} · {file.summary}
        </Toast>
      )}

      <div className={styles.filters}>
        {/* MOCK: rekap contoh hanya untuk September 2026. */}
        <SelectField
          label="Periode"
          options={[rekapPeriod.label]}
          defaultValue={rekapPeriod.label}
        />
        <SelectField
          label="Divisi"
          options={[ALL_DIVISIONS, ...rekapDivisions]}
          value={division}
          onChange={(event) => setDivision(event.target.value)}
        />
        <SelectField
          label="Status"
          options={[ALL_STATUS, ...statusOptions.map((option) => option.label)]}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        />
      </div>

      <div className={styles.stats}>
        {rekapStats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} meta={stat.note} />
        ))}
      </div>

      <div className={shared.tableWrap}>
        <div className={shared.tableScroll}>
          <table className={`${shared.table} ${styles.table}`}>
            <thead>
              <tr>
                <th scope="col">Karyawan</th>
                <th scope="col" className={styles.colDivision}>
                  Divisi
                </th>
                <th scope="col" className={styles.colNumber}>
                  Hadir
                </th>
                <th scope="col" className={styles.colNumber}>
                  Terlambat
                </th>
                <th scope="col" className={styles.colNumber}>
                  Izin
                </th>
                <th scope="col" className={styles.colNumber}>
                  Alpha
                </th>
                <th scope="col" className={styles.colHours}>
                  Jam kerja
                </th>
                <th scope="col">Status hari ini</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const badge = todayBadges[row.today];
                return (
                  <tr key={row.id}>
                    <td>
                      <div className={shared.person}>
                        <Avatar initials={row.initials ?? initialsOf(row.name)} size="S" />
                        <Link href={`/kehadiran/karyawan/${row.id}`} className={shared.personName}>
                          {row.name}
                        </Link>
                      </div>
                    </td>
                    <td>{row.division}</td>
                    <td>{row.hadir}</td>
                    <td>{row.terlambat}</td>
                    <td>{row.izin}</td>
                    <td>{row.alpha}</td>
                    <td>{row.hours} j</td>
                    <td>
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={8} className={shared.empty}>
                    Tidak ada karyawan yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className={shared.pagination}>
          <p className={shared.paginationText}>
            Menampilkan {visible.length} dari {unfiltered ? total : visible.length} karyawan
          </p>
          <div className={shared.paginationNav}>
            <Button variant="secondary" compact disabled>
              Sebelumnya
            </Button>
            {/* MOCK: 10 karyawan lain tidak ada di data contoh, jadi belum ada halaman berikutnya. */}
            <Button variant="secondary" compact disabled>
              Berikutnya
            </Button>
          </div>
        </div>
      </div>

      {pdf.step === 'ekspor' && (
        <ExportDialog
          periods={exportPeriods}
          divisions={exportDivisions}
          onClose={pdf.close}
          onExport={(options) => {
            setExported(options);
            pdf.preview();
          }}
        />
      )}
      {(pdf.step === 'pratinjau' || pdf.step === 'membuat') && (
        <PreviewDialog
          {...file}
          generating={pdf.step === 'membuat'}
          onClose={pdf.close}
          onDownload={pdf.download}
        />
      )}
    </main>
  );
}
