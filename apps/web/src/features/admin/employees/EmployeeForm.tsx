'use client';

import { formatThousands, isValidEmail, parseRupiahInput } from '@on-track/core';
import { notFound, useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button, ButtonLink } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/Field';
import { Toast } from '@/components/ui/Toast';
import { Toggle } from '@/components/ui/Toggle';
import {
  divisions,
  employments,
  roles,
  type Employee,
} from './data';
import { scheduleLabel } from '../schedule/data';
import { useScheduleLocations } from '../schedule/ScheduleLocationsProvider';
import { useEmployees } from './EmployeesProvider';
import styles from './employees.module.css';

type Values = {
  name: string;
  email: string;
  whatsapp: string;
  joinedAt: string;
  position: string;
  division: string;
  employment: string;
  manager: string;
  role: string;
  schedule: string;
  location: string;
  wfhWithoutApproval: boolean;
  baseSalary: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
};

type Errors = Partial<Record<'name' | 'email' | 'position' | 'division' | 'employment', string>>;

const emptyValues: Values = {
  name: '',
  email: '',
  whatsapp: '',
  joinedAt: '',
  position: '',
  division: '',
  employment: '',
  manager: '',
  role: 'Karyawan',
  schedule: '',
  location: '',
  wfhWithoutApproval: false,
  baseSalary: '',
  bankName: '',
  bankAccountNumber: '',
  bankAccountHolder: '',
};

/** Contoh W28 untuk `?state=validasi`: email duplikat dan jabatan kosong. */
const invalidSample: Values = {
  ...emptyValues,
  name: 'Putu Ayu Lestari',
  email: 'bagus@studiotigapagi.com',
  whatsapp: '0812 3456 7890',
  joinedAt: '05/10/2026',
  division: 'Design',
  employment: 'Kontrak',
  manager: 'I Komang Agus S.',
  baseSalary: '5.500.000',
  bankName: 'BCA',
  bankAccountHolder: 'Putu Ayu Lestari',
};

function valuesOf(employee: Employee): Values {
  return {
    ...emptyValues,
    name: employee.name,
    email: employee.email,
    whatsapp: employee.whatsapp ?? '',
    joinedAt: employee.joinedAt ?? '',
    position: employee.position,
    division: employee.division,
    employment: employee.employment,
    manager: employee.manager ?? '',
    role: employee.role,
    schedule: employee.schedule ?? '',
    location: employee.location ?? '',
    wfhWithoutApproval: employee.wfhWithoutApproval ?? false,
    baseSalary: employee.baseSalary ? formatThousands(employee.baseSalary) : '',
    bankName: employee.bankName ?? '',
    bankAccountNumber: employee.bankAccountNumber ?? '',
    bankAccountHolder: employee.bankAccountHolder ?? '',
  };
}

function validate(values: Values, others: Employee[]): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = 'Nama lengkap wajib diisi';
  const duplicate = others.find(
    (row) => row.email.toLowerCase() === values.email.trim().toLowerCase(),
  );
  if (!values.email.trim()) errors.email = 'Email kantor wajib diisi';
  else if (!isValidEmail(values.email)) errors.email = 'Masukkan email yang valid';
  else if (duplicate) errors.email = `Email sudah dipakai oleh ${duplicate.name}`;
  if (!values.position.trim()) errors.position = 'Jabatan wajib diisi';
  if (!values.division) errors.division = 'Divisi wajib diisi';
  if (!values.employment) errors.employment = 'Status kerja wajib diisi';
  return errors;
}

type EmployeeFormProps = {
  /** Kosong berarti tambah karyawan (W16); terisi berarti edit (W27). */
  id?: string;
  previewInvalid?: boolean;
  /** W88: toast gagal menyimpan; isian tetap di form. */
  previewSaveFailed?: boolean;
};

