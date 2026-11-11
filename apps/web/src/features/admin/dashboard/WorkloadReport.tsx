'use client';

import {
  HIGH_UTILIZATION,
  formatOverdueBy,
  formatTaskDue,
  isOverdue,
  sampleTaskNow,
  taskStatusLabels,
  taskSummary,
  teamUtilization,
  workloadLabel,
  workloads,
  type Task,
  type Workload,
} from '@on-track/core';
import Image from 'next/image';
import { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Drawer } from '@/components/ui/Drawer';
import { SelectField } from '@/components/ui/Field';
import { StatCard } from '@/components/ui/StatCard';
import { Toast } from '@/components/ui/Toast';
import { usePayroll } from '@/features/admin/payroll/PayrollProvider';
import { useTasks } from '@/features/task/TaskProvider';
import styles from './dashboard.module.css';

export type WorkloadPreview = 'detail' | 'alihkan';

const PERIOD = 'Oktober 2026';
/** Lebar batang maksimum (persen kolom) untuk orang dengan task terbanyak. */
const BAR_MAX_PERCENT = 60;

const dueDay = (task: Task) => (task.due ? formatTaskDue(task.revision?.due ?? task.due).split(' · ')[0] : '—');

/** Task yang disarankan untuk dialihkan: To Do dengan tenggat paling jauh. */
function suggestedTask(active: Task[]): Task | undefined {
  return [...active].filter((task) => task.status === 'todo').sort((a, b) => (b.due ?? '').localeCompare(a.due ?? ''))[0];
}

/** W102 · Pilih task & anggota baru; penanggung jawab baru menerima notifikasi (FR-21). */
function ReassignDialog({
  item,
  active,
  others,
  onClose,
  onDone,
}: {
  item: Workload;
  active: Task[];
  others: Workload[];
  onClose: () => void;
  onDone: (task: Task, to: Workload) => void;
}) {
  const { projects, clients } = useTasks();
  const label = (task: Task) => {
    const project = projects.find((p) => p.id === task.projectId);
    const client = clients.find((c) => c.id === project?.clientId);
    return `${task.title} · ${client?.name ?? 'Internal'} · ${dueDay(task)}`;
  };
  const targetLabel = (target: Workload) => `${target.person.name} · utilisasi ${target.utilization}%`;
  const sorted = [...others].sort((a, b) => a.utilization - b.utilization);
  const [taskId, setTaskId] = useState(suggestedTask(active)?.id ?? active[0]?.id ?? '');
  const [targetId, setTargetId] = useState(sorted[0]?.person.id ?? '');
  const task = active.find((t) => t.id === taskId);
  const target = sorted.find((t) => t.person.id === targetId);

  return (
    <Dialog
      title="Alihkan task"
      description={`Pindahkan task ${item.person.name} ke anggota tim lain. Penanggung jawab baru menerima notifikasi.`}
      showClose
      size="md"
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();
        if (task && target) onDone(task, target);
      }}
      actions={
        <>
          <Button variant="secondary" compact onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" compact disabled={!task || !target}>
            Alihkan task
          </Button>
        </>
      }
    >
      <SelectField
        label="Task"
        options={active.map(label)}
        value={task ? label(task) : ''}
        onChange={(event) => setTaskId(active.find((t) => label(t) === event.target.value)?.id ?? '')}
      />
      <SelectField
        label="Alihkan ke"
        options={sorted.map(targetLabel)}
        value={target ? targetLabel(target) : ''}
        onChange={(event) => setTargetId(sorted.find((t) => targetLabel(t) === event.target.value)?.person.id ?? '')}
      />
    </Dialog>
  );
}

