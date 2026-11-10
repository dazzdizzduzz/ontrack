'use client';

import { formatTaskDue, taskPriorityLabels, taskStatusLabels, type Task } from '@on-track/core';
import { Alert } from '@/components/ui/Alert';
import { Drawer } from '@/components/ui/Drawer';
import detail from '@/features/admin/leave/leave.module.css';
import { clientLabel, useTasks } from '@/features/task/TaskProvider';

/**
 * W99 · Detail task (baca saja) untuk admin. Status diubah penanggung jawab; review dibuka dari
 * kolom Review (W51), jadi drawer ini tanpa tombol aksi.
 */
export function ReadOnlyTaskDrawer({ task, onClose }: { task: Task; onClose: () => void }) {
  const { projects, clients, people } = useTasks();
  const project = projects.find((item) => item.id === task.projectId);
  const client = clients.find((item) => item.id === project?.clientId);
  const rows = [
    { label: 'Penanggung jawab', value: people.find((person) => person.id === task.assigneeId)?.name ?? '—' },
    { label: 'Tenggat', value: task.due ? formatTaskDue(task.due) : 'Tanpa tenggat' },
    { label: 'Status', value: taskStatusLabels[task.status] },
    { label: 'Prioritas', value: taskPriorityLabels[task.priority] },
  ];

  return (
    <Drawer
      title={task.title}
      eyebrow={`${clientLabel(client)}${project ? ` · ${project.shortName}` : ''}`}
      onClose={onClose}
      onSubmit={(event) => event.preventDefault()}
    >
      <dl className={detail.detail}>
        {rows.map((row) => (
          <div key={row.label} className={detail.detailRow}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <Alert tone="info" title="Hanya bisa dilihat">
        Status diubah oleh penanggung jawab. Review dibuka saat task masuk kolom Review.
      </Alert>
    </Drawer>
  );
}