/** W16 · Tambah Karyawan, W27 · Edit Karyawan, W28 · Validasi, W88 · Gagal Disimpan */
export function EmployeeForm({
  id,
  previewInvalid = false,
  previewSaveFailed = false,
}: EmployeeFormProps) {
  const router = useRouter();
  const { employees, addEmployee, updateEmployee } = useEmployees();
  const { schedules, locations } = useScheduleLocations();
  const scheduleOptions = schedules.map(scheduleLabel);
  const locationOptions = locations.map((row) => row.name);
  const employee = employees.find((row) => row.id === id);
  if (id && !employee) notFound();

  const others = employees.filter((row) => row.id !== id);
  const newValues = previewInvalid ? invalidSample : emptyValues;
  const initialValues = employee
    ? valuesOf(employee)
    : { ...newValues, schedule: scheduleOptions[0] ?? '', location: locationOptions[0] ?? '' };

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Errors>(() =>
    previewInvalid ? validate(invalidSample, others) : {},
  );
  const errorCount = Object.values(errors).filter(Boolean).length;
  const [saveFailed, setSaveFailed] = useState(previewSaveFailed);

  const cancelHref = id ? `/data-karyawan/${id}` : '/data-karyawan';
  const managers = others.filter((row) => row.status !== 'nonaktif').map((row) => row.name);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  // MOCK: tersimpan di memori, dan undangan email belum benar-benar dikirim.
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validate(values, others);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const email = values.email.trim();
    const saved: Employee = {
      id: id ?? `${email.split('@')[0]}-${employees.length}`,
      status: employee?.status ?? 'diundang',
      name: values.name.trim(),
      email,
      position: values.position.trim(),
      division: values.division,
      employment: values.employment,
      role: values.role,
      whatsapp: values.whatsapp.trim() || undefined,
      joinedAt: values.joinedAt.trim() || undefined,
      manager: values.manager || undefined,
      schedule: values.schedule || undefined,
      location: values.location || undefined,
      wfhWithoutApproval: values.wfhWithoutApproval,
      baseSalary: parseRupiahInput(values.baseSalary),
      bankName: values.bankName.trim() || undefined,
      bankAccountNumber: values.bankAccountNumber.replace(/\s/g, '') || undefined,
      bankAccountHolder: values.bankAccountHolder.trim() || undefined,
    };

    if (id) {
      updateEmployee(saved);
      router.push(`/data-karyawan/${id}?state=disimpan`);
    } else {
      addEmployee(saved);
      router.push(`/data-karyawan?state=ditambahkan&email=${encodeURIComponent(email)}`);
    }
  }

  return (
    <main className={styles.main}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>{id ? 'Edit Data Karyawan' : 'Tambah Karyawan'}</h1>
            <p className={styles.subtitle}>
              {employee
                ? `${employee.name} · perubahan gaji & peran tercatat di log audit`
                : 'Data dipakai untuk absensi, payroll, dan hak akses'}
            </p>
          </div>
          <ButtonLink variant="secondary" compact href={cancelHref}>
            Batal
          </ButtonLink>
          <Button compact type="submit">
            {id ? 'Simpan perubahan' : 'Simpan & kirim undangan'}
          </Button>
        </header>

        {saveFailed && (
          <Toast
            tone="danger"
            title="Gagal menyimpan perubahan"
            onDismiss={() => setSaveFailed(false)}
          >
            Koneksi terputus. Isian kamu tetap di form, coba simpan lagi.
          </Toast>
        )}

        <div className={styles.columns}>
          <div className={styles.left}>
            {errorCount > 0 && (
              <Alert tone="danger" title={`${errorCount} data perlu diperbaiki`}>
                Periksa kolom bertanda merah, lalu simpan kembali.
              </Alert>
            )}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Data pribadi</h2>
              <div className={styles.fields}>
                <TextField
                  label="Nama lengkap *"
                  helper=" "
                  error={errors.name}
                  value={values.name}
                  onChange={(event) => set('name', event.target.value)}
                  autoComplete="off"
                />
                <TextField
                  label="Email kantor *"
                  helper={id ? 'Email login tidak bisa diubah' : 'Undangan login dikirim ke email ini'}
                  error={errors.email}
                  type="email"
                  readOnly={Boolean(id)}
                  value={values.email}
                  onChange={(event) => set('email', event.target.value)}
                  autoComplete="off"
                />
                <TextField
                  label="No. WhatsApp"
                  helper=" "
                  type="tel"
                  value={values.whatsapp}
                  onChange={(event) => set('whatsapp', event.target.value)}
                  autoComplete="off"
                />
                <TextField
                  label="Tanggal bergabung"
                  helper=" "
                  placeholder="DD/MM/YYYY"
                  value={values.joinedAt}
                  onChange={(event) => set('joinedAt', event.target.value)}
                  autoComplete="off"
                />
              </div>
            </section>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Pekerjaan</h2>
              <div className={styles.fields}>
                <TextField
                  label="Jabatan *"
                  helper=" "
                  error={errors.position}
                  value={values.position}
                  onChange={(event) => set('position', event.target.value)}
                  autoComplete="off"
                />
                <SelectField
                  label="Divisi *"
                  error={errors.division}
                  placeholder="Pilih divisi"
                  options={divisions}
                  value={values.division}
                  onChange={(event) => set('division', event.target.value)}
                />
                <SelectField
                  label="Status kerja *"
                  error={errors.employment}
                  placeholder="Pilih status kerja"
                  options={employments}
                  value={values.employment}
                  onChange={(event) => set('employment', event.target.value)}
                />
                <SelectField
                  label="Atasan langsung"
                  placeholder="Tidak ada"
                  options={managers}
                  value={values.manager}
                  onChange={(event) => set('manager', event.target.value)}
                />
              </div>
            </section>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Rekening bank</h2>
              <div className={`${styles.fields} ${styles.bankFields}`}>
                <TextField
                  label="Bank"
                  helper=" "
                  value={values.bankName}
                  onChange={(event) => set('bankName', event.target.value)}
                  autoComplete="off"
                />
                <TextField
                  label="No. rekening"
                  helper=" "
                  inputMode="numeric"
                  value={values.bankAccountNumber}
                  onChange={(event) => set('bankAccountNumber', event.target.value)}
                  autoComplete="off"
                />
                <TextField
                  label="Atas nama"
                  helper=" "
                  value={values.bankAccountHolder}
                  onChange={(event) => set('bankAccountHolder', event.target.value)}
                  autoComplete="off"
                />
              </div>
            </section>
          </div>
          <div className={styles.right}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Akses &amp; absensi</h2>
              <div className={styles.fields}>
                <SelectField
                  label="Peran *"
                  options={roles}
                  value={values.role}
                  onChange={(event) => set('role', event.target.value)}
                />
                <SelectField
                  label="Jadwal kerja"
                  placeholder="Belum diatur"
                  options={scheduleOptions}
                  value={values.schedule}
                  onChange={(event) => set('schedule', event.target.value)}
                />
                <SelectField
                  label="Lokasi absensi"
                  placeholder="Belum diatur"
                  options={locationOptions}
                  value={values.location}
                  onChange={(event) => set('location', event.target.value)}
                />
              </div>
              <Toggle
                label="Izinkan absensi WFH tanpa persetujuan"
                checked={values.wfhWithoutApproval}
                onChange={(event) => set('wfhWithoutApproval', event.target.checked)}
              />
            </section>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Gaji</h2>
              <div className={styles.fields}>
                <TextField
                  label="Gaji pokok (Rp)"
                  helper="Hanya terlihat HRD & CEO"
                  inputMode="numeric"
                  value={values.baseSalary}
                  onChange={(event) => set('baseSalary', event.target.value)}
                  autoComplete="off"
                />
              </div>
            </section>
          </div>
        </div>
      </form>
    </main>
  );
}
