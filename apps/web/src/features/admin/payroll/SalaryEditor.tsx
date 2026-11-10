'use client';

import {
  SALARY_REASON_MAX,
  componentsFromRules,
  differsFromFormula,
  formatChangeValue,
  formatMoneyPlain,
  formulaValue,
  formatRupiah,
  formatSalaryInput,
  formatStamp,
  mergeSalaryInput,
  parseSalaryInput,
  salaryChanges,
  salaryFields,
  salaryPreview,
  sampleEffectivePeriod,
  sampleInvalidInputs,
  samplePreviewPeriod,
  sampleSalaryEdit,
  type SalaryComponents,
  type SalaryField,
  type SalaryLog,
} from '@on-track/core';
import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { TextareaField, TextField } from '@/components/ui/Field';
import { Toast } from '@/components/ui/Toast';
import { Toggle } from '@/components/ui/Toggle';
import shared from '../employees/employees.module.css';
import { usePayroll } from './PayrollProvider';
import styles from './payroll.module.css';

/** `?state=`: `validasi` (W55), `konfirmasi` (W57), `tersimpan` (W56). */
export type SalaryPreviewState = 'validasi' | 'konfirmasi' | 'tersimpan';

/** MOCK: pengguna yang login (W18) dan inisial namanya di log ("Oleh Ananda S."). */
const EDITOR = 'Ananda S.';

const toTexts = (components: SalaryComponents) =>
  Object.fromEntries(salaryFields.map((field) => [field.key, formatSalaryInput(components[field.key], field.kind)])) as Record<
    SalaryField,
    string
  >;

function logTitle(changes: ReturnType<typeof salaryChanges>): string {
  const [first, ...rest] = changes;
  if (!first) return 'Profil gaji dilengkapi';
  const info = salaryFields.find((field) => field.key === first.field);
  const value = formatChangeValue(first, true);
  return `${info?.logName ?? first.field} ${value.from} → ${value.to}${rest.length ? ` (+${rest.length} lainnya)` : ''}`;
}

const now = () => formatStamp(new Date(), 'Asia/Makassar').replace(' · ', ' ');

/**
 * W12 · Komponen gaji karyawan dengan pratinjau gaji bersih dan log, W55 · validasi (negatif /
 * bukan angka ditolak, US-09 AC-2), W57 · konfirmasi + alasan, W56 · tersimpan (US-09 AC-1).
 */
