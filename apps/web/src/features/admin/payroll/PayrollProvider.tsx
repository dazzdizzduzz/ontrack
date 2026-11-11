'use client';

import {
  adjustableComponents,
  componentsFromRules,
  computePayrollLine,
  formatMoneyPlain,
  payrollTotals,
  samplePayrollAdjustments,
  samplePayrollOthers,
  samplePayrollPeriods,
  samplePayrollRules,
  samplePreviewPeriod,
  sampleSalaryProfiles,
  type PayrollAdjustment,
  type PayrollLine,
  type PayrollRules,
  type PayrollStatus,
  type PayrollTotals,
  type SalaryLog,
  type SalaryProfile,
} from '@on-track/core';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/** Entri audit log payroll (W62). Tidak dapat diubah atau dihapus. */
export type PayrollAudit = { id: string; title: string; detail: string; at: string };

export type PayrollRun = {
  status: PayrollStatus;
  adjustments: PayrollAdjustment[];
  audit: PayrollAudit[];
  generatedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  /** Catatan CEO saat dikembalikan (W103). */
  returnNote?: { note: string; by: string; at: string };
};

type PayrollValue = {
  profiles: SalaryProfile[];
  rules: PayrollRules;
  saveProfile: (profile: SalaryProfile, log: SalaryLog) => void;
  saveRules: (rules: PayrollRules) => void;
  run: PayrollRun;
  lines: PayrollLine[];
  totals: PayrollTotals;
  generate: () => void;
  adjust: (adjustment: Omit<PayrollAdjustment, 'id' | 'by' | 'at'>, employeeName: string) => void;
  submit: () => void;
  approve: () => void;
  returnToHrd: (note: string) => void;
  /** Pratinjau `?state=`: ganti status tanpa melalui alur. */
  preview: (run: Partial<PayrollRun>) => void;
};

const PayrollContext = createContext<PayrollValue | null>(null);

/** MOCK: pengguna yang login (W18). HRD contoh di audit log: Sri Rahayu. */
export const CEO_NAME = 'Ananda Sartana';
export const HRD_NAME = 'Sri Rahayu (HRD)';

