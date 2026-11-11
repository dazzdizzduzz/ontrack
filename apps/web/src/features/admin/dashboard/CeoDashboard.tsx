'use client';

import {
  formatOverdueBy,
  formatRupiahShort,
  payrollTotals,
  sampleAttendanceKpis,
  sampleDashboardContext,
  samplePayrollAdjustments,
  samplePayrollOthers,
  samplePayrollPeriods,
  sampleRangeKpis,
  sampleTaskNow,
  sampleWeekBars,
  taskStatusLabels,
  taskSummary,
  type DashboardRange,
  type PayrollStatus,
} from '@on-track/core';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { sampleRequests } from '@/features/admin/leave/data';
import { sampleOvertime } from '@/features/admin/overtime/data';
import { computeLines, usePayroll } from '@/features/admin/payroll/PayrollProvider';
import { useTasks } from '@/features/task/TaskProvider';
import {
  AttendanceKpiRow,
  AttentionCard,
  ExportLink,
  LiveMapLink,
  LiveStamp,
  RangeTabs,
  TaskSummaryCard,
  WeekChart,
  type AttentionItem,
} from './DashboardParts';
import styles from './dashboard.module.css';

const payrollBadges: Record<PayrollStatus, { tone: 'neutral' | 'warning' | 'success'; label: string }> = {
  belum: { tone: 'neutral', label: 'Belum dibuat' },
  draft: { tone: 'neutral', label: 'Draft HRD' },
  diajukan: { tone: 'warning', label: 'Menunggu CEO' },
  disetujui: { tone: 'success', label: 'Disetujui' },
};

/** MOCK: jadwal generate payroll Oktober (W69 "generate 01/11"). */
const PAYROLL_GENERATE_DATE = '01/11';

/** Kartu payroll: status nyata dari PayrollProvider (F11). Hanya owner & HRD (RBAC). */
function PayrollCard() {
  const { run, lines, profiles, rules } = usePayroll();
  // Sebelum digenerate: estimasi dari profil gaji dan penyesuaian contoh.
  const adjustments = lines.length ? run.adjustments : samplePayrollAdjustments;
  const rows = lines.length ? lines : computeLines(profiles, rules, adjustments);
  const totals = payrollTotals(rows, samplePayrollPeriods, adjustments, samplePayrollOthers);
  const badge = payrollBadges[run.status];
  const meta =
    run.status === 'diajukan' && run.submittedAt
      ? `diajukan ${run.submittedAt}`
      : run.status === 'disetujui' && run.approvedAt
        ? `dikunci ${run.approvedAt}`
        : undefined;
  return (
    <section className={styles.card} aria-labelledby="dash-payroll">
      <h2 id="dash-payroll" className={styles.cardTitle}>
        Payroll Oktober
      </h2>
      <div>
        <p className={styles.money}>{formatRupiahShort(totals.net)}</p>
        <p className={styles.cardMeta}>
          {run.status === 'belum'
            ? `Estimasi · ${totals.employees} karyawan · generate ${PAYROLL_GENERATE_DATE}`
            : `Total biaya · ${totals.employees} karyawan`}
        </p>
      </div>
      <div className={styles.payrollStatus}>
        <Badge tone={badge.tone}>{badge.label}</Badge>
        {meta && <span className={styles.cardMeta}>{meta}</span>}
      </div>
      <ButtonLink fullWidth compact href="/payroll" className={styles.pushEnd}>
        {run.status === 'diajukan' ? 'Tinjau & setujui' : run.status === 'belum' ? 'Lihat persiapan payroll' : 'Buka payroll'}
      </ButtonLink>
    </section>
  );
}

/**
 * W69 · Ringkasan hari ini untuk CEO/HRD (FR-29, FR-30, US-08 AC-1). Task dan payroll membaca
 * provider yang sama dengan Task Board & Payroll. MOCK: kehadiran dari `sampleAttendanceKpis`;
 * nanti GET /dashboard/summary (draf F13).
 */
export function CeoDashboard() {
  const [range, setRange] = useState<DashboardRange>('hari');
  const { tasks, people } = useTasks();
  const { profiles } = usePayroll();
  const kpis = range === 'hari' ? sampleAttendanceKpis : sampleRangeKpis[range];
  const summary = taskSummary(tasks, sampleTaskNow);
  const highlight = summary.overdue[0];
  const owner = people.find((person) => person.id === highlight?.assigneeId);
  const ctx = sampleDashboardContext;

  const leavePending = sampleRequests.filter((request) => request.status === 'menunggu').length;
  const overtimePending = sampleOvertime.filter((request) => request.status === 'menunggu').length;
  const incomplete = profiles.filter((profile) => !profile.components).length;
  const notCheckedIn = sampleAttendanceKpis.notCheckedIn;
  const attention: AttentionItem[] = [
    notCheckedIn && { key: 'absen', icon: 'user', text: `${notCheckedIn} karyawan belum absen`, action: 'Lihat', href: '/dashboard/kehadiran?state=belum-absen' },
    leavePending && { key: 'izin', icon: 'calendar', text: `${leavePending} pengajuan izin menunggu`, action: 'Tinjau', href: '/izin' },
    overtimePending && { key: 'lembur', icon: 'clock', text: `${overtimePending} lembur menunggu persetujuan`, action: 'Tinjau', href: '/kehadiran/lembur' },
    incomplete && { key: 'gaji', icon: 'wallet-ink', text: `${incomplete} profil komponen gaji belum lengkap`, action: 'Lengkapi', href: '/payroll/komponen' },
  ].filter((item): item is AttentionItem => Boolean(item));

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Ringkasan {range === 'hari' ? 'Hari Ini' : range === 'minggu' ? 'Minggu Ini' : 'Bulan Ini'}</h1>
          <p className={styles.subtitle}>
            {ctx.date} · {ctx.tenant} · {kpis.total} karyawan
          </p>
        </div>
        <div className={styles.headerTools}>
          <LiveStamp label="Diperbarui 2 detik lalu" />
          <RangeTabs value={range} onChange={setRange} />
          <ExportLink />
        </div>
      </header>

      <AttendanceKpiRow kpis={kpis} range={range} notCheckedInHref="/dashboard/kehadiran?state=belum-absen" />

      <div className={styles.row}>
        <TaskSummaryCard
          active={summary.active}
          overdue={summary.overdue.length}
          done={summary.done}
          highlight={highlight}
          highlightMeta={
            highlight?.due
              ? `${owner?.name ?? '—'} · ${formatOverdueBy(highlight.due, sampleTaskNow)} · ${taskStatusLabels[highlight.status]}`
              : undefined
          }
        />
        <PayrollCard />
        <WeekChart bars={sampleWeekBars} />
      </div>

      <AttentionCard items={attention} action={<LiveMapLink />} />
    </main>
  );
}
