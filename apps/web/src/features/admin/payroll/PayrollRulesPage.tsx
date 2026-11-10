'use client';

import {
  formatSalaryInput,
  parseSalaryInput,
  ptkpOptions,
  sampleEffectivePeriod,
  type PayrollRules,
} from '@on-track/core';
import Image from 'next/image';
import { useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/Field';
import { Toast } from '@/components/ui/Toast';
import { Toggle } from '@/components/ui/Toggle';
import shared from '../employees/employees.module.css';
import { LockNote } from './LockNote';
import { usePayroll } from './PayrollProvider';
import styles from './payroll.module.css';

const overtimeOptions = ['1/173 × gaji pokok'];
const absentOptions = ['1/22 × gaji pokok', '1/21 × gaji pokok', '1/25 × gaji pokok', '1/30 × gaji pokok'];
const minuteOptions = ['15 menit', '30 menit', '45 menit', '60 menit'];
const methodOptions = ['TER (PMK 168/2023)'];

const divisorOf = (label: string) => Number(label.split('/')[1]?.split(' ')[0] ?? 0);

/**
 * W58 · Aturan komponen global: lembur, potongan kehadiran, BPJS, dan PPh 21. Berlaku untuk karyawan
 * tanpa penyesuaian khusus, mulai payroll periode berikutnya.
 */
export function PayrollRulesPage() {
  const { rules, saveRules } = usePayroll();
  const [draft, setDraft] = useState<PayrollRules>(rules);
  const [texts, setTexts] = useState({
    lateDeduction: formatSalaryInput(rules.lateDeduction, 'money'),
    bpjsHealthPercent: `${rules.bpjsHealthPercent}%`,
    bpjsEmploymentPercent: `${rules.bpjsEmploymentPercent}%`,
  });
  const [toast, setToast] = useState(false);

  const late = parseSalaryInput(texts.lateDeduction, 'money');
  const health = parseSalaryInput(texts.bpjsHealthPercent.replace('%', ''), 'percent');
  const employment = parseSalaryInput(texts.bpjsEmploymentPercent.replace('%', ''), 'percent');
  const valid = 'value' in late && 'value' in health && 'value' in employment;

  function update(patch: Partial<PayrollRules>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function save() {
    if (!('value' in late && 'value' in health && 'value' in employment)) return;
    // MOCK: nanti PUT /payroll/rules (draf F10).
    saveRules({
      ...draft,
      lateDeduction: late.value,
      bpjsHealthPercent: health.value,
      bpjsEmploymentPercent: employment.value,
    });
    setToast(true);
  }

  return (
    <main className={shared.main}>
      <ButtonLink variant="ghost" compact href="/payroll/komponen" className={shared.back}>
        Kembali ke komponen gaji
      </ButtonLink>

      <header className={shared.header}>
        <div className={shared.titleBlock}>
          <h1 className={shared.title}>Aturan Komponen Global</h1>
          <p className={shared.subtitle}>
            Berlaku untuk seluruh karyawan Studio Tigapagi kecuali diatur khusus di profil
          </p>
        </div>
        <Button compact disabled={!valid} onClick={save}>
          Simpan aturan
          <Image src="/icons/check-inverse-20.svg" alt="" width={20} height={20} unoptimized />
        </Button>
      </header>

      {toast && (
        <Toast tone="success" title="Aturan global tersimpan" onDismiss={() => setToast(false)}>
          Berlaku mulai payroll {sampleEffectivePeriod.next} untuk karyawan tanpa penyesuaian khusus.
        </Toast>
      )}

      <div className={styles.rules}>
        <section className={styles.card} aria-label="Lembur">
          <h2 className={styles.cardTitle}>Lembur</h2>
          <div className={styles.fields}>
            <SelectField
              label="Tarif per jam"
              helper="Sesuai PP 35/2021"
              options={overtimeOptions}
              value={`1/${draft.overtimeDivisor} × gaji pokok`}
              onChange={(event) => update({ overtimeDivisor: divisorOf(event.target.value) })}
            />
            <SelectField
              label="Mulai dihitung"
              helper="setelah jam pulang"
              options={minuteOptions}
              value={`${draft.overtimeAfterMinutes} menit`}
              onChange={(event) => update({ overtimeAfterMinutes: event.target.value.split(' ')[0] ?? '30' })}
            />
          </div>
          <Toggle
            label="Lembur wajib disetujui atasan"
            checked={draft.overtimeRequiresApproval}
            onChange={(event) => update({ overtimeRequiresApproval: event.target.checked })}
          />
        </section>

        <section className={styles.card} aria-label="Potongan kehadiran">
          <h2 className={styles.cardTitle}>Potongan kehadiran</h2>
          <div className={styles.fields}>
            <TextField
              label="Terlambat (Rp/kali)"
              helper="setelah toleransi"
              error={'error' in late ? late.error : undefined}
              inputMode="numeric"
              value={texts.lateDeduction}
              onChange={(event) => setTexts((t) => ({ ...t, lateDeduction: event.target.value }))}
              onBlur={() => 'value' in late && setTexts((t) => ({ ...t, lateDeduction: formatSalaryInput(late.value, 'money') }))}
            />
            <SelectField
              label="Alpha (Rp/hari)"
              helper="per hari kerja"
              options={absentOptions}
              value={`1/${draft.absentDivisor} × gaji pokok`}
              onChange={(event) => update({ absentDivisor: divisorOf(event.target.value) })}
            />
          </div>
        </section>

        <section className={styles.card} aria-label="BPJS">
          <h2 className={styles.cardTitle}>BPJS</h2>
          <div className={styles.fields}>
            <TextField
              label="Kesehatan (karyawan)"
              helper="dari gaji pokok + tunjangan tetap"
              error={'error' in health ? health.error : undefined}
              inputMode="decimal"
              value={texts.bpjsHealthPercent}
              onChange={(event) => setTexts((t) => ({ ...t, bpjsHealthPercent: event.target.value }))}
            />
            <TextField
              label="Ketenagakerjaan JHT"
              helper="ditanggung karyawan"
              error={'error' in employment ? employment.error : undefined}
              inputMode="decimal"
              value={texts.bpjsEmploymentPercent}
              onChange={(event) => setTexts((t) => ({ ...t, bpjsEmploymentPercent: event.target.value }))}
            />
          </div>
        </section>

        <section className={styles.card} aria-label="PPh 21">
          <h2 className={styles.cardTitle}>PPh 21</h2>
          <div className={styles.fields}>
            <SelectField label="Metode" helper="dapat dikonfigurasi" options={methodOptions} value={methodOptions[0]} onChange={() => undefined} />
            <SelectField
              label="Status PTKP default"
              helper="diubah per karyawan"
              options={ptkpOptions}
              value={draft.defaultPtkp}
              onChange={(event) => update({ defaultPtkp: event.target.value })}
            />
          </div>
          <Toggle
            label="Hitung PPh 21 otomatis"
            checked={draft.autoPph21}
            onChange={(event) => update({ autoPph21: event.target.checked })}
          />
        </section>
      </div>

      <LockNote />
    </main>
  );
}
