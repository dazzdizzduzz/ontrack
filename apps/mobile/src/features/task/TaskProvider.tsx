import {
  sampleProjects,
  sampleTaskClients,
  sampleTaskNow,
  sampleTaskPeople,
  sampleTasks,
  type Project,
  type Task,
  type TaskClient,
  type TaskFile,
  type TaskPerson,
} from '@on-track/core';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type TaskValue = {
  tasks: Task[];
  projects: Project[];
  clients: TaskClient[];
  people: TaskPerson[];
  setStatus: (id: string, status: 'todo' | 'in_progress') => void;
  submit: (id: string, files: TaskFile[], note?: string) => void;
  addComment: (id: string, authorId: string, text: string) => void;
};

const TaskContext = createContext<TaskValue | null>(null);

/**
 * MOCK: task karyawan tersimpan di memori aplikasi. Saat integrasi: GET /me/tasks, GET /tasks/{id},
 * PATCH /tasks/{id}/status, POST /tasks/{id}/submissions, dan POST /tasks/{id}/comments (draf F09).
 * Waktu memakai "sekarang" contoh Figma agar status overdue konsisten dengan web.
 */
export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);

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
      projects: sampleProjects,
      clients: sampleTaskClients,
      people: sampleTaskPeople,
      setStatus,
      submit,
      addComment,
    }),
    [addComment, setStatus, submit, tasks],
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks() {
  const value = useContext(TaskContext);
  if (!value) throw new Error('useTasks harus dipakai di dalam TaskProvider');
  return value;
}

/** "KLIEN JBM", "INTERNAL". */
export function clientLabel(client?: TaskClient): string {
  if (!client) return 'Tanpa proyek';
  return client.internal ? 'Internal' : `Klien ${client.name}`;
}
