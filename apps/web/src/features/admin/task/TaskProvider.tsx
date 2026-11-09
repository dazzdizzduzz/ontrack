'use client';

import {
  sampleProjects,
  sampleTaskClients,
  sampleTaskPeople,
  sampleTasks,
  type Project,
  type Task,
  type TaskClient,
  type TaskPerson,
} from '@on-track/core';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type TaskValue = {
  tasks: Task[];
  projects: Project[];
  clients: TaskClient[];
  people: TaskPerson[];
  addTask: (task: Task) => void;
  addProject: (project: Project) => void;
};

const TaskContext = createContext<TaskValue | null>(null);

/**
 * MOCK: task dan proyek tersimpan di memori selama berpindah antara Task Board dan Proyek.
 * Saat integrasi: GET/POST /tasks, /projects, dan GET /clients (draf F08).
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

  const value = useMemo(
    () => ({
      tasks,
      projects,
      clients: sampleTaskClients,
      people: sampleTaskPeople,
      addTask,
      addProject,
    }),
    [addProject, addTask, projects, tasks],
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
