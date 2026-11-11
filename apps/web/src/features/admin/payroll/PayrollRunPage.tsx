'use client';

import {
  SALARY_PROFILES_NOT_LISTED,
  formatMoneyPlain,
  formatRupiahShort,
  samplePayrollAdjustments,
  samplePayrollReadiness,
  sampleReturnNote,
  type PayrollLine,
} from '@on-track/core';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { Button, ButtonLink } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { Toast } from '@/components/ui/Toast';
import shared from '../employees/employees.module.css';
import { AdjustDialog } from './AdjustDialog';
import { CEO_NAME, HRD_NAME, sampleAudit, usePayroll, type PayrollRun } from './PayrollProvider';
import { PayrollStepper } from './PayrollStepper';
import styles from './payroll-run.module.css';
import { ApproveDialog, ReturnDialog, SubmitDialog } from './RunDialogs';
import { AuditDrawer, LineDrawer } from './RunDrawers';

/**
 * Pratinjau `?state=`: `menghitung` (W60), `draft` (W07), `audit` (W62), `adjust` (W13),
 * `adjust-kosong` (W61), `ajukan` (W63), `diajukan` (W14), `rincian` (W100), `setujui` (W64),
 * `kembalikan` (W66), `disetujui` (W65), `dikembalikan` (W103). Tanpa state = W59.
 */
export type PayrollRunPreview =
  | 'menghitung'
  | 'draft'
  | 'audit'
  | 'adjust'
  | 'adjust-kosong'
  | 'ajukan'
  | 'diajukan'
  | 'rincian'
  | 'setujui'
  | 'kembalikan'
  | 'disetujui'
  | 'dikembalikan';

type Overlay =
  | { kind: 'generating' }
  | { kind: 'audit' }
  | { kind: 'adjust'; employeeId: string; sample?: 'filled' | 'empty' }
  | { kind: 'line'; employeeId: string }
  | { kind: 'submit' }
  | { kind: 'approve'; checked?: boolean }
  | { kind: 'return'; note?: string }
  | null;

const generatingSteps = [
  'Ambil rekap kehadiran & lembur disetujui',
  'Hitung gaji pokok, tunjangan, potongan',
  'Hitung BPJS & PPh 21 (TER)',
  'Simpan sebagai Draft',
];

const draftAudit = [
  { id: 'a-adj', title: 'Adjustment lembur · Made Nandana P.', detail: `Rp 346.821 → 450.000 · ${HRD_NAME} · 01/11 10:24`, at: '01/11 10:24' },
  { id: 'a-gen', title: 'Payroll digenerate', detail: '16 karyawan · Rp 118,4 jt · 01/11 09:30', at: '01/11 09:30' },
  ...sampleAudit,
];

function previewRun(state?: PayrollRunPreview): Partial<PayrollRun> | null {
  if (!state || state === 'menghitung') return null;
  const draft: Partial<PayrollRun> = {
    status: 'draft',
    adjustments: samplePayrollAdjustments,
    audit: draftAudit,
    generatedAt: '01/11/2026',
  };
  if (state === 'dikembalikan') {
    return { ...draft, returnNote: { note: sampleReturnNote, by: CEO_NAME, at: '01/11 13:40' } };
  }
  if (['diajukan', 'rincian', 'setujui', 'kembalikan'].includes(state)) {
    return { ...draft, status: 'diajukan', submittedAt: '01/11/2026 13:05' };
  }
  if (state === 'disetujui') {
    return { ...draft, status: 'disetujui', submittedAt: '01/11/2026 13:05', approvedAt: '01/11/2026 14:20' };
  }
  return draft;
}

