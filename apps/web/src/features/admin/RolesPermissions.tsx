'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Toast } from '@/components/ui/Toast';
import { EmployeeSubNav } from './employees/EmployeeSubNav';
import styles from './RolesPermissions.module.css';

const roles = ['Owner/CEO', 'HRD/Admin', 'Team Lead', 'Karyawan', 'Kasir'];

/** Matriks contoh dari Figma W18; urutan nilai mengikuti `roles`. Belum tersambung ke API. */
const initialMatrix = [
  { feature: 'Kelola karyawan & pengaturan', allowed: [true, true, false, false, false] },
  { feature: 'Absensi pribadi', allowed: [true, true, true, true, true] },
  { feature: 'Ajukan izin', allowed: [false, true, true, true, true] },
  { feature: 'Setujui izin', allowed: [true, true, true, false, false] },
  { feature: 'Buat & assign task', allowed: [true, false, true, false, false] },
  { feature: 'Update progres task', allowed: [true, true, true, true, false] },
  { feature: 'Payroll (kelola & lihat semua)', allowed: [true, true, false, false, false] },
  { feature: 'Lihat slip gaji sendiri', allowed: [true, true, true, true, true] },
  { feature: 'Transaksi kasir', allowed: [true, false, false, false, true] },
  { feature: 'Kelola inventori', allowed: [true, true, false, false, true] },
];

type Matrix = typeof initialMatrix;
type SavePreview = 'tersimpan' | 'gagal';
type SaveResult = { tone: 'success' | 'danger'; title: string; body: string };

const saveFailed: SaveResult = {
  tone: 'danger',
  title: 'Gagal menyimpan perubahan',
  body: 'Koneksi terputus. Perubahan belum tersimpan, coba simpan lagi.',
};

function saveSucceeded(before: Matrix, after: Matrix): SaveResult {
  const changed = roles.filter((_, c) =>
    before.some((row, r) => row.allowed[c] !== after[r]?.allowed[c]),
  );
  const subject = changed.length > 0 ? `Hak akses ${changed.join(', ')}` : 'Hak akses';
  return {
    tone: 'success',
    title: 'Perubahan disimpan',
    body: `${subject} diperbarui dan tercatat di audit log.`,
  };
}

/** Contoh W73/W74: Team Lead baru saja diberi akses Kelola inventori. */
const previewMatrix = initialMatrix.map((row) =>
  row.feature === 'Kelola inventori' ? { ...row, allowed: [true, true, true, false, true] } : row,
);

/** W18 · Peran & Hak Akses, W73 · Tersimpan, W74 · Gagal Disimpan */
export function RolesPermissions({ preview }: { preview?: SavePreview }) {
  const [matrix, setMatrix] = useState(preview ? previewMatrix : initialMatrix);
  const [savedMatrix, setSavedMatrix] = useState(
    preview === 'tersimpan' ? previewMatrix : initialMatrix,
  );
  const [result, setResult] = useState<SaveResult | null>(() => {
    if (preview === 'gagal') return saveFailed;
    return preview === 'tersimpan' ? saveSucceeded(initialMatrix, previewMatrix) : null;
  });

  // MOCK: belum ada API, jadi simpan selalu berhasil dan hilang saat halaman dimuat ulang.
  function handleSave() {
    setResult(saveSucceeded(savedMatrix, matrix));
    setSavedMatrix(matrix);
  }

  function toggle(rowIndex: number, roleIndex: number) {
    setMatrix((rows) =>
      rows.map((row, r) =>
        r === rowIndex
          ? { ...row, allowed: row.allowed.map((v, c) => (c === roleIndex ? !v : v)) }
          : row,
      ),
    );
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Peran &amp; Hak Akses</h1>
          <p className={styles.subtitle}>Perubahan tercatat di audit log</p>
        </div>
        <Button compact onClick={handleSave}>
          Simpan perubahan
        </Button>
      </header>

      {result && (
        <Toast tone={result.tone} title={result.title} onDismiss={() => setResult(null)}>
          {result.body}
        </Toast>
      )}

      <EmployeeSubNav current="/data-karyawan/peran-akses" />

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.featureHead}>
                Fitur
              </th>
              {roles.map((role) => (
                <th key={role} scope="col" className={styles.roleHead}>
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, rowIndex) => (
              <tr key={row.feature}>
                <th scope="row" className={styles.feature}>
                  {row.feature}
                </th>
                {row.allowed.map((allowed, roleIndex) => (
                  <td key={roles[roleIndex]} className={styles.cell}>
                    <Checkbox
                      hideLabel
                      label={`${row.feature} — ${roles[roleIndex]}`}
                      checked={allowed}
                      onChange={() => toggle(rowIndex, roleIndex)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
