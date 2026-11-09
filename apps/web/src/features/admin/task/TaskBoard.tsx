'use client';

import {
  formatTaskDue,
  isOverdue,
  sampleTaskDraft,
  sampleTaskNow,
  taskPriorityLabels,
  taskStatusLabels,
  taskStatusOrder,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '@on-track/core';
import Image from 'next/image';
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { TaskCard } from '@/components/ui/TaskCard';
import { Toast } from '@/components/ui/Toast';
import shared from '../employees/employees.module.css';
import { ClientFilter } from './ClientFilter';
import { emptyTaskDraft, TaskFormDialog } from './TaskFormDialog';
import { clientFilters, clientLabel, useTasks } from './TaskProvider';
import styles from './task.module.css';

/** `?state=`: `baru` (W10), `validasi` (W49), `dibuat` (W50). `?view=daftar` = W46. */
export type TaskBoardPreview = 'baru' | 'validasi' | 'dibuat';
export type TaskView = 'kanban' | 'daftar';

const PERIOD = 'Oktober 2026';

const createdSample: Task = {
  id: 't-kop-surat',
  title: sampleTaskDraft.title,
  projectId: sampleTaskDraft.projectId,
  assigneeId: sampleTaskDraft.assigneeId,
  priority: sampleTaskDraft.priority,
  status: 'todo',
  due: '2026-10-07T17:00',
};

type Tone = 'neutral' | 'warning' | 'success' | 'danger' | 'inverse';

const priorityTones: Record<TaskPriority, Tone> = { rendah: 'neutral', sedang: 'warning', tinggi: 'danger' };

/** W46 memakai badge gelap untuk In Progress agar menonjol di tabel. */
const listStatusTones: Record<TaskStatus, Tone> = {
  todo: 'neutral',
  in_progress: 'inverse',
  review: 'warning',
  done: 'success',
};

/** Urutan W46: overdue, sedang dikerjakan, review, to do, selesai; lalu tenggat terdekat. */
const listRank = (task: Task) =>
  isOverdue(task, sampleTaskNow) ? 0 : { in_progress: 1, review: 2, todo: 3, done: 4 }[task.status];

export function TaskBoard({ preview, view: initialView = 'kanban' }: { preview?: TaskBoardPreview; view?: TaskView }) {
  const { tasks: stored, projects, clients, people, addTask } = useTasks();
  // W50: contoh task yang baru dibuat dari isian W10, ditambahkan tanpa mengubah data bersama.
  const tasks =
    preview === 'dibuat' && !stored.some((task) => task.id === createdSample.id)
      ? [createdSample, ...stored]
      : stored;
  const [view, setView] = useState<TaskView>(initialView);
  const [clientId, setClientId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(preview === 'baru' || preview === 'validasi');
  const [highlightId, setHighlightId] = useState<string | null>(
    preview === 'dibuat' ? createdSample.id : null,
  );
  const [toast, setToast] = useState<string | null>(() =>
    preview === 'dibuat'
      ? (people.find((person) => person.id === createdSample.assigneeId)?.name ?? null)
      : null,
  );

  const projectOf = (task: Task) => projects.find((project) => project.id === task.projectId);
  const clientOf = (task: Task) => clients.find((client) => client.id === projectOf(task)?.clientId);
  const personOf = (task: Task) => people.find((person) => person.id === task.assigneeId);

  const visible = tasks.filter((task) => !clientId || projectOf(task)?.clientId === clientId);
  const active = tasks.filter((task) => task.status !== 'done').length;
  const overdue = tasks.filter((task) => isOverdue(task, sampleTaskNow)).length;

  function created(task: Task) {
    addTask(task);
    setFormOpen(false);
    setHighlightId(task.id);
    setView('kanban');
    setClientId(null);
    setToast(personOf(task)?.name ?? 'Penanggung jawab');
  }

  return (
    <main className={shared.main}>
      <header className={shared.header}>
        <div className={shared.titleBlock}>
          <h1 className={shared.title}>Task Board</h1>
          <p className={shared.subtitle}>
            {active} task aktif · {overdue} overdue · {PERIOD}
          </p>
        </div>
        <div className={styles.headerActions}>
          <ButtonLink variant="ghost" compact href="/task/proyek">
            Kelola proyek
            <Image src="/icons/building.svg" alt="" width={20} height={20} unoptimized />
          </ButtonLink>
          {/* MOCK: laporan beban kerja dikerjakan di fitur berikutnya. */}
          <Button variant="secondary" compact>
            Laporan beban kerja
          </Button>
          <Button compact onClick={() => setFormOpen(true)}>
            Task baru
            <Image src="/icons/plus-inverse.svg" alt="" width={20} height={20} unoptimized />
          </Button>
        </div>
      </header>

      {toast && (
        <Toast tone="success" title="Task dibuat di kolom To Do" onDismiss={() => setToast(null)}>
          {toast} sudah dinotifikasi lewat aplikasi &amp; email.
        </Toast>
      )}

      <div className={styles.toolbar}>
        <ClientFilter clients={clientFilters(projects, clients)} value={clientId} onChange={setClientId} />
        <div className={styles.segmented} role="group" aria-label="Tampilan">
          <button
            type="button"
            aria-pressed={view === 'kanban'}
            className={styles.segment}
            onClick={() => setView('kanban')}
          >
            <Image src="/icons/grid.svg" alt="" width={16} height={16} unoptimized />
            Kanban
          </button>
          <button
            type="button"
            aria-pressed={view === 'daftar'}
            className={styles.segment}
            onClick={() => setView('daftar')}
          >
            <Image src="/icons/task.svg" alt="" width={16} height={16} unoptimized />
            Daftar
          </button>
        </div>
      </div>

      {view === 'kanban' ? (
        <div className={styles.board}>
          {taskStatusOrder.map((status) => {
            const column = visible.filter((task) => task.status === status);
            return (
              <section key={status} className={styles.column} aria-label={taskStatusLabels[status]}>
                <header className={styles.columnHeader}>
                  <h2 className={styles.columnTitle}>{taskStatusLabels[status]}</h2>
                  <span className={styles.count}>{column.length}</span>
                </header>
                {column.map((task) => (
                  <TaskCard
                    key={task.id}
                    client={clientLabel(clientOf(task))}
                    title={task.title}
                    due={task.due ? formatTaskDue(task.due) : 'Tanpa tenggat'}
                    assignee={personOf(task)?.initials ?? '?'}
                    status={task.status}
                    overdue={isOverdue(task, sampleTaskNow)}
                    highlight={task.id === highlightId}
                  />
                ))}
                {column.length === 0 && <p className={styles.columnEmpty}>Belum ada task.</p>}
              </section>
            );
          })}
        </div>
      ) : (
        <div className={shared.tableWrap}>
          <div className={shared.tableScroll}>
            <table className={`${shared.table} ${styles.table}`}>
              <thead>
                <tr>
                  <th scope="col">Task</th>
                  <th scope="col" className={styles.colProject}>
                    Proyek / Klien
                  </th>
                  <th scope="col" className={styles.colPerson}>
                    Penanggung jawab
                  </th>
                  <th scope="col" className={styles.colPriority}>
                    Prioritas
                  </th>
                  <th scope="col" className={styles.colDue}>
                    Tenggat
                  </th>
                  <th scope="col" className={styles.colStatus}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...visible]
                  .sort((a, b) => listRank(a) - listRank(b) || (a.due ?? '').localeCompare(b.due ?? ''))
                  .map((task) => {
                    const late = isOverdue(task, sampleTaskNow);
                    const project = projectOf(task);
                    const client = clientOf(task);
                    const person = personOf(task);
                    return (
                      <tr key={task.id} className={task.id === highlightId ? styles.rowNew : undefined}>
                        <td className={styles.strong}>{task.title}</td>
                        <td>{project && client ? `${project.shortName} · ${client.name}` : '—'}</td>
                        <td>
                          <span className={styles.person}>
                            <Avatar initials={person?.initials ?? '?'} />
                            {person?.name ?? '—'}
                          </span>
                        </td>
                        <td>
                          <Badge tone={priorityTones[task.priority]}>{taskPriorityLabels[task.priority]}</Badge>
                        </td>
                        <td className={late ? styles.late : undefined}>
                          {task.due ? formatTaskDue(task.due) : '—'}
                        </td>
                        <td>
                          {late ? (
                            <Badge tone="danger">Overdue</Badge>
                          ) : (
                            <Badge tone={listStatusTones[task.status]}>{taskStatusLabels[task.status]}</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={6} className={shared.empty}>
                      Belum ada task untuk klien ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {formOpen && (
        <TaskFormDialog
          initialDraft={preview === 'baru' ? sampleTaskDraft : preview === 'validasi' ? { ...sampleTaskDraft, title: '', assigneeId: '' } : emptyTaskDraft}
          initialSubmitted={preview === 'validasi'}
          onClose={() => setFormOpen(false)}
          onCreated={created}
        />
      )}
    </main>
  );
}