function initialOverlay(state?: PayrollRunPreview): Overlay {
  switch (state) {
    case 'menghitung':
      return { kind: 'generating' };
    case 'audit':
      return { kind: 'audit' };
    case 'adjust':
      return { kind: 'adjust', employeeId: 'made', sample: 'filled' };
    case 'adjust-kosong':
      return { kind: 'adjust', employeeId: 'made', sample: 'empty' };
    case 'ajukan':
      return { kind: 'submit' };
    case 'rincian':
      return { kind: 'line', employeeId: 'daze' };
    case 'setujui':
      return { kind: 'approve', checked: true };
    case 'kembalikan':
      return { kind: 'return', note: 'Bonus proyek Dhais belum ada dasar persetujuan, mohon lampirkan memo.' };
    default:
      return null;
  }
}

/**
 * Payroll periode Oktober 2026: W59 cek kesiapan + generate, W60 menghitung, W07 Draft dengan
 * penyesuaian (W13/W61) dan audit log (W62), W63 ajukan, W14 persetujuan CEO dengan rincian (W100),
 * W64 setujui & kunci, W66 kembalikan, W65 terkunci, W103 dikembalikan CEO (FR-23–FR-25, US-10).
 */
export function PayrollRunPage({ preview }: { preview?: PayrollRunPreview }) {
  const { profiles, rules, run, lines, totals, generate, submit, approve, returnToHrd, preview: applyPreview } =
    usePayroll();
  const [overlay, setOverlay] = useState<Overlay>(() => initialOverlay(preview));
  const [progress, setProgress] = useState(preview === 'menghitung' ? 2 : 0);
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);
  const applied = useRef(false);

  // Pratinjau: terapkan status contoh sekali ke data bersama.
  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    const patch = previewRun(preview);
    if (patch) applyPreview(patch);
  }, [applyPreview, preview]);

  // W60: animasi langkah hitung, lalu simpan sebagai Draft.
  useEffect(() => {
    if (overlay?.kind !== 'generating' || preview === 'menghitung') return;
    const timer = setTimeout(() => {
      if (progress + 1 < generatingSteps.length) {
        setProgress(progress + 1);
        return;
      }
      generate();
      setOverlay(null);
      setToast({ title: 'Payroll Oktober dibuat sebagai Draft', body: 'Dihitung otomatis dan tercatat di audit log.' });
    }, 600);
    return () => clearTimeout(timer);
  }, [generate, overlay, preview, progress]);

  const { status } = run;
  const incomplete = profiles.filter((profile) => !profile.components).length;
  const totalProfiles = profiles.length + SALARY_PROFILES_NOT_LISTED;
  const lineOf = (id: string) => lines.find((line) => line.employeeId === id);

  function startGenerate() {
    setProgress(0);
    setOverlay({ kind: 'generating' });
  }

  const subtitle = {
    belum: `Periode 01–31/10/2026 · ${totalProfiles} karyawan · belum digenerate`,
    draft: `Periode 01–31/10/2026 · ${totals.employees} karyawan · dibuat HRD ${run.generatedAt ?? ''}`,
    diajukan: `Diajukan HRD ${run.submittedAt ?? ''} · menunggu persetujuan ${CEO_NAME} (CEO)`,
    disetujui: `Disetujui ${CEO_NAME} (CEO) · ${run.approvedAt ?? ''} · terkunci`,
  }[status];

  const footnote = {
    belum: 'Item kuning tidak menghalangi generate, tetapi nilainya bisa berubah setelah dilengkapi. Payroll bisa digenerate ulang selama masih Draft.',
    draft: 'Menu payroll hanya dapat diakses HRD dan CEO/Owner. Semua penyesuaian tercatat di audit log.',
    diajukan: `Setelah disetujui, payroll terkunci dan slip gaji terbit otomatis ke ${totals.employees} karyawan (US-10 AC-3). Kembalikan ke HRD bila ada koreksi.`,
    disetujui: 'Payroll terkunci dan tidak dapat diubah. Koreksi dilakukan lewat penyesuaian di payroll periode berikutnya.',
  }[status];

  const auditButton = (
    <Button variant="ghost" compact onClick={() => setOverlay({ kind: 'audit' })}>
      Audit log
      <Image src="/icons/history.svg" alt="" width={20} height={20} unoptimized />
    </Button>
  );
  const componentsLink = (
    <ButtonLink variant="ghost" compact href="/payroll/komponen">
      Komponen gaji
      <Image src="/icons/settings.svg" alt="" width={20} height={20} unoptimized />
    </ButtonLink>
  );

  const readiness = [
    { ok: true, title: 'Rekap kehadiran', detail: `${samplePayrollReadiness.attendance.complete} dari ${samplePayrollReadiness.attendance.total} karyawan lengkap s.d. ${samplePayrollReadiness.attendance.until}` },
    { ok: true, title: 'Izin & cuti', detail: `${samplePayrollReadiness.leaveSynced} pengajuan disetujui sudah tersinkron` },
    {
      ok: incomplete === 0,
      title: 'Komponen gaji',
      detail: `${totalProfiles - incomplete} dari ${totalProfiles} profil lengkap${incomplete ? ` · ${incomplete} belum lengkap` : ''}`,
      action: { label: 'Lengkapi', href: '/payroll/komponen' },
    },
    {
      ok: samplePayrollReadiness.overtimePending === 0,
      title: 'Lembur',
      detail: `${samplePayrollReadiness.overtimePending} pengajuan masih menunggu persetujuan`,
      action: { label: 'Tinjau', href: '/kehadiran/lembur' },
    },
    { ok: true, title: 'Aturan PPh 21 & BPJS', detail: `TER · BPJS Kes ${rules.bpjsHealthPercent}% · JHT ${rules.bpjsEmploymentPercent}%` },
  ];

  function rowAction(line: PayrollLine) {
    if (status === 'draft') {
      return (
        <Button variant="ghost" compact aria-label={`Sesuaikan payroll ${line.name}`} onClick={() => setOverlay({ kind: 'adjust', employeeId: line.employeeId })}>
          Adjust
        </Button>
      );
    }
    if (status === 'diajukan') {
      return (
        <Button variant="ghost" compact aria-label={`Lihat rincian gaji ${line.name}`} onClick={() => setOverlay({ kind: 'line', employeeId: line.employeeId })}>
          Lihat rincian
        </Button>
      );
    }
    // Rincian W100 untuk HRD/CEO; slip PDF hanya dapat dibuka pemiliknya (W67).
    return (
      <Button variant="ghost" compact aria-label={`Lihat slip gaji ${line.name}`} onClick={() => setOverlay({ kind: 'line', employeeId: line.employeeId })}>
        Lihat slip
      </Button>
    );
  }

  const adjustingLine = overlay?.kind === 'adjust' ? lineOf(overlay.employeeId) : undefined;
  const detailLine = overlay?.kind === 'line' ? lineOf(overlay.employeeId) : undefined;

  return (
    <main className={shared.main}>
      <header className={shared.header}>
        <div className={shared.titleBlock}>
          <h1 className={shared.title}>Payroll Oktober 2026</h1>
          <p className={shared.subtitle}>{subtitle}</p>
        </div>
        <div className={styles.actions}>
          {status === 'belum' && (
            <>
              {componentsLink}
              <Button compact onClick={startGenerate}>
                Generate payroll
                <Image src="/icons/refresh-inverse.svg" alt="" width={20} height={20} unoptimized />
              </Button>
            </>
          )}
          {status === 'draft' && (
            <>
              {componentsLink}
              {auditButton}
              {/* MOCK: ekspor Excel (P2) belum ada di kontrak. */}
              <Button variant="secondary" compact>
                Ekspor Excel
                <Image src="/icons/download.svg" alt="" width={20} height={20} unoptimized />
              </Button>
              <Button compact onClick={() => setOverlay({ kind: 'submit' })}>
                Ajukan ke CEO
                <Image src="/icons/arrow-right-inverse.svg" alt="" width={20} height={20} unoptimized />
              </Button>
            </>
          )}
          {status === 'diajukan' && (
            <>
              {auditButton}
              <Button variant="secondary" compact onClick={() => setOverlay({ kind: 'return' })}>
                Kembalikan ke HRD
              </Button>
              <Button variant="accent" compact onClick={() => setOverlay({ kind: 'approve' })}>
                Setujui &amp; kunci payroll
                <Image src="/icons/lock-ink.svg" alt="" width={20} height={20} unoptimized />
              </Button>
            </>
          )}
          {status === 'disetujui' && (
            <>
              {auditButton}
              <Button variant="secondary" compact>
                Ekspor Excel (P2)
                <Image src="/icons/download.svg" alt="" width={20} height={20} unoptimized />
              </Button>
              <ButtonLink compact href="/payroll/slip">
                Lihat slip gaji
                <Image src="/icons/wallet-inverse.svg" alt="" width={20} height={20} unoptimized />
              </ButtonLink>
            </>
          )}
        </div>
      </header>

      {toast && (
        <Toast tone="success" title={toast.title} onDismiss={() => setToast(null)}>
          {toast.body}
        </Toast>
      )}

      {status === 'draft' && run.returnNote && (
        <Alert tone="warning" title={`Dikembalikan oleh CEO · ${run.returnNote.by}, ${run.returnNote.at}`}>
          &quot;{run.returnNote.note}&quot; Perbaiki lalu ajukan lagi.
        </Alert>
      )}

      <PayrollStepper status={status} />

      {status === 'disetujui' && (
        <Alert tone="success" title={`Payroll Oktober terkunci · ${totals.employees} slip terbit`}>
          Karyawan sudah dinotifikasi dan dapat mengunduh slip gaji PDF. Perubahan berikutnya hanya lewat payroll periode baru.
        </Alert>
      )}

      {status === 'belum' ? (
        <section className={styles.readiness} aria-label="Cek kesiapan data">
          <h2 className={styles.readinessTitle}>Cek kesiapan data sebelum generate</h2>
          <p className={styles.readinessLead}>
            Payroll dihitung dari rekap kehadiran, lembur yang disetujui, izin/cuti, dan komponen gaji.
          </p>
          <ul className={styles.checks}>
            {readiness.map((item) => (
              <li key={item.title} className={styles.check}>
                <span className={item.ok ? styles.checkOk : styles.checkWarn}>
                  <Image
                    src={item.ok ? '/icons/check-ink.svg' : '/icons/alert-warning.svg'}
                    alt={item.ok ? 'Siap' : 'Perlu dicek'}
                    width={16}
                    height={16}
                    unoptimized
                  />
                </span>
                <span className={styles.checkText}>
                  <span className={styles.checkTitle}>{item.title}</span>
                  <span className={styles.checkDetail}>{item.detail}</span>
                </span>
                {!item.ok && item.action && (
                  <ButtonLink variant="secondary" compact href={item.action.href}>
                    {item.action.label}
                  </ButtonLink>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <div className={styles.kpis}>
            <StatCard label="Total gaji bersih" value={formatRupiahShort(totals.net)} meta={`${totals.employees} karyawan`} />
            <StatCard label="Total potongan" value={formatRupiahShort(totals.deductions)} meta="BPJS · PPh 21 · keterlambatan" />
            <StatCard label="Lembur disetujui" value={`${totals.overtimeHours} jam`} meta={formatRupiahShort(totals.overtimePay)} />
            <StatCard label="Penyesuaian manual" value={String(totals.adjustments)} meta="tercatat di audit log" />
          </div>

          <div className={shared.tableWrap}>
            <div className={shared.tableScroll}>
              <table className={`${shared.table} ${styles.table}`}>
                <thead>
                  <tr>
                    <th scope="col">Karyawan</th>
                    <th scope="col">Gaji pokok</th>
                    <th scope="col">Tunj. + bonus</th>
                    <th scope="col">Lembur</th>
                    <th scope="col">Potongan</th>
                    <th scope="col">Gaji bersih</th>
                    <th scope="col" className={shared.colActions}>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.employeeId}>
                      <td>
                        <div className={shared.person}>
                          <Avatar initials={line.initials} size="M" />
                          <div className={shared.personText}>
                            <span className={shared.personName}>{line.name}</span>
                            {line.adjusted && <span className={styles.adjusted}>Disesuaikan HRD</span>}
                          </div>
                        </div>
                      </td>
                      <td>{formatMoneyPlain(line.base)}</td>
                      <td>{formatMoneyPlain(line.allowance)}</td>
                      <td>{formatMoneyPlain(line.overtime)}</td>
                      <td className={styles.minus}>– {formatMoneyPlain(line.deductions)}</td>
                      <td className={styles.strong}>{formatMoneyPlain(line.net)}</td>
                      <td className={shared.colActions}>{rowAction(line)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <p className={styles.lockNote}>
        <Image src="/icons/lock-16.svg" alt="" width={16} height={16} unoptimized />
        {footnote}
      </p>

      {overlay?.kind === 'generating' && (
        <div className={styles.progressBackdrop} role="dialog" aria-modal="true" aria-labelledby="menghitung-judul">
          <div className={styles.progressCard}>
            <h2 id="menghitung-judul" className={styles.progressTitle}>
              Menghitung payroll Oktober…
            </h2>
            <p className={styles.progressMeta} aria-live="polite">
              {Math.min(16, Math.round((progress / generatingSteps.length) * 16))} dari 16 karyawan
            </p>
            <div className={styles.progressTrack}>
              <span className={styles.progressFill} style={{ width: `${(progress / generatingSteps.length) * 100}%` }} />
            </div>
            <ul className={styles.progressSteps}>
              {generatingSteps.map((step, index) => (
                <li key={step} className={index < progress ? styles.stepDone : index === progress ? styles.stepNow : styles.stepTodo}>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {overlay?.kind === 'audit' && <AuditDrawer entries={run.audit} onClose={() => setOverlay(null)} />}

      {adjustingLine && overlay?.kind === 'adjust' && (
        <AdjustDialog
          line={adjustingLine}
          initial={
            overlay.sample
              ? {
                  component: 'overtime',
                  value: '450.000',
                  reason: overlay.sample === 'filled' ? samplePayrollAdjustments[0]!.reason : '',
                  touched: overlay.sample === 'empty',
                }
              : undefined
          }
          onClose={() => setOverlay(null)}
        />
      )}

      {detailLine && (
        <LineDrawer
          line={detailLine}
          adjustments={run.adjustments}
          fromProfile={profiles.find((profile) => profile.id === detailLine.employeeId)?.adjusted ?? false}
          onClose={() => setOverlay(null)}
        />
      )}

      {overlay?.kind === 'submit' && (
        <SubmitDialog
          totals={totals}
          onClose={() => setOverlay(null)}
          onConfirm={() => {
            // MOCK: nanti POST /payroll/runs/{period}/submit (draf F11).
            submit();
            setOverlay(null);
            setToast({ title: 'Payroll diajukan ke CEO', body: `${CEO_NAME} sudah dinotifikasi. Nilai terkunci selama menunggu.` });
          }}
        />
      )}

      {overlay?.kind === 'approve' && (
        <ApproveDialog
          totals={totals}
          submittedAt={run.submittedAt}
          initialChecked={overlay.checked}
          onClose={() => setOverlay(null)}
          onConfirm={() => {
            // MOCK: nanti POST /payroll/runs/{period}/approve (draf F11); slip terbit di F12.
            approve();
            setOverlay(null);
          }}
        />
      )}

      {overlay?.kind === 'return' && (
        <ReturnDialog
          initialNote={overlay.note}
          onClose={() => setOverlay(null)}
          onConfirm={(note) => {
            // MOCK: nanti POST /payroll/runs/{period}/return (draf F11).
            returnToHrd(note);
            setOverlay(null);
          }}
        />
      )}
    </main>
  );
}
