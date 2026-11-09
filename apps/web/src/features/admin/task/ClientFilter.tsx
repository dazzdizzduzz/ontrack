import type { TaskClient } from '@on-track/core';
import { ChipButton } from '@/components/ui/Chip';
import styles from './task.module.css';

/** Chip "Semua proyek · JBM · Teneriffe …" di W06, W46, W47. */
export function ClientFilter({
  clients,
  value,
  onChange,
}: {
  clients: TaskClient[];
  value: string | null;
  onChange: (clientId: string | null) => void;
}) {
  return (
    <div className={styles.filter} role="group" aria-label="Filter proyek">
      <ChipButton selected={value === null} onClick={() => onChange(null)}>
        Semua proyek
      </ChipButton>
      {clients.map((client) => (
        <ChipButton key={client.id} selected={value === client.id} onClick={() => onChange(client.id)}>
          {client.name}
        </ChipButton>
      ))}
    </div>
  );
}
