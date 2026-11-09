'use client';

import { formatClock, formatDistance, formatDuration } from '@on-track/core';
import Image from 'next/image';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import styles from '../BerandaKaryawan.module.css';
import { ClockInDialog } from './ClockInDialog';
import {
  clockOutAt,
  overtimeLabel,
  recordAt,
  sampleClockIn,
  sampleClockOutTime,
  sampleEarlyClockOutTime,
  statusLabel,
  TENANT_TIME_ZONE,
  type WebClockInRecord,
  type WebClockInScenario,
  type WebClockOutRecord,
} from './data';
import { useNow } from './useNow';

export type ClockInPreview =
  | 'clock-in' // KW11
  | 'berhasil' // KW12
  | 'ditolak' // KW13
  | 'kurang-akurat' // KW27
  | 'clock-out' // KW14
  | 'clock-out-berhasil' // KW15
  | 'pulang-cepat'; // KW26

/** Dialog yang terbuka: contoh Figma, atau 'perangkat' untuk lokasi browser sungguhan. */
type OpenDialog = {
  mode: 'in' | 'out';
  scenario: WebClockInScenario | 'perangkat';
  previewTime?: string;
};

const sampleRecord = () => recordAt(sampleClockIn.time);

/** Badge kartu setelah clock-out (KW15): lembur, pulang cepat, atau status clock-in. */
function clockOutBadge(out: WebClockOutRecord, clockIn: WebClockInRecord) {
  if (out.overtimeMinutes > 0) {
    return <Badge tone="warning">{`Lembur ${overtimeLabel(out.overtimeMinutes)} · Menunggu`}</Badge>;
  }
  if (out.earlyMinutes > 0) {
    return <Badge tone="warning">{`Pulang cepat · ${formatDuration(out.earlyMinutes)}`}</Badge>;
  }
  return (
    <Badge tone={clockIn.status.status === 'hadir' ? 'success' : 'warning'}>
      {statusLabel(clockIn)}
    </Badge>
  );
}

function clockOutToast(out: WebClockOutRecord) {
  const total = `Total ${formatDuration(out.workedMinutes)}`;
  if (out.overtimeMinutes > 0) {
    return `${total} · lembur ${out.overtimeMinutes} menit menunggu persetujuan Team Lead.`;
  }
  if (out.earlyMinutes > 0) {
    return `${total} · tercatat Pulang Cepat ${formatDuration(out.earlyMinutes)}.`;
  }
  return `${total} · tidak ada lembur.`;
}

/**
 * Kartu absensi KW08 → dialog KW11/KW13 → kartu dan toast KW12 → dialog KW14 → kartu dan
 * toast KW15. Jam mengikuti perangkat. Lokasi hanya dibaca saat dialog dibuka.
 */
