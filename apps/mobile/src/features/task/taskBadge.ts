import { isOverdue, sampleTaskNow, type Task } from '@on-track/core';

import type { BadgeTone } from '@/components/ui/Badge';

/** Badge task: Overdue (FR-20), Perlu revisi (M46), lalu status. */
export function taskBadge(task: Task): { tone: BadgeTone; label: string } {
  if (isOverdue(task, sampleTaskNow)) return { tone: 'danger', label: 'Overdue' };
  if (task.revision && task.status === 'in_progress') return { tone: 'warning', label: 'Perlu revisi' };
  return {
    todo: { tone: 'neutral' as const, label: 'To do' },
    in_progress: { tone: 'neutral' as const, label: 'In progress' },
    review: { tone: 'warning' as const, label: 'Review' },
    done: { tone: 'success' as const, label: 'Done' },
  }[task.status];
}
