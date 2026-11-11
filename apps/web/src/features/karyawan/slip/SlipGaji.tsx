'use client';

import { latestPaidPayslip, payslipStatusLabels, samplePayslips, formatRupiah, type Payslip } from '@on-track/core';
import Image from 'next/image';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Toast } from '@/components/ui/Toast';
import { ItemTable, NetCard, PayslipPaper, PrivacyNote } from './PayslipParts';
import styles from './slip.module.css';

export type SlipPreview = 'pdf' | 'belum' | 'agustus' | 'juli';

/** Periode yang dibuka pratinjau `?state=` (KW32 Agustus, KW33 Juli). */
const previewPeriods: Partial<Record<SlipPreview, string>> = { belum: '2026-10', agustus: '2026-08', juli: '2026-07' };

/** KW24 · Pratinjau slip PDF sebelum diunduh. */
function PdfDialog({ slip, onClose, onDownload }: { slip: Payslip; onClose: () => void; onDownload: () => void }) {
  return (
    <Dialog
      title={slip.fileName ?? 'Slip gaji'}
      description={`1 halaman · ${slip.fileSizeKb} KB · dilindungi kata sandi tanggal lahir`}
      showClose
      size="xl"
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
          <Button type="submit" compact>
            Unduh PDF
            <Image src="/icons/download-inverse.svg" alt="" width={20} height={20} unoptimized />
          </Button>
        </>
      }
    >
      <div className={styles.paperWrap}>
        <PayslipPaper slip={slip} />
      </div>
    </Dialog>
  );
}

/**
 * KW23 · Slip gaji milik sendiri (FR-26, US-11 AC-2). Pratinjau lewat `?state=`: `pdf` (KW24) dan
 * `belum` (Oktober belum terbit, padanan web M48), `agustus` (KW32), dan `juli` (KW33). MOCK: data dari `samplePayslips`; nanti
 * /me/payslips (draf F12).
 */
export function SlipGaji({ preview }: { preview?: SlipPreview }) {
  const slips = samplePayslips;
  const latest = latestPaidPayslip(slips);
  const [period, setPeriod] = useState((preview && previewPeriods[preview]) ?? latest?.period);
  const [pdfOpen, setPdfOpen] = useState(preview === 'pdf');
  const [toast, setToast] = useState<string | null>(null);
  const slip = slips.find((item) => item.period === period) ?? latest;
  if (!slip) return null;
  const issued = slip.status === 'dibayar';

  function download() {
    // MOCK: PDF berkata sandi dibuat server (GET /me/payslips/{period}/pdf); belum ada berkas sungguhan.
    setPdfOpen(false);
    setToast(slip?.fileName ?? null);
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Slip Gaji</h1>
          <p className={styles.subtitle}>Hanya slip milikmu yang tampil · dapat diunduh sebagai PDF</p>
        </div>
        <Button compact disabled={!issued} onClick={() => setPdfOpen(true)}>
          Unduh PDF
          <Image src="/icons/download-inverse.svg" alt="" width={20} height={20} unoptimized />
        </Button>
      </header>

      {toast && (
        <Toast tone="success" title="Slip diunduh" onDismiss={() => setToast(null)}>
          {toast} tersimpan. Buka dengan tanggal lahirmu (DDMMYYYY) sebagai kata sandi.
        </Toast>
      )}

      <div className={styles.columns}>
        <nav className={`${styles.card} ${styles.listCard}`} aria-label="Periode slip gaji">
          <ul className={styles.periods}>
            {slips.map((item) => (
              <li key={item.period}>
                <button
                  type="button"
                  className={styles.period}
                  aria-current={item.period === slip.period}
                  onClick={() => setPeriod(item.period)}
                >
                  <span className={styles.periodText}>
                    <span className={styles.periodName}>{item.label}</span>
                    <span className={styles.periodMeta}>
                      {item.net ? formatRupiah(item.net) : 'Belum terbit'}
                    </span>
                  </span>
                  {item.status === 'dibayar' ? (
                    <Badge tone="success">{payslipStatusLabels.dibayar}</Badge>
                  ) : (
                    <Badge tone="neutral">{payslipStatusLabels.proses}</Badge>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <section className={styles.card} aria-label={`Slip ${slip.label}`}>
          {issued ? (
            <>
              <NetCard slip={slip} />
              <div className={styles.tables}>
                <ItemTable slip={slip} kind="earning" />
                <ItemTable slip={slip} kind="deduction" />
              </div>
            </>
          ) : (
            <div className={styles.pending}>
              <span className={styles.pendingIcon}>
                <Image src="/icons/clock.svg" alt="" width={24} height={24} unoptimized />
              </span>
              <h2 className={styles.pendingTitle}>Slip {slip.month} belum terbit</h2>
              <p className={styles.pendingText}>
                Slip terbit setelah payroll disetujui CEO. Kamu akan menerima notifikasi.
              </p>
              {latest && (
                <Button variant="secondary" compact onClick={() => setPeriod(latest.period)}>
                  Lihat slip {latest.month}
                  <Image src="/icons/arrow-right.svg" alt="" width={20} height={20} unoptimized />
                </Button>
              )}
            </div>
          )}
          <PrivacyNote />
        </section>
      </div>

      {pdfOpen && issued && <PdfDialog slip={slip} onClose={() => setPdfOpen(false)} onDownload={download} />}
    </main>
  );
}
