'use client';

import { PAYROLL_NOTE_MAX, formatRupiahShort, type PayrollTotals } from '@on-track/core';
import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Dialog } from '@/components/ui/Dialog';
import { TextareaField } from '@/components/ui/Field';
import { CEO_NAME, HRD_NAME } from './PayrollProvider';
import styles from './payroll-run.module.css';

function Summary({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className={styles.summary}>
      {rows.map((row) => (
        <div key={row.label} className={styles.summaryRow}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** W63 · Ajukan payroll ke CEO (FR-25). */
export function SubmitDialog({ totals, onClose, onConfirm }: { totals: PayrollTotals; onClose: () => void; onConfirm: () => void }) {
  return (
    <Dialog
      title="Ajukan payroll Oktober ke CEO?"
      description={`${CEO_NAME} (CEO) akan menerima notifikasi. Selama menunggu persetujuan, HRD tidak dapat mengubah nilai.`}
      size="md"
      onClose={onClose}
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        onConfirm();
      }}
      actions={
        <>
          <Button variant="secondary" compact onClick={onClose}>
            Batal
          </Button>
          <Button compact type="submit">
            Ajukan ke CEO
            <Image src="/icons/send.svg" alt="" width={20} height={20} unoptimized />
          </Button>
        </>
      }
    >
      <Summary
        rows={[
          { label: 'Total gaji bersih', value: formatRupiahShort(totals.net) },
          { label: 'Karyawan', value: `${totals.employees} orang` },
          { label: 'Penyesuaian manual', value: `${totals.adjustments} (tercatat di audit log)` },
          { label: 'Lembur disetujui', value: `${totals.overtimeHours} jam` },
        ]}
      />
    </Dialog>
  );
}

/** W64 · Setujui & kunci payroll (US-10 AC-3). Wajib mencentang konfirmasi peninjauan. */
export function ApproveDialog({
  totals,
  submittedAt,
  initialChecked = false,
  onClose,
  onConfirm,
}: {
  totals: PayrollTotals;
  submittedAt?: string;
  initialChecked?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [checked, setChecked] = useState(initialChecked);
  return (
    <Dialog
      title="Setujui & kunci payroll Oktober?"
      description={`Setelah disetujui, payroll terkunci dan slip gaji ${totals.employees} karyawan diterbitkan serta dinotifikasi.`}
      size="md"
      onClose={onClose}
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        if (checked) onConfirm();
      }}
      actions={
        <>
          <Button variant="secondary" compact onClick={onClose}>
            Batal
          </Button>
          <Button variant="accent" compact type="submit" disabled={!checked}>
            Setujui &amp; kunci
            <Image src="/icons/lock-ink.svg" alt="" width={20} height={20} unoptimized />
          </Button>
        </>
      }
    >
      <Summary
        rows={[
          { label: 'Total gaji bersih', value: formatRupiahShort(totals.net) },
          { label: 'Total potongan', value: formatRupiahShort(totals.deductions) },
          { label: 'Diajukan oleh', value: `${HRD_NAME}${submittedAt ? ` · ${submittedAt}` : ''}` },
        ]}
      />
      <Checkbox
        label="Saya sudah meninjau rincian & penyesuaian manual"
        checked={checked}
        onChange={(event) => setChecked(event.target.checked)}
      />
    </Dialog>
  );
}

/** W66 · Kembalikan ke HRD dengan catatan wajib (FR-25). */
export function ReturnDialog({
  initialNote = '',
  onClose,
  onConfirm,
}: {
  initialNote?: string;
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState(initialNote);
  const [touched, setTouched] = useState(false);
  const missing = note.trim().length === 0;
  return (
    <Dialog
      title="Kembalikan payroll ke HRD?"
      description="Status kembali ke Draft agar HRD dapat memperbaiki. Catatan wajib diisi."
      size="md"
      onClose={onClose}
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        setTouched(true);
        if (!missing) onConfirm(note);
      }}
      actions={
        <>
          <Button variant="secondary" compact onClick={onClose}>
            Batal
          </Button>
          <Button variant="danger" compact type="submit" disabled={missing}>
            Kembalikan
          </Button>
        </>
      }
    >
      <TextareaField
        label="Catatan untuk HRD"
        helper="Wajib diisi"
        error={touched && missing ? 'Catatan wajib diisi' : undefined}
        maxLength={PAYROLL_NOTE_MAX}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        onBlur={() => setTouched(true)}
        required
        autoFocus
      />
    </Dialog>
  );
}
