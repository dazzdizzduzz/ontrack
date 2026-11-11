'use client';

import {
  formatLeaveRangeShort,
  formatTaskDue,
  leaveTypeLabels,
  sampleTaskNow,
  sampleTeamLead,
  taskStatusLabels,
  taskSummary,
  type DashboardRange,
} from '@on-track/core';
import { useState } from 'react';
import { sampleRequests } from '@/features/admin/leave/data';
import { sampleOvertime } from '@/features/admin/overtime/data';
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

/** "Cuti tahunan" -> "cuti tahunan", singkatan seperti "WFH" tetap. */
const lowerLabel = (label: string) => (label === label.toUpperCase() ? label : label.toLowerCase());

/**
 * W72 · Dashboard Team Lead: hanya tim sendiri dan tanpa data payroll (RBAC, FR-30). MOCK: peran
 * dari `sampleTeamLead`; nanti klaim JWT `role=team_lead` + GET /dashboard/summary (payroll null).
 */
export function TeamLeadDashboard() {
  const [range, setRange] = useState<DashboardRange>('hari');
  const { tasks, people } = useTasks();
  const lead = sampleTeamLead;
  const teamTasks = tasks.filter((task) => lead.memberIds.includes(task.assigneeId));
  const summary = taskSummary(teamTasks, sampleTaskNow);
  const highlight = summary.overdue[0] ?? teamTasks.find((task) => task.status === 'in_progress');
  const owner = people.find((person) => person.id === highlight?.assigneeId);

  const reviews = tasks.filter((task) => task.status === 'review' && task.createdById === lead.id);
  const overtime = sampleOvertime.filter((item) => item.status === 'menunggu' && item.division === lead.team);
  const leave = sampleRequests.filter((item) => item.status === 'menunggu' && item.division === lead.team);
  const attention: AttentionItem[] = [
    ...reviews.map((task) => ({ key: task.id, icon: 'task', text: `${task.title} menunggu review`, action: 'Review', href: '/task' })),
    ...(overtime.length
      ? [{ key: 'lembur', icon: 'clock', text: `${overtime.length} lembur tim menunggu persetujuan`, action: 'Tinjau', href: '/kehadiran/lembur' }]
      : []),
    ...leave.map((item) => ({
      key: item.id,
      icon: 'calendar',
      text: `Pengajuan ${lowerLabel(leaveTypeLabels[item.type])} ${lead.nicknames[item.name] ?? item.name.split(' ')[0]} ${formatLeaveRangeShort(item)}`,
      action: 'Tinjau',
      href: '/izin',
    })),
  ];

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Ringkasan Tim {lead.team}</h1>
          <p className={styles.subtitle}>Kamis, 01/10/2026 · {lead.kpis.total} anggota tim · tampilan Team Lead</p>
        </div>
        <div className={styles.headerTools}>
          <LiveStamp label="Diperbarui 2 detik lalu" />
          <RangeTabs value={range} onChange={setRange} />
          <ExportLink />
        </div>
      </header>

      <AttendanceKpiRow kpis={lead.kpis} lateNote={lead.lateNote} range={range} memberLabel="anggota" />

      <div className={`${styles.row} ${styles.rowTwo}`}>
        <TaskSummaryCard
          active={summary.active}
          overdue={summary.overdue.length}
          done={summary.done}
          highlight={highlight}
          highlightMeta={
            highlight?.due
              ? `${owner?.name ?? '—'} · tenggat ${formatTaskDue(highlight.due).split(' · ')[0]} · ${taskStatusLabels[highlight.status]}`
              : undefined
          }
        />
        <WeekChart bars={lead.weekBars} />
      </div>

      <AttentionCard items={attention} action={<LiveMapLink />} />
    </main>
  );
}