const stamp = () => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Makassar',
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('day')}/${get('month')} ${get('hour')}:${get('minute')}`;
};

/** Riwayat contoh W62 sebelum payroll digenerate di sesi ini. */
export const sampleAudit: PayrollAudit[] = [
  { id: 'a-komponen', title: 'Komponen gaji diperbarui', detail: 'Transport Dhais 500 → 750 rb · 01/10 10:12', at: '01/10 10:12' },
];

/** Baris payroll per karyawan dari profil gaji F10 dan penyesuaian HRD. */
export function computeLines(profiles: SalaryProfile[], rules: PayrollRules, adjustments: PayrollAdjustment[]): PayrollLine[] {
  return profiles.map((profile) =>
    computePayrollLine(
      profile,
      profile.components ?? componentsFromRules(profile, rules),
      samplePayrollPeriods[profile.id] ?? samplePreviewPeriod,
      adjustments,
    ),
  );
}

/**
 * MOCK: profil gaji, aturan global, dan payroll periode Oktober tersimpan di memori. Saat integrasi:
 * /payroll/salary-profiles, /payroll/rules (draf F10) dan /payroll/runs/{period} (draf F11).
 */
export function PayrollProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<SalaryProfile[]>(sampleSalaryProfiles);
  const [rules, setRules] = useState<PayrollRules>(samplePayrollRules);
  const [run, setRun] = useState<PayrollRun>({ status: 'belum', adjustments: [], audit: sampleAudit });

  const saveProfile = useCallback((profile: SalaryProfile, log: SalaryLog) => {
    setProfiles((list) =>
      list.map((item) => (item.id === profile.id ? { ...profile, logs: [log, ...profile.logs] } : item)),
    );
  }, []);

  const lines = useMemo(
    () => (run.status === 'belum' ? [] : computeLines(profiles, rules, run.adjustments)),
    [profiles, rules, run.adjustments, run.status],
  );

  const totals = useMemo(
    () => payrollTotals(lines, samplePayrollPeriods, run.adjustments, samplePayrollOthers),
    [lines, run.adjustments],
  );

  const generate = useCallback(() => {
    setRun((current) => {
      const at = stamp();
      // Pratinjau contoh memakai penyesuaian lembur Made bila belum ada penyesuaian.
      const adjustments = current.adjustments.length ? current.adjustments : samplePayrollAdjustments;
      const entries: PayrollAudit[] = [
        { id: `a-gen-${current.audit.length}`, title: 'Payroll digenerate', detail: `16 karyawan · ${at}`, at },
        ...adjustments
          .filter((item) => !current.adjustments.includes(item))
          .map((item) => ({
            id: `a-${item.id}`,
            title: `Adjustment lembur · Made Nandana P.`,
            detail: `Rp ${formatMoneyPlain(item.before)} → ${formatMoneyPlain(item.after)} · ${item.by} · ${item.at}`,
            at: item.at,
          })),
      ];
      return { ...current, status: 'draft', adjustments, generatedAt: at, audit: [...entries.reverse(), ...current.audit] };
    });
  }, []);

  const adjust = useCallback<PayrollValue['adjust']>((input, employeeName) => {
    setRun((current) => {
      const at = stamp();
      const adjustment: PayrollAdjustment = { ...input, id: `adj-${current.adjustments.length + 1}`, by: HRD_NAME, at };
      return {
        ...current,
        adjustments: [...current.adjustments, adjustment],
        audit: [
          {
            id: `a-${adjustment.id}`,
            title: `Adjustment ${adjustableComponents.find((item) => item.key === input.component)?.label.toLowerCase() ?? 'komponen'} · ${employeeName}`,
            detail: `Rp ${formatMoneyPlain(input.before)} → ${formatMoneyPlain(input.after)} · ${HRD_NAME} · ${at}`,
            at,
          },
          ...current.audit,
        ],
      };
    });
  }, []);

  const submit = useCallback(() => {
    setRun((current) => {
      const at = stamp();
      return {
        ...current,
        status: 'diajukan',
        submittedAt: at,
        returnNote: undefined,
        audit: [{ id: `a-sub-${current.audit.length}`, title: 'Diajukan ke CEO', detail: `${HRD_NAME} · ${at}`, at }, ...current.audit],
      };
    });
  }, []);

  const approve = useCallback(() => {
    setRun((current) => {
      const at = stamp();
      return {
        ...current,
        status: 'disetujui',
        approvedAt: at,
        audit: [
          { id: `a-app-${current.audit.length}`, title: 'Disetujui & dikunci', detail: `${CEO_NAME} (CEO) · ${at} · 16 slip terbit`, at },
          ...current.audit,
        ],
      };
    });
  }, []);

  const returnToHrd = useCallback((note: string) => {
    setRun((current) => {
      const at = stamp();
      return {
        ...current,
        status: 'draft',
        returnNote: { note: note.trim(), by: CEO_NAME, at },
        audit: [
          { id: `a-ret-${current.audit.length}`, title: 'Dikembalikan ke HRD', detail: `${CEO_NAME} (CEO) · ${at} · "${note.trim()}"`, at },
          ...current.audit,
        ],
      };
    });
  }, []);

  const preview = useCallback((patch: Partial<PayrollRun>) => setRun((current) => ({ ...current, ...patch })), []);

  const value = useMemo(
    () => ({
      profiles,
      rules,
      saveProfile,
      saveRules: setRules,
      run,
      lines,
      totals,
      generate,
      adjust,
      submit,
      approve,
      returnToHrd,
      preview,
    }),
    [adjust, approve, generate, lines, preview, profiles, returnToHrd, rules, run, saveProfile, submit, totals],
  );
  return <PayrollContext.Provider value={value}>{children}</PayrollContext.Provider>;
}

export function usePayroll() {
  const value = useContext(PayrollContext);
  if (!value) throw new Error('usePayroll harus dipakai di dalam PayrollProvider');
  return value;
}
