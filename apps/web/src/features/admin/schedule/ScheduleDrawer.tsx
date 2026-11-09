'use client';

import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { TextField } from '@/components/ui/Field';
import { Drawer } from '@/components/ui/Drawer';
import { useEmployees } from '../employees/EmployeesProvider';
import { isEndAfterStart, sampleSchedule, scheduleLabel } from './data';
import { ScheduleFields, type ScheduleTimes } from './ScheduleFields';
import { useScheduleLocations } from './ScheduleLocationsProvider';
import styles from './schedule.module.css';

const emptyTimes: ScheduleTimes = {
  start: '',
  end: '',
  tolerance: '10 menit',
  days: [],
  overtimeAfter: '30 menit',
  overtimeLimit: '3 jam',
};

type ScheduleDrawerProps = {
  preview?: boolean;
  /** W86: simpan gagal, panel tetap terbuka dengan isiannya. */
  previewFailed?: boolean;
  onClose: () => void;
  onSaved: (name: string, memberCount: number) => void;
};

/** W31 · Tambah Jadwal Kerja, W86 · Gagal Disimpan */
export function ScheduleDrawer({
  preview = false,
  previewFailed = false,
  onClose,
  onSaved,
}: ScheduleDrawerProps) {
  const { employees: allEmployees, updateEmployee } = useEmployees();
  // Karyawan nonaktif tidak bisa diberi jadwal.
  const employees = allEmployees.filter((employee) => employee.status !== 'nonaktif');
  const { schedules, saveSchedule } = useScheduleLocations();
  const [name, setName] = useState(preview ? sampleSchedule.name : '');
  const [times, setTimes] = useState<ScheduleTimes>(
    preview
      ? { ...emptyTimes, start: sampleSchedule.start, end: sampleSchedule.end, days: sampleSchedule.days }
      : emptyTimes,
  );
  const [memberIds, setMemberIds] = useState<string[]>(preview ? sampleSchedule.memberIds : []);
  const [submitted, setSubmitted] = useState(false);

  const nameError = submitted && !name.trim() ? 'Nama jadwal wajib diisi' : undefined;
  const endError =
    submitted && !isEndAfterStart(times.start, times.end) ? 'Harus setelah jam masuk' : undefined;

  function toggleMember(id: string) {
    setMemberIds((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
  }

  // MOCK: tersimpan di memori selama belum ada API.
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!name.trim() || !isEndAfterStart(times.start, times.end)) return;

    const schedule = {
      ...times,
      id: `jadwal-${schedules.length + 1}`,
      name: name.trim(),
      memberCount: memberIds.length,
      allowRemote: false,
    };
    saveSchedule(schedule);
    employees
      .filter((employee) => memberIds.includes(employee.id))
      .forEach((employee) => updateEmployee({ ...employee, schedule: scheduleLabel(schedule) }));
    onSaved(schedule.name, memberIds.length);
  }

  return (
    <Drawer
      title="Tambah jadwal kerja"
      onClose={onClose}
      onSubmit={handleSubmit}
      actions={
        <>
          <Button variant="secondary" compact onClick={onClose}>
            Batal
          </Button>
          <Button compact type="submit">
            Simpan jadwal
            <Image src="/icons/check-inverse-20.svg" alt="" width={20} height={20} unoptimized />
          </Button>
        </>
      }
    >
      {previewFailed && (
        <Alert tone="danger" title="Jadwal belum tersimpan">
          Koneksi terputus. Isian tetap di panel, coba simpan lagi.
        </Alert>
      )}
      <TextField
        label="Nama jadwal *"
        helper="Tampil di profil karyawan"
        error={nameError}
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoComplete="off"
      />
      <ScheduleFields values={times} endError={endError} onChange={setTimes} />
      <p className={styles.groupLabel}>Berlaku untuk ({memberIds.length} karyawan)</p>
      <div className={styles.members}>
        {employees.map((employee) => (
          <Checkbox
            key={employee.id}
            label={`${employee.name} · ${employee.position}`}
            checked={memberIds.includes(employee.id)}
            onChange={() => toggleMember(employee.id)}
          />
        ))}
      </div>
    </Drawer>
  );
}
