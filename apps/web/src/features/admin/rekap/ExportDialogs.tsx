'use client';

import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Dialog } from '@/components/ui/Dialog';
import { SelectField } from '@/components/ui/Field';
import styles from './rekap.module.css';

export type ExportOptions = {
  period: string;
  division: string;
  summary: boolean;
  daily: boolean;
  selfie: boolean;
};

type ExportDialogProps = {
  periods: string[];
  /** Kosong: tanpa pilihan divisi (ekspor satu karyawan dari W37). */
  divisions: string[];
  defaultPeriod?: string;
  defaultDivision?: string;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
};

/** W38 · Ekspor rekap ke PDF. Foto selfie tidak dicentang secara bawaan (UU PDP). */
export function ExportDialog({
  periods,
  divisions,
  defaultPeriod,
  defaultDivision,
  onClose,
  onExport,
}: ExportDialogProps) {
  const [period, setPeriod] = useState(defaultPeriod ?? periods[0] ?? '');
  const [division, setDivision] = useState(defaultDivision ?? divisions[0] ?? '');
  const [summary, setSummary] = useState(true);
  const [daily, setDaily] = useState(true);
  const [selfie, setSelfie] = useState(false);
  const nothing = !summary && !daily && !selfie;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (nothing) return;
    onExport({ period, division, summary, daily, selfie });
  }

  return (
    <Dialog
      title="Ekspor rekap ke PDF"
      showClose
      size="md"
      onClose={onClose}
      onSubmit={handleSubmit}
      actions={
        <>
          <Button variant="secondary" compact onClick={onClose}>
            Batal
          </Button>
          <Button compact type="submit" disabled={nothing}>
            Ekspor PDF
            <Image src="/icons/download-inverse.svg" alt="" width={20} height={20} unoptimized />
          </Button>
        </>
      }
    >
      <SelectField
        label="Periode"
        options={periods}
        value={period}
        onChange={(event) => setPeriod(event.target.value)}
      />
      {divisions.length > 0 && (
        <SelectField
          label="Divisi"
          options={divisions}
          value={division}
          onChange={(event) => setDivision(event.target.value)}
        />
      )}
      <fieldset className={styles.options}>
        <legend className={styles.optionsLegend}>Isi dokumen</legend>
        <Checkbox
          label="Ringkasan per karyawan (hadir, terlambat, izin, alpha, jam kerja)"
          checked={summary}
          onChange={(event) => setSummary(event.target.checked)}
        />
        <Checkbox
          label="Detail harian per karyawan"
          checked={daily}
          onChange={(event) => setDaily(event.target.checked)}
        />
        <Checkbox
          label="Foto selfie absensi"
          checked={selfie}
          onChange={(event) => setSelfie(event.target.checked)}
        />
      </fieldset>
      <p className={styles.dialogNote}>
        {nothing
          ? 'Pilih minimal satu isi dokumen.'
          : 'Foto selfie adalah data pribadi (UU PDP No. 27/2022). Sertakan hanya bila diperlukan untuk audit.'}
      </p>
    </Dialog>
  );
}

type PreviewDialogProps = {
  fileName: string;
  /** Ringkasan untuk toast W98; tidak dipakai di dialog. */
  summary?: string;
  meta: string;
  /** W97: server sedang membuat PDF; tombol unduh nonaktif. */
  generating?: boolean;
  heading: string;
  subheading: string;
  pages: number;
  onClose: () => void;
  onDownload: () => void;
};

/** W39 · Pratinjau PDF dan W97 · sedang dibuat. MOCK: halaman pertama digambar sebagai sketsa. */
export function PreviewDialog({
  fileName,
  meta,
  generating = false,
  heading,
  subheading,
  pages,
  onClose,
  onDownload,
}: PreviewDialogProps) {
  return (
    <Dialog
      title="Pratinjau PDF"
      showClose
      size="lg"
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();
        onDownload();
      }}
      actions={
        <>
          <Button variant="secondary" compact onClick={onClose}>
            Tutup
          </Button>
          <Button compact type="submit" disabled={generating}>
            {generating ? (
              'Membuat PDF…'
            ) : (
              <>
                Unduh PDF
                <Image src="/icons/download-inverse.svg" alt="" width={20} height={20} unoptimized />
              </>
            )}
          </Button>
        </>
      }
    >
      <div className={styles.file} aria-live="polite">
        <Image src="/icons/download.svg" alt="" width={20} height={20} unoptimized />
        <div className={styles.fileText}>
          <p className={styles.fileName}>{fileName}</p>
          <p className={styles.fileMeta}>
            {generating ? 'Server sedang menyiapkan PDF · biasanya kurang dari 10 detik' : meta}
          </p>
        </div>
      </div>
      <div className={styles.preview} role="img" aria-label={`Halaman 1 dari ${pages}: ${heading}`}>
        <div className={styles.page}>
          <p className={styles.pageBrand}>
            <span className={styles.pageDot} aria-hidden="true" />
            On-Track · Studio Tigapagi
          </p>
          <p className={styles.pageTitle}>{heading}</p>
          <p className={styles.pageMeta}>{subheading}</p>
          <div className={styles.pageTable} aria-hidden="true">
            {Array.from({ length: 9 }, (_, row) => (
              <div key={row} className={row === 0 ? styles.pageHead : styles.pageRow}>
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            ))}
          </div>
          <p className={styles.pageFoot}>Halaman 1 dari {pages} · dokumen rahasia internal</p>
        </div>
      </div>
    </Dialog>
  );
}
