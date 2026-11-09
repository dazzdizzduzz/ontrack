import { MAX_OVERTIME_MINUTES } from '@on-track/core';

/**
 * MOCK: pengajuan lembur contoh dari Figma W34. Nanti dibuat server saat karyawan clock-out
 * lebih dari 30 menit setelah jam pulang (M32 / KW14), lalu diambil lewat API.
 */
export type OvertimeStatus = 'menunggu' | 'disetujui' | 'ditolak';

export type OvertimeRequest = {
  id: string;
  name: string;
  /** Inisial avatar bila bukan huruf awal nama (Figma: "AR" untuk I Putu Ari D.). */
  initials?: string;
  /** Jabatan dari data karyawan F02; kosong bila karyawan tidak ada di data contoh. */
  position?: string;
  division: string;
  /** "01/10/2026" */
  date: string;
  /** Hari dan tanggal di W94: "Kamis, 01/10/2026". */
  longDate: string;
  /** Jam clock-in, bila ada di contoh Figma (W94). */
  clockIn?: string;
  /** Jarak lokasi clock-out ke titik kantor, dalam meter. */
  distance?: number;
  /** Riwayat keputusan di W94, terbaru di bawah. */
  history: { at: string; text: string }[];
  /** Jam pulang di jadwal dan jam clock-out: "17.00", "17:44". */
  scheduleEnd: string;
  clockOut: string;
  minutes: number;
  status: OvertimeStatus;
};

/** Disetujui di contoh W36. */
export const sampleApproveTarget: OvertimeRequest = {
  id: 'daze-0110',
  name: 'Dhais Alfa Rysy',
  position: 'Lead Graphic Designer',
  division: 'Design',
  date: '01/10/2026',
  longDate: 'Kamis, 01/10/2026',
  clockIn: '08:52',
  distance: 42,
  history: [{ at: '01/10 · 17:44', text: 'Pengajuan dibuat otomatis dari clock-out' }],
  scheduleEnd: '17.00',
  clockOut: '17:44',
  minutes: 44,
  status: 'menunggu',
};

/** Ditolak di contoh W35. */
export const sampleRejectTarget: OvertimeRequest = {
  id: 'khamdafa-3009',
  name: 'Khamdafa W.',
  position: 'Graphic Designer',
  division: 'Design',
  date: '30/09/2026',
  longDate: 'Rabu, 30/09/2026',
  history: [{ at: '30/09 · 19:10', text: 'Pengajuan dibuat otomatis dari clock-out' }],
  scheduleEnd: '17.00',
  clockOut: '19:10',
  minutes: 130,
  status: 'menunggu',
};

export const sampleOvertime: OvertimeRequest[] = [
  sampleApproveTarget,
  sampleRejectTarget,
  { id: 'putu-2909', name: 'I Putu Ari D.', initials: 'AR', division: 'Developer', date: '29/09/2026', longDate: 'Selasa, 29/09/2026', scheduleEnd: '17.00', clockOut: '18:05', minutes: 65, status: 'menunggu', history: [{ at: '29/09 · 18:05', text: 'Pengajuan dibuat otomatis dari clock-out' }] },
  { id: 'made-2609', name: 'Made Nandana P.', division: 'Developer', date: '26/09/2026', longDate: 'Sabtu, 26/09/2026', scheduleEnd: '17.00', clockOut: '20:00', minutes: 180, status: 'disetujui', history: [{ at: '26/09 · 20:00', text: 'Pengajuan dibuat otomatis dari clock-out' }] },
];

/** Pilihan divisi di W95, urut seperti Figma. */
export const overtimeDivisions = ['Design', 'Developer', 'Marketing', 'Finance', 'Manajemen'];

/** Penyetuju contoh: pengguna yang login di W34 (Figma). */
export const sampleApprover = 'Ananda Sartana (Owner)';

/** Jam keputusan contoh W94 ("01/10 · 18:10"). */
export const sampleDecisionAt = '01/10 · 18:10';

/** Periode contoh di subjudul W34. */
export const samplePeriod = 'Oktober 2026';

export const statusBadges: Record<OvertimeStatus, { tone: 'warning' | 'success' | 'danger'; label: string }> = {
  menunggu: { tone: 'warning', label: 'Menunggu' },
  disetujui: { tone: 'success', label: 'Disetujui' },
  ditolak: { tone: 'danger', label: 'Ditolak' },
};

/** W34: "44 mnt", "1 j 05 m", dan "3 j (batas)" untuk lembur yang mencapai batas harian. */
export function overtimeCell(minutes: number): string {
  if (minutes < 60) return `${minutes} mnt`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const label = rest === 0 ? `${hours} j` : `${hours} j ${String(rest).padStart(2, '0')} m`;
  return minutes >= MAX_OVERTIME_MINUTES ? `${label} (batas)` : label;
}

/** Durasi dalam kalimat, seperti W35 ("2 j 10 m") dan toast W36 ("44 menit"). */
export function overtimeText(minutes: number): string {
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} j` : `${hours} j ${rest} m`;
}
