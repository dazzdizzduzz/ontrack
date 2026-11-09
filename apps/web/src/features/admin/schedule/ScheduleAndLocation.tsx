'use client';

import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ChipButton } from '@/components/ui/Chip';
import { SelectField, TextField } from '@/components/ui/Field';
import { GeofenceMap } from '@/components/ui/GeofenceMap';
import { Toast } from '@/components/ui/Toast';
import { Toggle } from '@/components/ui/Toggle';
import { EmployeeSubNav } from '../employees/EmployeeSubNav';
import employeeStyles from '../employees/employees.module.css';
import {
  isEndAfterStart,
  sampleLocation,
  sampleSchedule,
  type OfficeLocation,
  type WorkSchedule,
} from './data';
import { LocationDrawer } from './LocationDrawer';
import { RadiusSlider, ScheduleFields } from './ScheduleFields';
import { ScheduleDrawer } from './ScheduleDrawer';
import { useScheduleLocations } from './ScheduleLocationsProvider';
import styles from './schedule.module.css';

export type SchedulePreview =
  | 'tambah-jadwal' // W31
  | 'tambah-lokasi' // W32
  | 'validasi' // W33
  | 'tersimpan' // W82
  | 'gagal' // W83
  | 'jadwal-ditambahkan' // W84
  | 'lokasi-ditambahkan' // W85
  | 'jadwal-gagal' // W86
  | 'beberapa-lokasi'; // W89

type DrawerName = 'jadwal' | 'lokasi';

type ToastMessage = { tone: 'success' | 'danger'; title: string; body: string };

const savedToast: ToastMessage = {
  tone: 'success',
  title: 'Pengaturan disimpan',
  body: 'Jadwal dan lokasi berlaku mulai absensi berikutnya.',
};

const failedToast: ToastMessage = {
  tone: 'danger',
  title: 'Gagal menyimpan pengaturan',
  body: 'Koneksi terputus. Perubahan belum tersimpan, coba simpan lagi.',
};

const scheduleAddedToast = (name: string, memberCount: number): ToastMessage => ({
  tone: 'success',
  title: 'Jadwal ditambahkan',
  body: `Jadwal "${name}" berlaku untuk ${memberCount} karyawan.`,
});

const locationAddedToast = (location: OfficeLocation): ToastMessage => ({
  tone: 'success',
  title: 'Lokasi ditambahkan',
  body: `"${location.name}" aktif dengan radius ${location.radiusMeters} m.`,
});

function initialToast(preview?: SchedulePreview): ToastMessage | null {
  if (preview === 'tersimpan') return savedToast;
  if (preview === 'gagal') return failedToast;
  if (preview === 'jadwal-ditambahkan') {
    return scheduleAddedToast(sampleSchedule.name, sampleSchedule.memberIds.length);
  }
  return preview === 'lokasi-ditambahkan' ? locationAddedToast(sampleLocation) : null;
}

const labelOf = (schedule: WorkSchedule) => `${schedule.name} (${schedule.memberCount} karyawan)`;

/**
 * W17 · Jadwal & Lokasi, W33 · Validasi, W82–W85 · Hasil simpan, W89 · Beberapa Lokasi.
 * Panel tambah jadwal (W31, W86) dan lokasi (W32) dibuka dari sini.
 */