export function SalaryEditor({ id, preview }: { id: string; preview?: SalaryPreviewState }) {
  const { profiles, rules, saveProfile } = usePayroll();
  const profile = profiles.find((item) => item.id === id);
  const initial = profile ? (profile.components ?? componentsFromRules(profile, rules)) : null;

  // W56: hasil simpan contoh tanpa mengubah data bersama.
  const [savedPreview] = useState(() => {
    if (preview !== 'tersimpan' || !initial || !profile) return null;
    const next = { ...initial, transportAllowance: '750000.00' };
    const log: SalaryLog = {
      id: 'l-q4',
      title: logTitle(salaryChanges(initial, next)),
      by: EDITOR,
      at: '01/10/2026 10:12',
      reason: 'Kebijakan Q4',
    };
    return { components: next, logs: [log, ...profile.logs] };
  });

  const [saved, setSaved] = useState<SalaryComponents | null>(savedPreview?.components ?? initial);
  const [texts, setTexts] = useState<Record<SalaryField, string>>(() => {
    const base = toTexts(savedPreview?.components ?? initial ?? componentsFromRules({ base: '0.00', transport: '0.00' }, rules));
    if (preview === 'validasi') return { ...base, ...sampleInvalidInputs };
    if (preview === 'konfirmasi') return { ...base, [sampleSalaryEdit.field]: sampleSalaryEdit.value };
    return base;
  });
  const [autoPph21, setAutoPph21] = useState(initial?.autoPph21 ?? true);
  const [touched, setTouched] = useState<Partial<Record<SalaryField, boolean>>>(() =>
    preview === 'validasi' ? { baseSalary: true, transportAllowance: true } : {},
  );
  const [confirming, setConfirming] = useState(preview === 'konfirmasi');
  const [reason, setReason] = useState(preview === 'konfirmasi' ? sampleSalaryEdit.reason : '');
  const [toast, setToast] = useState(preview === 'tersimpan');

  if (!profile || !saved) {
    return (
      <main className={shared.main}>
        <ButtonLink variant="ghost" compact href="/payroll/komponen" className={shared.back}>
          Kembali ke daftar komponen gaji
        </ButtonLink>
        <p className={shared.subtitle}>Profil gaji tidak ditemukan.</p>
      </main>
    );
  }

  const parsed = Object.fromEntries(
    salaryFields.map((field) => [field.key, parseSalaryInput(texts[field.key], field.kind)]),
  ) as Record<SalaryField, ReturnType<typeof parseSalaryInput>>;
  const errors = salaryFields.filter((field) => 'error' in parsed[field.key]);
  const shownErrors = errors.filter((field) => touched[field.key]);
  const draft: SalaryComponents | null =
    errors.length === 0
      ? mergeSalaryInput(
          saved,
          Object.fromEntries(
            salaryFields.map((field) => [field.key, (parsed[field.key] as { value: string }).value]),
          ) as Record<SalaryField, string>,
          autoPph21,
        )
      : null;
  const changes = draft ? salaryChanges(saved, draft) : [];
  const dirty = changes.length > 0 || (draft !== null && draft.autoPph21 !== saved.autoPph21) || !profile.components;
  const before = salaryPreview(saved, samplePreviewPeriod);
  const after = draft ? salaryPreview(draft, samplePreviewPeriod) : null;
  const logs = savedPreview && saved === savedPreview.components ? savedPreview.logs : profile.logs;

  function update(field: SalaryField, value: string) {
    setTexts((current) => ({ ...current, [field]: value }));
  }

  function blur(field: SalaryField) {
    setTouched((current) => ({ ...current, [field]: true }));
    const result = parsed[field];
    const info = salaryFields.find((item) => item.key === field);
    if ('value' in result && info) update(field, formatSalaryInput(result.value, info.kind));
  }

  function handleConfirm(event: FormEvent) {
    event.preventDefault();
    if (!draft || !profile) return;
    const log: SalaryLog = {
      id: `l-${profile.logs.length + 1}`,
      title: logTitle(changes),
      by: EDITOR,
      at: now(),
      reason: reason.trim() || undefined,
    };
    // MOCK: nanti PUT /payroll/salary-profiles/{id} (draf F10); server menulis log.
    saveProfile(
      {
        ...profile,
        components: draft,
        base: draft.baseSalary,
        transport: draft.transportAllowance,
        updatedAt: log.at.split(' ')[0],
      },
      log,
    );
    setSaved(draft);
    setConfirming(false);
    setReason('');
    setToast(true);
  }

  const groups = [
    { key: 'pendapatan', title: 'Pendapatan' },
    { key: 'potongan', title: 'Potongan' },
  ] as const;

  return (
    <main className={shared.main}>
      <ButtonLink variant="ghost" compact href="/payroll/komponen" className={shared.back}>
        Kembali ke daftar komponen gaji
      </ButtonLink>

      <header className={shared.header}>
        <div className={shared.titleBlock}>
          <h1 className={shared.title}>Komponen Gaji · {profile.name}</h1>
          <p className={shared.subtitle}>
            {profile.position} · {profile.division} · berlaku mulai {sampleEffectivePeriod.current}
          </p>
        </div>
        <Button compact disabled={!draft || !dirty} onClick={() => setConfirming(true)}>
          Simpan perubahan
        </Button>
      </header>

      {toast && (
        <Toast tone="success" title="Komponen gaji tersimpan" onDismiss={() => setToast(false)}>
          Tercatat di log perubahan · berlaku mulai payroll {sampleEffectivePeriod.next}.
        </Toast>
      )}

      <div className={styles.layout}>
        <section className={styles.card} aria-label="Komponen gaji">
          {shownErrors.length > 0 && (
            <Alert tone="danger" title={`${shownErrors.length} nilai tidak valid`}>
              Komponen gaji harus berupa angka positif. Perubahan belum disimpan.
            </Alert>
          )}
          {!profile.components && (
            <Alert tone="info" title="Profil belum lengkap">
              Nilai di bawah diisi dari aturan global. Periksa lalu simpan untuk melengkapi profil.
            </Alert>
          )}
          {groups.map((group) => (
            <div key={group.key} className={styles.group}>
              <h2 className={styles.cardTitle}>{group.title}</h2>
              <div className={styles.fields}>
                {salaryFields
                  .filter((field) => field.group === group.key)
                  .map((field) => {
                    const result = parsed[field.key];
                    // Revisi Figma: kolom bernilai khusus HRD menyebut nilai rumus globalnya.
                    const base = 'value' in parsed.baseSalary ? parsed.baseSalary.value : saved.baseSalary;
                    const formula = formulaValue(field.key, base, rules);
                    const custom = formula && 'value' in result && differsFromFormula(result.value, formula);
                    return (
                      <TextField
                        key={field.key}
                        label={field.label}
                        helper={custom ? `Nilai khusus HRD · rumus global Rp ${formatMoneyPlain(formula)}` : field.helper}
                        error={touched[field.key] && 'error' in result ? result.error : undefined}
                        inputMode={field.kind === 'percent' ? 'decimal' : 'numeric'}
                        value={texts[field.key]}
                        onChange={(event) => update(field.key, event.target.value)}
                        onBlur={() => blur(field.key)}
                      />
                    );
                  })}
              </div>
            </div>
          ))}
          <Toggle
            label="Hitung PPh 21 otomatis (TER, dapat dikonfigurasi HRD)"
            checked={autoPph21}
            onChange={(event) => setAutoPph21(event.target.checked)}
          />
        </section>

        <aside className={styles.side}>
          <section className={styles.card} aria-label="Pratinjau gaji bersih">
            <h2 className={styles.cardTitle}>Pratinjau gaji bersih</h2>
            <dl className={styles.previewList}>
              <div className={styles.previewRow}>
                <dt>Pendapatan</dt>
                <dd>{after ? formatRupiah(after.gross) : '—'}</dd>
              </div>
              <div className={styles.previewRow}>
                <dt>Potongan</dt>
                <dd className={styles.deduction}>{after ? `– ${formatRupiah(after.deductions)}` : '—'}</dd>
              </div>
            </dl>
            <div className={styles.net}>
              <span>Gaji bersih</span>
              <span className={styles.netValue}>{after ? formatRupiah(after.net) : '—'}</span>
            </div>
            <p className={styles.previewNote}>
              Estimasi {sampleEffectivePeriod.current}: {samplePreviewPeriod.overtimeHours} jam lembur,{' '}
              {samplePreviewPeriod.lateCount} kali terlambat, PPh 21 dari server.
            </p>
          </section>

          <section className={`${styles.card} ${styles.logCard}`} aria-label="Log perubahan">
            <h2 className={styles.cardTitle}>Log perubahan</h2>
            {logs.length === 0 && <p className={styles.previewNote}>Belum ada perubahan.</p>}
            <ol className={styles.log}>
              {logs.map((log, index) => (
                <li key={log.id} className={styles.logItem}>
                  <span className={styles.rail}>
                    <span className={index === 0 ? styles.dotCurrent : styles.dotDone}>
                      {index !== 0 && <Image src="/icons/check-12-inverse.svg" alt="" width={12} height={12} unoptimized />}
                    </span>
                    {index < logs.length - 1 && <span className={styles.line} />}
                  </span>
                  <span className={styles.logText}>
                    <span className={styles.logTitle}>{log.title}</span>
                    <span className={styles.logMeta}>
                      Oleh {log.by} · {log.at}
                      {log.reason ? ` · "${log.reason}"` : ''}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>

      {confirming && draft && after && (
        <Dialog
          title="Simpan perubahan komponen gaji?"
          description={`${profile.name} · perubahan dicatat di log dan berlaku mulai payroll ${sampleEffectivePeriod.next} (payroll ${sampleEffectivePeriod.current.split(' ')[0]} sudah Draft).`}
          size="md"
          onClose={() => setConfirming(false)}
          onSubmit={handleConfirm}
          actions={
            <>
              <Button variant="secondary" compact onClick={() => setConfirming(false)}>
                Batal
              </Button>
              <Button compact type="submit">
                Simpan
                <Image src="/icons/check-inverse-20.svg" alt="" width={20} height={20} unoptimized />
              </Button>
            </>
          }
        >
          <dl className={styles.diff}>
            {changes.map((change) => {
              const info = salaryFields.find((field) => field.key === change.field);
              const value = formatChangeValue(change);
              return (
                <div key={change.field} className={styles.diffRow}>
                  <dt>{info?.logName}</dt>
                  <dd>
                    <s>{value.from}</s>
                    <Image src="/icons/arrow-right.svg" alt="menjadi" width={16} height={16} unoptimized />
                    <strong>{value.to}</strong>
                  </dd>
                </div>
              );
            })}
            <div className={styles.diffRow}>
              <dt>Gaji bersih (estimasi)</dt>
              <dd>
                <s>{formatRupiah(before.net).replace('Rp ', '')}</s>
                <Image src="/icons/arrow-right.svg" alt="menjadi" width={16} height={16} unoptimized />
                <strong>{formatRupiah(after.net)}</strong>
              </dd>
            </div>
          </dl>
          <TextareaField
            label="Alasan perubahan"
            helper="Opsional · tampil di log"
            maxLength={SALARY_REASON_MAX}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Dialog>
      )}
    </main>
  );
}
