'use client';

import {
  sampleProjects,
  sampleTaskNow,
  sampleTaskClients,
  sampleTaskPeople,
  sampleTasks,
  type Project,
  type Task,
  type TaskClient,
  type TaskFile,
  type TaskPerson,
  type TaskStatus,
} from '@on-track/core';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type TaskValue = {
  tasks: Task[];
  projects: Project[];
  clients: TaskClient[];
  people: TaskPerson[];
  addTask: (task: Task) => void;
  addProject: (project: Project) => void;
  /** F09: penanggung jawab mengubah To Do ↔ In Progress. */
  setStatus: (id: string, status: Extract<TaskStatus, 'todo' | 'in_progress'>) => void;
  /** F09: kirim hasil ke Review (US-07 AC-1). */
  submit: (id: string, files: TaskFile[], note?: string) => void;
  /** F09: Team Lead menyetujui → Done. */
  approve: (id: string, comment?: string) => void;
  /** F09: Team Lead minta revisi → In Progress. */
  requestRevision: (id: string, note: string, byId: string) => void;
  addComment: (id: string, authorId: string, text: string) => void;
};

const TaskContext = createContext<TaskValue | null>(null);

/**
 * MOCK: task dan proyek tersimpan di memori selama berpindah antara Task Board dan Proyek.
 * Saat integrasi: GET/POST /tasks, /projects, GET /clients (draf F08), serta status, kiriman,
 * persetujuan, revisi, dan komentar task (draf F09).
 */
export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [projects, setProjects] = useState<Project[]>(sampleProjects);

  const addTask = useCallback((task: Task) => {
    setTasks((list) => [task, ...list]);
    if (task.projectId) {
      setProjects((list) =>
        list.map((item) =>
          item.id === task.projectId ? { ...item, activeTasks: item.activeTasks + 1 } : item,
        ),
      );
    }
  }, []);

  const addProject = useCallback((project: Project) => {
    setProjects((list) => [...list, project]);
  }, []);

  // MOCK: waktu keputusan memakai "sekarang" contoh Figma agar overdue tetap konsisten.
  const patch = useCallback((id: string, change: (task: Task) => Task) => {
    setTasks((list) => list.map((task) => (task.id === id ? change(task) : task)));
  }, []);

  const setStatus = useCallback<TaskValue['setStatus']>(
    (id, status) => patch(id, (task) => ({ ...task, status })),
    [patch],
  );

  const submit = useCallback<TaskValue['submit']>(
    (id, files, note) =>
      patch(id, (task) => ({
        ...task,
        status: 'review',
        revision: undefined,
        submission: { files, note: note?.trim() || undefined, at: sampleTaskNow },
      })),
    [patch],
  );

  const approve = useCallback<TaskValue['approve']>(
    (id, comment) =>
      patch(id, (task) => ({
        ...task,
        status: 'done',
        comments: comment?.trim()
          ? [...(task.comments ?? []), { id: `c-${Date.now()}`, authorId: task.createdById ?? 'komang', text: comment.trim(), at: sampleTaskNow }]
          : task.comments,
      })),
    [patch],
  );

  const requestRevision = useCallback<TaskValue['requestRevision']>(
    (id, note, byId) =>
      patch(id, (task) => ({ ...task, status: 'in_progress', revision: { byId, note: note.trim(), at: sampleTaskNow } })),
    [patch],
  );

  const addComment = useCallback<TaskValue['addComment']>(
    (id, authorId, text) =>
      patch(id, (task) => ({
        ...task,
        comments: [...(task.comments ?? []), { id: `c-${Date.now()}`, authorId, text: text.trim(), at: sampleTaskNow }],
      })),
    [patch],
  );

  const value = useMemo(
    () => ({
      tasks,
      projects,
      clients: sampleTaskClients,
      people: sampleTaskPeople,
      addTask,
      addProject,
      setStatus,
      submit,
      approve,
      requestRevision,
      addComment,
    }),
    [addComment, addProject, addTask, approve, projects, requestRevision, setStatus, submit, tasks],
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks() {
  const value = useContext(TaskContext);
  if (!value) throw new Error('useTasks harus dipakai di dalam TaskProvider');
  return value;
}

/** Label klien di kartu: "KLIEN JBM" atau "INTERNAL". */
export function clientLabel(client: TaskClient | undefined): string {
  if (!client) return 'Tanpa proyek';
  return client.internal ? 'Internal' : `Klien ${client.name}`;
}

/** Chip filter klien yang dipakai proyek, urut seperti Figma. */
export function clientFilters(projects: Project[], clients: TaskClient[]): TaskClient[] {
  return clients.filter((client) => projects.some((project) => project.clientId === client.id));
}
