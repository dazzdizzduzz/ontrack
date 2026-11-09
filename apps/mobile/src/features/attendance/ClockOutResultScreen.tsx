import { formatDistance, formatDuration, formatShortDuration } from '@on-track/core';

import { Badge } from '@/components/ui/Badge';
import { useAttendance } from './AttendanceProvider';
import { AttendanceResult, type ResultRow } from './AttendanceResult';
import {
  clockOutRecordFor,
  clockOutSamples,
  sampleClockIn,
  sampleOffice,
  sampleSchedule,
  type ClockOutRecord,
} from './data';

export type ClockOutPreview = 'lembur' | 'tepat-waktu' | 'pulang-cepat';

/** "44 mnt" seperti M14; lembur satu jam atau lebih memakai format jam ("1 j 20 m"). */
const overtimeLabel = (minutes: number) => (minutes < 60 ? `${minutes} mnt` : formatDuration(minutes));

function StatusBadge({ record }: { record: ClockOutRecord }) {
  if (record.earlyMinutes > 0) {
    return <Badge tone="warning" label={`Pulang cepat · ${formatDuration(record.earlyMinutes)}`} />;
  }
  if (record.clockInStatus.status === 'terlambat') {
    return (
      <Badge tone="warning" label={`Terlambat · ${formatShortDuration(record.clockInStatus.lateMinutes)}`} />
    );
  }
  return <Badge tone="success" label="Hadir · Tepat waktu" />;
}

function noteFor(record: ClockOutRecord): string {
  if (record.earlyMinutes > 0) {
    return 'Pulang cepat tercatat di rekap kehadiran beserta catatanmu. Ajukan izin jika keperluan mendesak.';
  }
  if (record.overtimeMinutes > 0) {
    return `Lembur lebih dari 30 menit setelah ${sampleSchedule.end} dikirim ke Team Lead untuk disetujui (US-03).`;
  }
  return 'Jam kerja hari ini sudah tercatat. Sampai jumpa besok.';
}

/**
 * M14 · Clock Out Berhasil (lembur menunggu), M50 · Tepat Waktu (tanpa lembur), dan
 * M33 · Tercatat Pulang Cepat. `preview` dipakai lewat `?state=`.
 */
export function ClockOutResultScreen({ preview }: { preview?: ClockOutPreview }) {
  const { clockOut } = useAttendance();
  const fallback = clockOutSamples[preview ?? 'lembur'];
  const record =
    (!preview && clockOut) ||
    clockOutRecordFor(sampleClockIn, fallback.time, fallback.distance, fallback.note);
  const early = record.earlyMinutes > 0;

  const rows: ResultRow[] = [
    { label: 'Status', value: <StatusBadge record={record} /> },
    { label: 'Total kerja', value: formatDuration(record.workedMinutes) },
    { label: 'Jam', value: `${record.clockInTime} – ${record.time}` },
    { label: 'Lokasi', value: `${sampleOffice.name} · ${formatDistance(record.distance)}` },
  ];
  // M50 tidak menampilkan baris Lembur; M33 tetap menampilkannya sebagai "Tidak ada".
  if (record.overtimeMinutes > 0) {
    rows.push({
      label: 'Lembur',
      value: <Badge tone="warning" label={`${overtimeLabel(record.overtimeMinutes)} · Menunggu`} />,
    });
  } else if (early) {
    rows.push({ label: 'Lembur', value: <Badge tone="neutral" label="Tidak ada" /> });
  }

  return (
    <AttendanceResult
      tone={early ? 'warning' : 'success'}
      title={early ? 'Clock-out tercatat' : 'Clock-out berhasil'}
      subtitle={`${record.date} · ${record.time} WITA`}
      rows={rows}
      note={noteFor(record)}
    />
  );
}