export function ClockInCard({ preview }: { preview?: ClockInPreview }) {
  const now = useNow();
  const [record, setRecord] = useState<WebClockInRecord | null>(() =>
    preview === 'berhasil' ||
    preview === 'clock-out' ||
    preview === 'clock-out-berhasil' ||
    preview === 'pulang-cepat'
      ? sampleRecord()
      : null,
  );
  const [out, setOut] = useState<WebClockOutRecord | null>(() =>
    preview === 'clock-out-berhasil'
      ? clockOutAt(sampleRecord(), sampleClockOutTime, { distance: 40, accuracy: 20 })
      : null,
  );
  const [toast, setToast] = useState<'in' | 'out' | null>(() => {
    if (preview === 'berhasil') return 'in';
    return preview === 'clock-out-berhasil' ? 'out' : null;
  });
  const [dialog, setDialog] = useState<OpenDialog | null>(() => {
    if (preview === 'clock-in') return { mode: 'in', scenario: 'dalam-area' };
    if (preview === 'ditolak') return { mode: 'in', scenario: 'luar-area' };
    if (preview === 'kurang-akurat') return { mode: 'in', scenario: 'gps-lemah' };
    if (preview === 'pulang-cepat') {
      return { mode: 'out', scenario: 'dalam-area', previewTime: sampleEarlyClockOutTime };
    }
    return preview === 'clock-out' ? { mode: 'out', scenario: 'dalam-area' } : null;
  });

  function handleClockIn(next: WebClockInRecord) {
    setRecord(next);
    setDialog(null);
    setToast('in');
  }

  function handleClockOut(next: WebClockOutRecord) {
    setOut(next);
    setDialog(null);
    setToast('out');
  }

  const hadir = record?.status.status === 'hadir';
  const scenario = (open: OpenDialog) => (open.scenario === 'perangkat' ? undefined : open.scenario);
  // Pratinjau memakai jam contoh Figma; selain itu jam perangkat ("--:--" sesaat saat hidrasi).
  const clock = preview ? sampleClockIn.time : now ? formatClock(now, TENANT_TIME_ZONE) : '--:--';

  return (
    <section aria-label="Absensi hari ini" className={styles.clockCard}>
      <div className={styles.clockTop}>
        <p className={styles.clockStatus}>
          {out && record
            ? `Sudah clock-out · ${record.time} – ${out.time} · total ${formatDuration(out.workedMinutes)}`
            : record
              ? `Sudah clock-in · ${record.time} WITA · ${sampleClockIn.office}`
              : 'Belum clock-in hari ini'}
        </p>
        {out && record ? (
          clockOutBadge(out, record)
        ) : (
          // KW08: badge disembunyikan selama belum clock-in.
          record && <Badge tone={hadir ? 'success' : 'warning'}>{statusLabel(record)}</Badge>
        )}
      </div>
      <p className={styles.clock}>{out?.time ?? record?.time ?? clock}</p>
      <div className={styles.geofence}>
        <Image src="/icons/pin.svg" alt="" width={20} height={20} unoptimized />
        <div className={styles.geofenceText}>
          <p className={styles.geofenceTitle}>
            {out
              ? `Dalam radius kantor · ${formatDistance(out.distance)}`
              : record
                ? `Dalam radius kantor · ${formatDistance(record.distance)}`
                : 'Lokasi dicek saat Clock In'}
          </p>
          <p className={styles.geofenceDetail}>
            {out
              ? `Lokasi dari browser · akurasi ±${out.accuracy} m`
              : record
              ? `Lokasi dari browser · akurasi ±${record.accuracy} m · selfie tersimpan`
              : `${sampleClockIn.office} · radius ${sampleClockIn.radiusMeters} m`}
          </p>
        </div>
      </div>
      <div>
        {out ? (
          <ButtonLink variant="secondary" href="/karyawan/absensi">
            Lihat riwayat absensi
            <Image src="/icons/arrow-right.svg" alt="" width={20} height={20} unoptimized />
          </ButtonLink>
        ) : record ? (
          <Button variant="secondary" onClick={() => setDialog({ mode: 'out', scenario: 'perangkat' })}>
            Clock Out
            <Image src="/icons/arrow-right.svg" alt="" width={20} height={20} unoptimized />
          </Button>
        ) : (
          <Button variant="accent" onClick={() => setDialog({ mode: 'in', scenario: 'perangkat' })}>
            Clock In
            <Image src="/icons/arrow-right.svg" alt="" width={20} height={20} unoptimized />
          </Button>
        )}
      </div>

      {dialog?.mode === 'in' && (
        <ClockInDialog
          scenario={scenario(dialog)}
          onClose={() => setDialog(null)}
          onClockIn={handleClockIn}
        />
      )}
      {dialog?.mode === 'out' && record && (
        <ClockInDialog
          mode="out"
          clockIn={record}
          scenario={scenario(dialog)}
          previewTime={dialog.previewTime}
          onClose={() => setDialog(null)}
          onClockOut={handleClockOut}
        />
      )}
      {toast === 'out' && out && (
        <Toast
          tone="success"
          title={out.earlyMinutes > 0 ? 'Clock-out tercatat' : 'Clock-out berhasil'}
          onDismiss={() => setToast(null)}
        >
          {clockOutToast(out)}
        </Toast>
      )}
      {toast === 'in' && record && (
        <Toast tone="success" title="Clock-in berhasil" onDismiss={() => setToast(null)}>
          {record.time} WITA · {hadir ? 'Hadir tepat waktu' : statusLabel(record)} · selfie
          tersimpan terenkripsi.
        </Toast>
      )}
    </section>
  );
}
