'use client';

import { sampleProjectDraft, type Project } from '@on-track/core';
import Image from 'next/image';
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import shared from '../employees/employees.module.css';
import { ClientFilter } from './ClientFilter';
import { emptyProjectDraft, ProjectFormDialog } from './ProjectFormDialog';
import { clientFilters, clientLabel, useTasks } from '@/features/task/TaskProvider';
import styles from './task.module.css';

const PERIOD = 'Oktober 2026';

/** "2026-10-31" -> "31/10/2026" */
function formatDate(iso: string): string {
  const [yyyy, mm, dd] = iso.split('-');
  return `${dd}/${mm}/${yyyy}`;
}

/** W47 · Proyek (daftar per klien) dan W48 · Proyek baru (`?state=baru`). */
export function ProjectList({ preview }: { preview?: 'baru' }) {
  const { projects, clients, people, addProject } = useTasks();
  const [clientId, setClientId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(preview === 'baru');
  const [toast, setToast] = useState<string | null>(null);

  const visible = projects.filter((project) => !clientId || project.clientId === clientId);
  const usedClients = new Set(projects.map((project) => project.clientId)).size;

  function created(project: Project) {
    addProject(project);
    setFormOpen(false);
    setClientId(null);
    setToast(project.name);
  }

  return (
    <main className={shared.main}>
      <ButtonLink variant="ghost" compact href="/task" className={shared.back}>
        Kembali ke Task Board
      </ButtonLink>

      <header className={shared.header}>
        <div className={shared.titleBlock}>
          <h1 className={shared.title}>Proyek</h1>
          <p className={shared.subtitle}>
            {projects.length} proyek aktif · {usedClients} klien · {PERIOD}
          </p>
        </div>
        <Button compact onClick={() => setFormOpen(true)}>
          Proyek baru
          <Image src="/icons/plus-inverse.svg" alt="" width={20} height={20} unoptimized />
        </Button>
      </header>

      {toast && (
        <Toast tone="success" title="Proyek dibuat" onDismiss={() => setToast(null)}>
          {toast} siap dipakai saat membuat task.
        </Toast>
      )}

      <ClientFilter clients={clientFilters(projects, clients)} value={clientId} onChange={setClientId} />

      <div className={styles.projects}>
        {visible.map((project) => {
          const team = project.memberIds
            .map((id) => people.find((person) => person.id === id))
            .filter((person) => person !== undefined);
          return (
            <article key={project.id} className={styles.project}>
              <p className={styles.projectClient}>
                {clientLabel(clients.find((client) => client.id === project.clientId))}
              </p>
              <h2 className={styles.projectName}>{project.name}</h2>
              {project.description && <p className={styles.projectDescription}>{project.description}</p>}
              <div className={styles.progressRow}>
                <span>{project.activeTasks} task aktif</span>
                <span className={styles.progressValue}>{project.progress}% selesai</span>
              </div>
              <div
                className={styles.bar}
                role="progressbar"
                aria-label={`Progres ${project.name}`}
                aria-valuenow={project.progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span className={styles.barFill} style={{ width: `${project.progress}%` }} />
              </div>
              <div className={styles.projectFooter}>
                <span className={styles.team} aria-label={`Tim: ${team.map((person) => person.name).join(', ') || 'belum ada'}`}>
                  {team.map((person) => (
                    <Avatar key={person.id} initials={person.initials} />
                  ))}
                </span>
                {project.target && (
                  <span className={styles.target}>
                    <Image src="/icons/calendar.svg" alt="" width={16} height={16} unoptimized />
                    Selesai {formatDate(project.target)}
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {formOpen && (
        <ProjectFormDialog
          initialDraft={preview === 'baru' ? sampleProjectDraft : emptyProjectDraft}
          onClose={() => setFormOpen(false)}
          onCreated={created}
        />
      )}
    </main>
  );
}
