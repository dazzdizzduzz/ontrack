'use client';

import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { TextField } from '@/components/ui/Field';
import { GeofenceMap } from '@/components/ui/GeofenceMap';
import { Toggle } from '@/components/ui/Toggle';
import { sampleLocation, type OfficeLocation } from './data';
import { RadiusSlider } from './ScheduleFields';
import { useScheduleLocations } from './ScheduleLocationsProvider';

const emptyLocation: Omit<OfficeLocation, 'id'> = {
  name: '',
  address: '',
  coordinates: '',
  radiusMeters: 100,
  selfieRequired: true,
};

type LocationDrawerProps = {
  preview?: boolean;
  onClose: () => void;
  onSaved: (location: OfficeLocation) => void;
};

/** W32 · Tambah Lokasi Kantor */
export function LocationDrawer({ preview = false, onClose, onSaved }: LocationDrawerProps) {
  const { locations, saveLocation } = useScheduleLocations();
  const [values, setValues] = useState(preview ? sampleLocation : emptyLocation);
  const [submitted, setSubmitted] = useState(false);

  const set = (patch: Partial<OfficeLocation>) => setValues((current) => ({ ...current, ...patch }));
  const nameError = submitted && !values.name.trim() ? 'Nama lokasi wajib diisi' : undefined;

  // MOCK: tersimpan di memori selama belum ada API.
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!values.name.trim()) return;
    const location = { ...values, id: `lokasi-${locations.length + 1}`, name: values.name.trim() };
    saveLocation(location);
    onSaved(location);
  }

  return (
    <Drawer
      title="Tambah lokasi kantor"
      onClose={onClose}
      onSubmit={handleSubmit}
      actions={
        <>
          <Button variant="secondary" compact onClick={onClose}>
            Batal
          </Button>
          <Button compact type="submit">
            Simpan lokasi
            <Image src="/icons/check-inverse-20.svg" alt="" width={20} height={20} unoptimized />
          </Button>
        </>
      }
    >
      <TextField
        label="Nama lokasi *"
        helper=" "
        error={nameError}
        value={values.name}
        onChange={(event) => set({ name: event.target.value })}
        autoComplete="off"
      />
      <GeofenceMap radiusMeters={values.radiusMeters} />
      <TextField
        label="Alamat"
        helper=" "
        value={values.address}
        onChange={(event) => set({ address: event.target.value })}
        autoComplete="off"
      />
      <TextField
        label="Koordinat"
        helper="Isi koordinat atau pilih di peta"
        value={values.coordinates}
        onChange={(event) => set({ coordinates: event.target.value })}
        autoComplete="off"
      />
      <RadiusSlider
        value={values.radiusMeters}
        onChange={(radiusMeters) => set({ radiusMeters })}
      />
      <Toggle
        label="Wajib selfie saat clock-in"
        checked={values.selfieRequired}
        onChange={(event) => set({ selfieRequired: event.target.checked })}
      />
    </Drawer>
  );
}
