'use client';

import { formatRupiah } from '@on-track/core';
import { notFound, useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { TextareaField } from '@/components/ui/Field';
import { Toast } from '@/components/ui/Toast';
import { maskedBankAccount, statusBadges, type Employee } from './data';
import { useEmployees } from './EmployeesProvider';
import styles from './employees.module.css';

const EMPTY = '–';
const REASON_MAX = 200;

/** Contoh W90–W92 dari Figma: Dhais nonaktif sejak 01/11/2026. */
const SAMPLE_INACTIVE_SINCE = '01/11/2026';

export type DetailPreview =
  | 'nonaktifkan' // W29
  | 'disimpan' // W87
  | 'nonaktif' // W90
  | 'aktifkan' // W91
  | 'diaktifkan'; // W92

type DialogName = 'nonaktifkan' | 'aktifkan';
type ToastName = 'disimpan' | 'diaktifkan';

function Item({ label, value }: { label: string; value?: string }) {
  return (
    <div className={styles.kv}>
      <dt className={styles.kvLabel}>{label}</dt>
      <dd className={styles.kvValue}>{value || EMPTY}</dd>
    </div>
  );
}

function subtitleOf(employee: Employee) {
  const parts = [employee.position, employee.division];
  if (employee.status === 'nonaktif') {
    parts.push(employee.inactiveSince ? `Nonaktif sejak ${employee.inactiveSince}` : 'Nonaktif');
  } else if (employee.joinedAt) {
    parts.push(`Bergabung ${employee.joinedAt}`);
  }
  return parts.join(' · ');
}

type EmployeeDetailProps = {
  id: string;
  preview?: DetailPreview;
  /** Dari menu aksi W81: buka dialog nonaktifkan dengan alasan kosong. */
  openDeactivate?: boolean;
};

/**
 * W26 · Detail Karyawan, W29 · Nonaktifkan, W87 · Perubahan Disimpan,
 * W90 · Nonaktif, W91 · Aktifkan Kembali, W92 · Diaktifkan Kembali
 */
export function EmployeeDetail({ id, preview, openDeactivate = false }: EmployeeDetailProps) {
  const router = useRouter();
  const { employees, deactivateEmployee, reactivateEmployee } = useEmployees();
  // Pratinjau W90/W91 menampilkan karyawan sebagai nonaktif tanpa mengubah data mock.
  const [previewInactive, setPreviewInactive] = useState(
    preview === 'nonaktif' || preview === 'aktifkan',
  );
  const [dialog, setDialog] = useState<DialogName | null>(() => {
    if (preview === 'nonaktifkan' || openDeactivate) return 'nonaktifkan';
    return preview === 'aktifkan' ? 'aktifkan' : null;
  });
  const [toast, setToast] = useState<ToastName | null>(() =>
    preview === 'disimpan' || preview === 'diaktifkan' ? preview : null,
  );
  const [reason, setReason] = useState(
    preview === 'nonaktifkan' ? 'Kontrak kerja berakhir 31/10/2026.' : '',
  );
  const [submitted, setSubmitted] = useState(false);

  const stored = employees.find((row) => row.id === id);
  if (!stored) notFound();
  const employee: Employee = previewInactive
    ? { ...stored, status: 'nonaktif', inactiveSince: SAMPLE_INACTIVE_SINCE }
    : stored;

  const inactive = employee.status === 'nonaktif';
  const badge = statusBadges[employee.status];
  const reasonMissing = reason.trim().length === 0;

  function closeDialog() {
    setDialog(null);
    setSubmitted(false);
  }

  function handleDeactivate(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (reasonMissing) return;
    // MOCK: alasan belum dikirim karena belum ada API.
    deactivateEmployee(id);
    closeDialog();
  }

  function handleReactivate(event: FormEvent) {
    event.preventDefault();
    // MOCK: tersimpan di memori selama belum ada API.
    setPreviewInactive(false);
    reactivateEmployee(id);
    setDialog(null);
    setToast('diaktifkan');
  }

  return (
    <main className={styles.main}>
      <ButtonLink variant="ghost" compact href="/data-karyawan" className={styles.back}>
        Kembali ke daftar karyawan
      </ButtonLink>

      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{employee.name}</h1>
            <Badge tone={badge.tone}>{badge.label}</Badge>
          </div>
          <p className={styles.subtitle}>{subtitleOf(employee)}</p>
        </div>
        {inactive ? (
          <Button compact onClick={() => setDialog('aktifkan')}>
            Aktifkan kembali
          </Button>
        ) : (
          <>
            <Button variant="secondary" compact onClick={() => setDialog('nonaktifkan')}>
              Nonaktifkan
            </Button>
            <Button compact onClick={() => router.push(`/data-karyawan/${id}/edit`)}>
              Edit data
            </Button>
          </>
        )}
      </header>

      {toast === 'disimpan' && (
        <Toast tone="success" title="Perubahan disimpan" onDismiss={() => setToast(null)}>
          Data {employee.name} sudah diperbarui.
        </Toast>
      )}
      {toast === 'diaktifkan' && (
        <Toast tone="success" title="Karyawan diaktifkan kembali" onDismiss={() => setToast(null)}>
          {employee.name} bisa login dan absen lagi.
        </Toast>
      )}

      <div className={styles.columns}>
        <div className={styles.left}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Data pribadi</h2>
            <dl className={styles.fields}>
              <Item label="Nama lengkap" value={employee.name} />
              <Item label="Email kantor" value={employee.email} />
              <Item label="No. WhatsApp" value={employee.whatsapp} />
              <Item label="Tanggal bergabung" value={employee.joinedAt} />
            </dl>
          </section>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Pekerjaan</h2>
            <dl className={styles.fields}>
              <Item label="Jabatan" value={employee.position} />
              <Item label="Divisi" value={employee.division} />
              <Item label="Status kerja" value={employee.employment} />
              <Item label="Atasan langsung" value={employee.manager} />
            </dl>
          </section>
        </div>
        <div className={styles.right}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Akses &amp; absensi</h2>
            <dl className={styles.fields}>
              <Item label="Peran" value={employee.role} />
              <Item label="Jadwal kerja" value={employee.schedule} />
              <Item label="Lokasi absensi" value={employee.location} />
              <Item
                label="Absensi WFH / Dinas Luar"
                value={employee.wfhWithoutApproval ? 'Tanpa persetujuan' : 'Perlu persetujuan atasan'}
              />
            </dl>
          </section>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Gaji</h2>
            <dl className={styles.fields}>
              <Item
                label="Gaji pokok (Rp)"
                value={employee.baseSalary && formatRupiah(employee.baseSalary)}
              />
              <Item label="Rekening bank" value={maskedBankAccount(employee)} />
            </dl>
          </section>
        </div>
      </div>

      {dialog === 'nonaktifkan' && (
        <Dialog
          title={`Nonaktifkan ${employee.name}?`}
          description="Karyawan tidak bisa login dan tidak dihitung di absensi & payroll periode berikutnya. Riwayat data tetap tersimpan."
          onClose={closeDialog}
          onSubmit={handleDeactivate}
          actions={
            <>
              <Button variant="secondary" compact onClick={closeDialog}>
                Batal
              </Button>
              <Button variant="danger" compact type="submit">
                Nonaktifkan
              </Button>
            </>
          }
        >
          <TextareaField
            label="Alasan"
            helper="Wajib diisi"
            error={submitted && reasonMissing ? 'Wajib diisi' : undefined}
            maxLength={REASON_MAX}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            autoFocus
          />
        </Dialog>
      )}

      {dialog === 'aktifkan' && (
        <Dialog
          title={`Aktifkan kembali ${employee.name}?`}
          description="Karyawan bisa login dan absen lagi, serta dihitung di payroll mulai periode berikutnya."
          onClose={closeDialog}
          onSubmit={handleReactivate}
          actions={
            <>
              <Button variant="secondary" compact onClick={closeDialog}>
                Batal
              </Button>
              <Button type="submit">Aktifkan kembali</Button>
            </>
          }
        />
      )}
    </main>
  );
}
