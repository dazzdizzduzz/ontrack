'use client';

import {
  PAYROLL_NOTE_MAX,
  adjustableComponents,
  automaticAmount,
  componentsFromRules,
  formatMoneyPlain,
  parseSalaryInput,
  samplePayrollPeriods,
  samplePreviewPeriod,
  type AdjustableComponent,
  type PayrollLine,
} from '@on-track/core';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { SelectField, TextareaField, TextField } from '@/components/ui/Field';
import { usePayroll } from './PayrollProvider';
import styles from './payroll-run.module.css';

const cents = (value: string) => Math.round(Number(value) * 100);

/**
 * W13 · Penyesuaian manual dan W61 · alasan wajib (FR-24, US-10 AC-2). Nilai sebelum diambil dari
 * hitungan otomatis; setelah disimpan tercatat di audit log.
 */
export function AdjustDialog({
  line,
  initial,
  onClose,
}: {
  line: PayrollLine;
  initial?: { component: AdjustableComponent; value: string; reason: string; touched?: boolean };
  onClose: () => void;
}) {
  const { profiles, rules, run, adjust } = usePayroll();
  const profile = profiles.find((item) => item.id === line.employeeId);
  const components = profile ? (profile.components ?? componentsFromRules(profile, rules)) : null;
  const period = samplePayrollPeriods[line.employeeId] ?? samplePreviewPeriod;
  const [component, setComponent] = useState<AdjustableComponent>(initial?.component ?? 'overtime');
  const [value, setValue] = useState(initial?.value ?? '');
  const [reason, setReason] = useState(initial?.reason ?? '');
  const [touched, setTouched] = useState(initial?.touched ?? false);

  const info = adjustableComponents.find((item) => item.key === component)!;
  const previous = run.adjustments.filter((item) => item.employeeId === line.employeeId && item.component === component).at(-1);
  const before = previous?.after ?? (components ? automaticAmount(component, components, period) : '0.00');
  const parsed = parseSalaryInput(value, 'money');
  const reasonMissing = reason.trim().length === 0;
  const diff = 'value' in parsed ? cents(parsed.value) - cents(before) : 0;
  const invalid = !('value' in parsed) || reasonMissing || diff === 0;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (invalid || !('value' in parsed)) return;
    // MOCK: nanti POST /payroll/runs/{period}/adjustments (draf F11).
    adjust({ employeeId: line.employeeId, component, before, after: parsed.value, reason: reason.trim() }, line.name);
    onClose();
  }

  return (
    <Dialog
      title="Penyesuaian manual"
      description={`${line.name} · Payroll Oktober 2026 (Draft)`}
      size="xl"
      showClose
      onClose={onClose}
      onSubmit={handleSubmit}
      actions={
        <>
          <Button variant="secondary" compact onClick={onClose}>
            Batal
          </Button>
          <Button compact type="submit" disabled={invalid}>
            Simpan penyesuaian
          </Button>
        </>
      }
    >
      <SelectField
        label="Komponen"
        options={adjustableComponents.map((item) => item.label)}
        value={info.label}
        onChange={(event) => {
          setComponent(adjustableComponents.find((item) => item.label === event.target.value)?.key ?? 'overtime');
          setValue('');
        }}
      />
      <div className={styles.formRow}>
        <TextField label="Nilai sebelum" helper={previous ? 'Dari penyesuaian sebelumnya' : info.source} value={`Rp ${formatMoneyPlain(before)}`} readOnly />
        <TextField
          label="Nilai baru"
          inputMode="numeric"
          placeholder="Rp 0"
          error={value && 'error' in parsed ? parsed.error : undefined}
          helper={
            diff
              ? `${diff > 0 ? '+' : '–'} Rp ${formatMoneyPlain(String(Math.abs(diff) / 100))}`
              : ' '
          }
          value={value}
          onChange={(event) => setValue(event.target.value.replace(/^Rp\s?/, ''))}
          onBlur={() => 'value' in parsed && setValue(formatMoneyPlain(parsed.value))}
          autoFocus
        />
      </div>
      <TextareaField
        label="Alasan penyesuaian *"
        helper="Wajib · tersimpan di audit log"
        error={touched && reasonMissing ? 'Alasan wajib diisi, tercatat di audit log' : undefined}
        maxLength={PAYROLL_NOTE_MAX}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        onBlur={() => setTouched(true)}
        required
      />
      <Alert tone="info" title="Tercatat di audit log">
        Perubahan menyimpan nilai lama, nilai baru, alasan, dan nama HRD (US-10 AC-2).
      </Alert>
    </Dialog>
  );
}
