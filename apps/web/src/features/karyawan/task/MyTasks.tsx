'use client';

import {
  formatTaskDue,
  isOverdue,
  sampleTaskNow,
  sampleTaskUserId,
  taskStatusLabels,
  taskStatusOrder,
} from '@on-track/core';
import { useState } from 'react';
import { TaskCard } from '@/components/ui/TaskCard';
import shared from '@/features/admin/employees/employees.module.css';
import board from '@/features/admin/task/task.module.css';
import { TaskDetailDrawer } from '@/features/task/TaskDetailDrawer';
import { clientLabel, useTasks } from '@/features/task/TaskProvider';

/**
 * KW21 · Task Saya (Kanban) dan KW22 · Detail task (`?state=detail`). Hanya task milik pengguna
 * yang login (MOCK: Dhais Alfa Rysy); nanti GET /me/tasks (draf F09).
 */
export function MyTasks({ preview }: { preview?: 'detail' }) {
  const { tasks, projects, clients, people } = useTasks();
  const [openId, setOpenId] = useState<string | null>(preview === 'detail' ? 't-logo' : null);

  const mine = tasks.filter((task) => task.assigneeId === sampleTaskUserId);
  const active = mine.filter((task) => task.status !== 'done').length;
  const overdue = mine.filter((task) => isOverdue(task, sampleTaskNow)).length;
  const initials = people.find((person) => person.id === sampleTaskUserId)?.initials ?? '?';

  return (
    <main className={shared.main}>
      <header className={shared.header}>
        <div className={shared.titleBlock}>
          <h1 className={shared.title}>Task Saya</h1>
          <p className={shared.subtitle}>
            {active} task aktif · {overdue} overdue · ditugaskan oleh Team Lead
          </p>
        </div>
      </header>

      <div className={board.board}>
        {taskStatusOrder.map((status) => {
          const column = mine.filter((task) => task.status === status);
          return (
            <section key={status} className={board.column} aria-label={taskStatusLabels[status]}>
              <header className={board.columnHeader}>
                <h2 className={board.columnTitle}>{taskStatusLabels[status]}</h2>
                <span className={board.count}>{column.length}</span>
              </header>
              {column.map((task) => {
                const project = projects.find((item) => item.id === task.projectId);
                return (
                  <TaskCard
                    key={task.id}
                    client={clientLabel(clients.find((item) => item.id === project?.clientId))}
                    title={task.title}
                    due={task.due ? formatTaskDue(task.due) : 'Tanpa tenggat'}
                    assignee={initials}
                    status={task.status}
                    overdue={isOverdue(task, sampleTaskNow)}
                    onOpen={() => setOpenId(task.id)}
                  />
                );
              })}
              {column.length === 0 && <p className={board.columnEmpty}>Belum ada task.</p>}
            </section>
          );
        })}
      </div>

      {openId && (
        <TaskDetailDrawer taskId={openId} userId={sampleTaskUserId} onClose={() => setOpenId(null)} />
      )}
    </main>
  );
}
