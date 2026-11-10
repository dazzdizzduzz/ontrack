'use client';

import {
  PROJECT_NAME_MAX,
  TASK_DESCRIPTION_MAX,
  parseDateInput,
  validateProject,
  type Project,
  type ProjectDraft,
} from '@on-track/core';
import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { ChipButton } from '@/components/ui/Chip';
import { Dialog } from '@/components/ui/Dialog';
import { SelectField, TextareaField, TextField } from '@/components/ui/Field';
import { useTasks } from '@/features/task/TaskProvider';
import styles from './task.module.css';

/** Anggota yang langsung tampil sebagai chip; sisanya muncul lewat "+ Tambah" (W48). */
const VISIBLE_MEMBERS = 3;

export const emptyProjectDraft: ProjectDraft = {
  name: '',
  clientId: '',
  start: '',
  target: '',
  description: '',
  memberIds: [],
};

/** W48 · Proyek baru. Nama dan klien wajib; target selesai tidak boleh sebelum mulai. */
export function ProjectFormDialog({
  initialDraft,
  onClose,
  onCreated,
}: {
  initialDraft: ProjectDraft;
  onClose: () => void;
  onCreated: (project: Project) => void;
}) {
  const { clients, people, projects } = useTasks();
  const [draft, setDraft] = useState<ProjectDraft>(initialDraft);
  const [submitted, setSubmitted] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const errors = validateProject(draft);
  const shown = submitted ? errors : {};
  const members = showAll ? people : people.slice(0, VISIBLE_MEMBERS);

  function update(patch: Partial<ProjectDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function toggleMember(id: string) {
    update({
      memberIds: draft.memberIds.includes(id)
        ? draft.memberIds.filter((member) => member !== id)
        : [...draft.memberIds, id],
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    const name = draft.name.trim();
    // MOCK: nanti POST /projects (draf F08).
    onCreated({
      id: `p-${projects.length + 1}-${Date.now()}`,
      name,
      shortName: name,
      clientId: draft.clientId,
      description: draft.description.trim() || undefined,
      start: parseDateInput(draft.start) ?? undefined,
      target: parseDateInput(draft.target) ?? undefined,
      memberIds: draft.memberIds,
      progress: 0,
      activeTasks: 0,
    });
  }

  return (
    <Dialog
      title="Proyek baru"
      size="xl"
      showClose
      onClose={onClose}
      onSubmit={handleSubmit}
      actions={
        <>
          <Button variant="secondary" compact onClick={onClose}>
            Batal
          </Button>
          <Button compact type="submit">
            Simpan proyek
            <Image src="/icons/check-inverse-20.svg" alt="" width={20} height={20} unoptimized />
          </Button>
        </>
      }
    >
      <TextField
        label="Nama proyek *"
        helper=" "
        error={shown.name}
        maxLength={PROJECT_NAME_MAX}
        value={draft.name}
        onChange={(event) => update({ name: event.target.value })}
        autoFocus
      />
      <SelectField
        label="Klien *"
        placeholder="Pilih klien"
        options={clients.map((client) => client.name)}
        error={shown.clientId}
        value={clients.find((client) => client.id === draft.clientId)?.name ?? ''}
        onChange={(event) =>
          update({ clientId: clients.find((client) => client.name === event.target.value)?.id ?? '' })
        }
      />
      <div className={styles.formRow}>
        <TextField
          label="Mulai"
          placeholder="12/10/2026"
          helper=" "
          error={shown.start}
          value={draft.start}
          onChange={(event) => update({ start: event.target.value })}
        />
        <TextField
          label="Target selesai"
          placeholder="30/11/2026"
          helper=" "
          error={shown.target}
          value={draft.target}
          onChange={(event) => update({ target: event.target.value })}
        />
      </div>
      <TextareaField
        label="Deskripsi"
        helper="Opsional"
        maxLength={TASK_DESCRIPTION_MAX}
        value={draft.description}
        onChange={(event) => update({ description: event.target.value })}
      />
      <div className={styles.members}>
        <span className={styles.memberLabel} id="anggota-label">
          Anggota tim
        </span>
        <div className={styles.chips} role="group" aria-labelledby="anggota-label">
          {members.map((person) => (
            <ChipButton
              key={person.id}
              selected={draft.memberIds.includes(person.id)}
              onClick={() => toggleMember(person.id)}
            >
              {person.name}
            </ChipButton>
          ))}
          {!showAll && people.length > VISIBLE_MEMBERS && (
            <ChipButton showCheck={false} onClick={() => setShowAll(true)}>
              + Tambah
            </ChipButton>
          )}
        </div>
      </div>
    </Dialog>
  );
}
