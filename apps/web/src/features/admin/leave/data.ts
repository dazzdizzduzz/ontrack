import type { LeaveStatus, LeaveType } from '@on-track/core';

/**
 * MOCK: pengajuan izin contoh dari Figma W03/W40. Nanti diambil dari GET /leave-requests dan
 * /leave-requests/{id} (draf F07 di docs/openapi.yaml).
 */
export type ApprovalRequest = {
  id: string;
  name: string;
  /** Inisial avatar; W03 memakai "IP" untuk I Putu Ari D. */
  initials?: string;
  /** Id di rekap kehadiran (W37/W44), bila ada. */
  employeeId?: string;
  position: string;
  division: string;
  /** Atasan langsung yang tampil di subjudul drawer W40. */
  supervisor: string;
  type: LeaveType;
  start: string;
  end: string;
  days: number;
  reason: string;
  /** "30/09/2026 · 16:20" */
  submittedAt: string;
  attachment?: string;
  status: LeaveStatus;
  /** Dampak bila disetujui (W40). Kuota hanya untuk cuti tahunan. */
  quotaBefore?: number;
  colleaguesOnLeave: string[];
  tasksDue: { title: string; due: string }[];
  decision?: { at: string; by: string; note?: string };
};

export const sampleApprover = 'Ananda Sartana';

/** Jam keputusan contoh W41/W44 ("01/10/2026 14:05"). */
export const sampleDecisionAt = '01/10/2026 · 14:05';

export const samplePeriod = 'Oktober 2026';

/** Catatan contoh di textarea W40 (58/200). */
export const sampleApproveNote = 'Selamat menjalankan upacara, pastikan handover task ke Ari.';

/** Alasan contoh W04 (48/200) dan W45 (72/200). */
export const sampleRejectReasons = {
  khamdafa: 'Mohon lampirkan surat dokter, lalu ajukan ulang.',
  made: 'Bentrok dengan rilis aplikasi 07/10.\nMohon geser ke minggu berikutnya.',
};

export const sampleRequests: ApprovalRequest[] = [
  {
    id: 'khamdafa-0210',
    name: 'Khamdafa W.',
    position: 'Graphic Designer',
    division: 'Design',
    supervisor: 'I Komang Agus S.',
    type: 'sakit',
    start: '2026-10-02',
    end: '2026-10-02',
    days: 1,
    reason: 'Demam sejak semalam',
    submittedAt: '02/10/2026 · 07:40',
    status: 'menunggu',
    colleaguesOnLeave: [],
    tasksDue: [],
  },
  {
    id: 'made-0610',
    name: 'Made Nandana P.',
    employeeId: 'made',
    position: 'Developer',
    division: 'Developer',
    supervisor: 'I Komang Agus S.',
    type: 'cuti',
    start: '2026-10-06',
    end: '2026-10-08',
    days: 3,
    reason: 'Pulang kampung, upacara adat di Tabanan',
    submittedAt: '30/09/2026 · 16:20',
    status: 'menunggu',
    quotaBefore: 9,
    colleaguesOnLeave: [],
    tasksDue: [{ title: 'Integrasi API absensi', due: '07/10' }],
  },
  {
    id: 'putu-0310',
    name: 'I Putu Ari D.',
    initials: 'IP',
    position: 'Developer',
    division: 'Developer',
    supervisor: 'I Komang Agus S.',
    type: 'wfh',
    start: '2026-10-03',
    end: '2026-10-03',
    days: 1,
    reason: 'Menunggu teknisi internet di rumah',
    submittedAt: '01/10/2026 · 20:05',
    status: 'menunggu',
    colleaguesOnLeave: [],
    tasksDue: [],
  },
  {
    id: 'daze-2509',
    name: 'Dhais Alfa Rysy',
    employeeId: 'daze',
    position: 'Lead Graphic Designer',
    division: 'Design',
    supervisor: 'I Komang Agus S.',
    type: 'izin',
    start: '2026-09-25',
    end: '2026-09-25',
    days: 0.5,
    reason: 'Kontrol dokter gigi',
    submittedAt: '24/09/2026 · 10:02',
    attachment: 'surat-dokter.pdf',
    status: 'disetujui',
    colleaguesOnLeave: [],
    tasksDue: [],
    decision: { at: '24/09/2026 · 13:30', by: 'Ananda Sartana' },
  },
];

export const statusBadges: Record<LeaveStatus, { tone: 'warning' | 'success' | 'danger'; label: string }> = {
  menunggu: { tone: 'warning', label: 'Menunggu' },
  disetujui: { tone: 'success', label: 'Disetujui' },
  ditolak: { tone: 'danger', label: 'Ditolak' },
};

/** Jenis di kolom W03: "Cuti tahunan", "Sakit", "WFH", "Izin". */
export { leaveTypeLabels as typeLabels } from '@on-track/core';

/** Kata benda di judul dialog tolak: "Tolak cuti Made Nandana P.?" (W42). */
export const rejectNouns: Record<LeaveType, string> = {
  cuti: 'cuti',
  izin: 'izin',
  sakit: 'izin sakit',
  wfh: 'WFH',
};