/** W71 · Detail beban kerja satu karyawan + tombol alihkan task. */
function WorkloadDrawer({
  item,
  active,
  onClose,
  onReassign,
}: {
  item: Workload;
  active: Task[];
  onClose: () => void;
  onReassign: () => void;
}) {
  const { projects } = useTasks();
  const { profiles } = usePayroll();
  const profile = profiles.find((p) => p.id === item.person.id);
  const high = item.utilization >= HIGH_UTILIZATION;
  const suggestion = suggestedTask(active);
  return (
    <Drawer
      title={item.person.name}
      subtitle={[profile?.position, profile?.division, PERIOD].filter(Boolean).join(' · ')}
      onClose={onClose}
      onSubmit={(event) => event.preventDefault()}
      actions={
        <>
          <ButtonLink variant="secondary" compact href="/task">
            Lihat semua task
          </ButtonLink>
          <Button compact disabled={active.length === 0} onClick={onReassign}>
            Alihkan task
            <Image src="/icons/reassign-inverse.svg" alt="" width={20} height={20} unoptimized />
          </Button>
        </>
      }
    >
      <dl className={styles.miniStats}>
        <div className={styles.mini}>
          <dt>Task</dt>
          <dd>{item.total}</dd>
        </div>
        <div className={styles.mini}>
          <dt>Overdue</dt>
          <dd className={item.overdue ? styles.danger : undefined}>{item.overdue}</dd>
        </div>
        <div className={styles.mini}>
          <dt>Jam kerja</dt>
          <dd>{item.hours ? `${item.hours} j` : '—'}</dd>
        </div>
        <div className={styles.mini}>
          <dt>Utilisasi</dt>
          <dd>{item.utilization}%</dd>
        </div>
      </dl>
      {high && (
        <Alert tone="warning" title="Beban kerja tinggi">
          Utilisasi {item.utilization}%{item.overdue ? ` dan ${item.overdue} task overdue` : ''}.
          {suggestion ? ` Pertimbangkan alihkan "${suggestion.title}" ke anggota lain.` : ''}
        </Alert>
      )}
      <p className={styles.sectionLabel}>Task aktif</p>
      {active.length ? (
        <ul className={styles.taskList}>
          {active.map((task) => {
            const late = isOverdue(task, sampleTaskNow);
            const project = projects.find((p) => p.id === task.projectId);
            return (
              <li key={task.id} className={styles.taskItem}>
                <span className={styles.highlightText}>
                  <span className={styles.highlightTitle}>{task.title}</span>
                  <span className={styles.cardMeta}>
                    {project?.name ?? 'Tanpa proyek'} · {dueDay(task)}
                  </span>
                </span>
                <Badge tone={late ? 'danger' : 'neutral'}>{late ? 'Overdue' : taskStatusLabels[task.status]}</Badge>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.cardMeta}>Tidak ada task aktif.</p>
      )}
    </Drawer>
  );
}

/**
 * W11 · Laporan beban kerja (FR-21), W71 · detail, W102 · alihkan task. Pratinjau `?state=detail`
 * dan `?state=alihkan` (Dhais). Data task live dari TaskProvider; utilisasi masih MOCK
 * (`sampleUtilization`), nanti GET /reports/workload (draf F13).
 */
export function WorkloadReport({ preview }: { preview?: WorkloadPreview }) {
  const { tasks, people, projects, clients, reassign } = useTasks();
  const [openId, setOpenId] = useState<string | null>(preview ? 'daze' : null);
  const [dialogOpen, setDialogOpen] = useState(preview === 'alihkan');
  const [toast, setToast] = useState<string | null>(null);
  const list = workloads(tasks, people, sampleTaskNow);
  const summary = taskSummary(tasks, sampleTaskNow);
  const max = Math.max(1, ...list.map((item) => item.total));
  const activeProjects = new Set(tasks.filter((t) => t.status !== 'done').map((t) => t.projectId));
  const clientProjects = [...activeProjects].filter((id) => {
    const project = projects.find((p) => p.id === id);
    return !clients.find((c) => c.id === project?.clientId)?.internal;
  });
  const firstOverdue = summary.overdue[0];
  const overdueClient = clients.find(
    (c) => c.id === projects.find((p) => p.id === firstOverdue?.projectId)?.clientId,
  );
  const open = list.find((item) => item.person.id === openId);
  const openActive = tasks.filter((t) => t.assigneeId === openId && t.status !== 'done');

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Laporan Beban Kerja</h1>
          <p className={styles.subtitle}>
            {PERIOD} · {list.length} anggota tim · {summary.active} task aktif
          </p>
        </div>
        {/* MOCK: PDF laporan beban kerja belum ada di kontrak; contoh memakai toast. */}
        <Button variant="secondary" compact onClick={() => setToast('Laporan beban kerja Oktober 2026 sedang disiapkan sebagai PDF.')}>
          Ekspor PDF
          <Image src="/icons/download.svg" alt="" width={20} height={20} unoptimized />
        </Button>
      </header>

      {toast && (
        <Toast tone="success" title="Berhasil" onDismiss={() => setToast(null)}>
          {toast}
        </Toast>
      )}

      <div className={styles.kpis}>
        <StatCard label="Task aktif" value={String(summary.active)} meta={`${clientProjects.length} proyek klien`} />
        <StatCard
          label="Overdue"
          value={String(summary.overdue.length)}
          meta={firstOverdue?.due ? `${overdueClient?.name ?? 'Internal'} · ${formatOverdueBy(firstOverdue.due, sampleTaskNow)}` : '—'}
        />
        <StatCard label="Selesai bulan ini" value={String(summary.done)} meta="rata-rata 2,1 hari" />
        <StatCard label="Utilisasi tim" value={`${teamUtilization(list)}%`} meta={`kapasitas ${list.length} orang`} />
      </div>

      <section className={styles.card} aria-labelledby="workload-title">
        <div className={styles.cardHead}>
          <h2 id="workload-title" className={styles.cardTitle}>
            Beban kerja per karyawan
          </h2>
          <ul className={styles.legend}>
            <li>
              <span className={`${styles.squareDot} ${styles.segDone}`} />
              Selesai
            </li>
            <li>
              <span className={`${styles.squareDot} ${styles.segActive}`} />
              Aktif
            </li>
            <li>
              <span className={`${styles.squareDot} ${styles.segOverdue}`} />
              Overdue
            </li>
          </ul>
        </div>
        <ul className={styles.workload}>
          {list.map((item) => {
            const width = (n: number) => `${(n / max) * BAR_MAX_PERCENT}%`;
            const onTrack = item.active - item.overdue;
            return (
              <li key={item.person.id} className={styles.workloadRow}>
                <button
                  type="button"
                  className={styles.workloadPerson}
                  aria-label={`Detail beban kerja ${item.person.name}: ${workloadLabel(item)}`}
                  onClick={() => setOpenId(item.person.id)}
                >
                  <Avatar initials={item.person.initials} size="M" />
                  {item.person.name}
                </button>
                <span className={styles.workloadBar} aria-hidden="true">
                  {item.done > 0 && <span className={`${styles.seg} ${styles.segDone}`} style={{ width: width(item.done) }} />}
                  {onTrack > 0 && <span className={`${styles.seg} ${styles.segActive}`} style={{ width: width(onTrack) }} />}
                  {item.overdue > 0 && (
                    <span className={`${styles.seg} ${styles.segOverdue}`} style={{ width: width(item.overdue) }} />
                  )}
                  <span className={styles.workloadText}>{item.total ? workloadLabel(item) : 'Belum ada task bulan ini'}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className={styles.cardMeta}>
          Batang horizontal menunjukkan jumlah task per status; nilai juga ditulis sebagai teks untuk aksesibilitas.
        </p>
      </section>

      {open && (
        <WorkloadDrawer
          item={open}
          active={openActive}
          onClose={() => setOpenId(null)}
          onReassign={() => setDialogOpen(true)}
        />
      )}
      {open && dialogOpen && (
        <ReassignDialog
          item={open}
          active={openActive}
          others={list.filter((item) => item.person.id !== open.person.id)}
          onClose={() => setDialogOpen(false)}
          onDone={(task, to) => {
            reassign(task.id, to.person.id);
            setDialogOpen(false);
            setOpenId(null);
            setToast(`"${task.title}" kini dipegang ${to.person.name} — notifikasi sudah dikirim.`);
          }}
        />
      )}
    </main>
  );
}
