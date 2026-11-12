import { formatDistance, formatShortDuration } from '@on-track/core';

import { Badge } from '@/components/ui/Badge';
import { useAttendance } from './AttendanceProvider';
import { AttendanceResult } from './AttendanceResult';
import {
  recordFor,
  sampleOffice,
  sampleSchedule,
  scenarioSamples,
  scheduleLabel,
  type ClockInRecord,
} from './data';

/**
 * M04 · Clock In Berhasil (Hadir), M28 · Terlambat, dan M51 · Terlambat Lama ("6 j 19 m").
 * `preview` dipakai lewat `?state=`.
 */
export function ClockInResultScreen({ preview }: { preview?: 'terlambat' | 'terlambat-lama' }) {
  const { clockIn } = useAttendance();
  const fallback = scenarioSamples[preview ?? 'dalam-area'];
  const record: ClockInRecord = (!preview && clockIn) || recordFor(fallback.time, fallback.distance);
  const late = record.status.status === 'terlambat' ? formatShortDuration(record.status.lateMinutes) : null;

  return (
    <AttendanceResult
      tone={late === null ? 'success' : 'warning'}
      title={late === null ? 'Clock-in berhasil' : 'Clock-in tercatat'}
      subtitle={`${record.date} · ${record.time} WITA`}
      rows={[
        {
          label: 'Status',
          value:
            late === null ? (
              <Badge tone="success" label="Hadir · Tepat waktu" />
            ) : (
              <Badge tone="warning" label={`Terlambat · ${late}`} />
            ),
        },
        { label: 'Lokasi', value: sampleOffice.name },
        { label: 'Jarak', value: `${formatDistance(record.distance)} dari titik kantor` },
        { label: 'Jam kerja', value: scheduleLabel },
        { label: 'Selfie', value: record.queued ? 'Tersimpan di HP · terenkripsi' : 'Tersimpan · terenkripsi' },
        ...(record.queued ? [{ label: 'Pengiriman', value: 'Menunggu koneksi · terkirim otomatis' }] : []),
      ]}
      note={
        late === null
          ? `Jangan lupa clock-out sebelum pulang. Lembur dihitung jika clock-out lebih dari 30 menit setelah ${sampleSchedule.end}.`
          : `Jam masuk ${sampleSchedule.start} + toleransi ${sampleSchedule.toleranceMinutes} menit. Keterlambatan ${late} tercatat di rekap kehadiran dan payroll.`
      }
    />
  );
}