export function ScheduleAndLocation({ preview }: { preview?: SchedulePreview }) {
  const { schedules, locations: storedLocations, saveSchedule, saveLocation } =
    useScheduleLocations();
  // Pratinjau W85/W89 menampilkan lokasi contoh tanpa menyimpannya ke data mock.
  const showSampleLocation =
    (preview === 'beberapa-lokasi' || preview === 'lokasi-ditambahkan') &&
    !storedLocations.some((row) => row.id === sampleLocation.id);
  const locations = showSampleLocation ? [...storedLocations, sampleLocation] : storedLocations;

  const [scheduleId, setScheduleId] = useState(schedules[0]?.id ?? '');
  const [locationId, setLocationId] = useState(
    preview === 'lokasi-ditambahkan' ? sampleLocation.id : (locations[0]?.id ?? ''),
  );
  const [invalid, setInvalid] = useState(preview === 'validasi');
  const [toast, setToast] = useState<ToastMessage | null>(() => initialToast(preview));
  const [drawer, setDrawer] = useState<DrawerName | null>(() => {
    if (preview === 'tambah-jadwal' || preview === 'jadwal-gagal') return 'jadwal';
    return preview === 'tambah-lokasi' ? 'lokasi' : null;
  });

  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, WorkSchedule>>(() =>
    preview === 'validasi' && schedules[0]
      ? { [schedules[0].id]: { ...schedules[0], end: '08.00' } }
      : {},
  );
  const [locationDrafts, setLocationDrafts] = useState<Record<string, OfficeLocation>>({});

  const baseSchedule = schedules.find((row) => row.id === scheduleId);
  const baseLocation = locations.find((row) => row.id === locationId);
  if (!baseSchedule || !baseLocation) return null;

  const schedule = scheduleDrafts[scheduleId] ?? baseSchedule;
  const location = locationDrafts[locationId] ?? baseLocation;
  const hasTimeError = invalid && !isEndAfterStart(schedule.start, schedule.end);

  const updateSchedule = (patch: Partial<WorkSchedule>) =>
    setScheduleDrafts((drafts) => ({ ...drafts, [scheduleId]: { ...schedule, ...patch } }));
  const updateLocation = (patch: Partial<OfficeLocation>) =>
    setLocationDrafts((drafts) => ({ ...drafts, [locationId]: { ...location, ...patch } }));

  // MOCK: tersimpan di memori selama belum ada API, jadi simpan selalu berhasil.
  // W83 (gagal) hanya tampil lewat `?state=gagal`.
  function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!isEndAfterStart(schedule.start, schedule.end)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    Object.values(scheduleDrafts).forEach(saveSchedule);
    Object.values(locationDrafts).forEach(saveLocation);
    if (showSampleLocation) saveLocation(locationDrafts[sampleLocation.id] ?? sampleLocation);
    setToast(savedToast);
  }

  return (
    <main className={employeeStyles.main}>
      <form className={employeeStyles.form} onSubmit={handleSave} noValidate>
        <header className={employeeStyles.header}>
          <div className={employeeStyles.titleBlock}>
            <h1 className={employeeStyles.title}>Jadwal &amp; Lokasi Absensi</h1>
            <p className={employeeStyles.subtitle}>
              Berlaku untuk seluruh tenant Studio Tigapagi · zona waktu WITA
            </p>
          </div>
          <Button compact type="submit">
            Simpan pengaturan
          </Button>
        </header>

        {toast && (
          <Toast tone={toast.tone} title={toast.title} onDismiss={() => setToast(null)}>
            {toast.body}
          </Toast>
        )}

        <EmployeeSubNav current="/data-karyawan/jadwal-lokasi" />

        <div className={styles.columns}>
          <section className={`${employeeStyles.card} ${styles.scheduleCard}`}>
            <div className={styles.cardHeader}>
              <h2 className={employeeStyles.cardTitle}>Jadwal kerja</h2>
              <Button variant="ghost" compact onClick={() => setDrawer('jadwal')}>
                Tambah jadwal
                <Image src="/icons/plus.svg" alt="" width={20} height={20} unoptimized />
              </Button>
            </div>
            {hasTimeError && (
              <Alert tone="danger" title="Pengaturan belum disimpan">
                Jam pulang harus lebih dari jam masuk.
              </Alert>
            )}
            <ScheduleSelect
              schedules={schedules.map((row) => scheduleDrafts[row.id] ?? row)}
              value={scheduleId}
              onChange={setScheduleId}
            />
            <ScheduleFields
              values={schedule}
              endError={hasTimeError ? 'Harus setelah jam masuk' : undefined}
              onChange={updateSchedule}
            />
            <Toggle
              label="Izinkan mode WFH / Dinas Luar dengan persetujuan atasan"
              checked={schedule.allowRemote}
              onChange={(event) => updateSchedule({ allowRemote: event.target.checked })}
            />
          </section>

          <section className={`${employeeStyles.card} ${styles.locationCard}`}>
            <div className={styles.cardHeader}>
              <h2 className={employeeStyles.cardTitle}>Lokasi kantor &amp; geofence</h2>
              <Button variant="ghost" compact onClick={() => setDrawer('lokasi')}>
                Tambah lokasi
                <Image src="/icons/plus.svg" alt="" width={20} height={20} unoptimized />
              </Button>
            </div>
            {/* W89: chip muncul saat ada lebih dari satu lokasi. */}
            {locations.length > 1 && (
              <div className={styles.locationChips} role="group" aria-label="Pilih lokasi">
                {locations.map((row) => (
                  <ChipButton
                    key={row.id}
                    showCheck={false}
                    selected={row.id === locationId}
                    onClick={() => setLocationId(row.id)}
                  >
                    {(locationDrafts[row.id] ?? row).name}
                  </ChipButton>
                ))}
              </div>
            )}
            <GeofenceMap radiusMeters={location.radiusMeters} />
            <TextField
              label="Alamat"
              helper=" "
              value={location.address}
              onChange={(event) => updateLocation({ address: event.target.value })}
              autoComplete="off"
            />
            <TextField
              label="Koordinat"
              helper="Isi koordinat atau pilih di peta"
              value={location.coordinates}
              onChange={(event) => updateLocation({ coordinates: event.target.value })}
              autoComplete="off"
            />
            <RadiusSlider
              value={location.radiusMeters}
              onChange={(radiusMeters) => updateLocation({ radiusMeters })}
            />
            <Toggle
              label="Wajib selfie saat clock-in"
              checked={location.selfieRequired}
              onChange={(event) => updateLocation({ selfieRequired: event.target.checked })}
            />
          </section>
        </div>
      </form>

      {drawer === 'jadwal' && (
        <ScheduleDrawer
          preview={preview === 'tambah-jadwal' || preview === 'jadwal-gagal'}
          previewFailed={preview === 'jadwal-gagal'}
          onClose={() => setDrawer(null)}
          onSaved={(name, memberCount) => {
            setDrawer(null);
            setToast(scheduleAddedToast(name, memberCount));
          }}
        />
      )}
      {drawer === 'lokasi' && (
        <LocationDrawer
          preview={preview === 'tambah-lokasi'}
          onClose={() => setDrawer(null)}
          onSaved={(saved) => {
            setDrawer(null);
            setLocationId(saved.id);
            setToast(locationAddedToast(saved));
          }}
        />
      )}
    </main>
  );
}

function ScheduleSelect({
  schedules,
  value,
  onChange,
}: {
  schedules: WorkSchedule[];
  value: string;
  onChange: (id: string) => void;
}) {
  const current = schedules.find((row) => row.id === value);

  return (
    <SelectField
      label="Jadwal"
      options={schedules.map(labelOf)}
      value={current ? labelOf(current) : ''}
      onChange={(event) =>
        onChange(schedules.find((row) => labelOf(row) === event.target.value)?.id ?? value)
      }
    />
  );
}
