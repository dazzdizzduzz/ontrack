import { isWeekend } from './attendanceHistory';

/** Jenis pengajuan F06. WFH hanya ada di riwayat contoh; formulir F06 memakai tiga jenis pertama. */
export type LeaveType = 'cuti' | 'izin' | 'sakit' | 'wfh';
export type LeaveStatus = 'menunggu' | 'disetujui' | 'ditolak';

export const leaveTypeLabels: Record<LeaveType, string> = {
  cuti: 'Cuti tahunan',
  izin: 'Izin',
  sakit: 'Sakit',
  wfh: 'WFH',
};

/** Jenis yang bisa dipilih di formulir (M38, KW18). */
export const formLeaveTypes: Exclude<LeaveType, 'wfh'>[] = ['cuti', 'izin', 'sakit'];

export type LeaveAttachment = { name: string; sizeBytes: number; kind: 'PDF' | 'JPG' };

export type LeaveRequest = {
  id: string;
  type: LeaveType;
  /** "2026-10-06" */
  start: string;
  end: string;
  /** Hari kerja; 0,5 untuk setengah hari. */
  days: number;
  reason: string;
  status: LeaveStatus;
  attachment?: LeaveAttachment;
  /** F07: waktu diajukan dan diputuskan, sudah dalam format tampilan "01/10/2026 · 09:12". */
  submittedAt?: string;
  decidedAt?: string;
  /** Atasan yang memutuskan. */
  decidedBy?: string;
  /** Catatan atasan saat menyetujui (M42) atau alasan penolakan (M43). */
  decisionNote?: string;
  /** MOCK: sisa kuota cuti setelah keputusan; nanti dari server. */
  quotaLeft?: number;
};

/** Label pendek di badge kehadiran (W44: "CUTI") dan teks "tercatat sebagai Cuti". */
export const leaveDayLabels: Record<LeaveType, string> = {
  cuti: 'Cuti',
  izin: 'Izin',
  sakit: 'Sakit',
  wfh: 'WFH',
};

export type LeaveQuota = {
  year: number;
  total: number;
  used: number;
  pending: number;
  /** "1 Januari 2027" */
  resetsOn: string;
};

/** Batas alasan (M05: "27/200") dan lampiran (FR-12: PDF atau JPG, maks. 5 MB). */
export const LEAVE_REASON_MAX = 200;
export const LEAVE_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;

const pad = (value: number) => String(value).padStart(2, '0');

/** "06/10/2026" -> "2026-10-06"; null bila format atau tanggalnya tidak valid. */
export function parseDateInput(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** "2026-10-06" -> "06/10/2026" */
export function formatDateInput(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

/** Hari kerja Senin–Jumat dari `start` sampai `end`, keduanya ikut dihitung. */
export function workingDaysBetween(start: string, end: string): number {
  if (end < start) return 0;
  let count = 0;
  const cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cursor <= last) {
    const iso = cursor.toISOString().slice(0, 10);
    if (!isWeekend(iso)) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

/** 0.5 -> "½ hari", 3 -> "3 hari". */
export const formatLeaveDays = (days: number) =>
  `${days === 0.5 ? '½' : String(days).replace('.', ',')} hari`;

/** "06–08/10/2026 · 3 hari", "25/09/2026 · ½ hari", "30/09–02/10/2026 · 3 hari" (M16, KW17). */
export function formatLeaveRange(request: Pick<LeaveRequest, 'start' | 'end' | 'days'>): string {
  const [sy, sm, sd] = request.start.split('-');
  const [ey, em, ed] = request.end.split('-');
  let range: string;
  if (request.start === request.end) range = `${sd}/${sm}/${sy}`;
  else if (sy === ey && sm === em) range = `${sd}–${ed}/${em}/${ey}`;
  else if (sy === ey) range = `${sd}/${sm}–${ed}/${em}/${ey}`;
  else range = `${sd}/${sm}/${sy}–${ed}/${em}/${ey}`;
  return `${range} · ${formatLeaveDays(request.days)}`;
}

/** "06–08/10" untuk toast KW19. */
export function formatLeaveRangeShort(request: Pick<LeaveRequest, 'start' | 'end'>): string {
  const [, sm, sd] = request.start.split('-');
  const [, em, ed] = request.end.split('-');
  if (request.start === request.end) return `${sd}/${sm}`;
  return sm === em ? `${sd}–${ed}/${em}` : `${sd}/${sm}–${ed}/${em}`;
}

export const remainingQuota = (quota: LeaveQuota) => quota.total - quota.used - quota.pending;

/** 1,2 MB / 820 KB, seperti M39. */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(Math.round((bytes / (1024 * 1024)) * 10) / 10).toLocaleString('id-ID')} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export type LeaveDraft = {
  type: Exclude<LeaveType, 'wfh'>;
  /** Isian tanggal "dd/mm/yyyy". */
  start: string;
  end: string;
  reason: string;
  attachment?: LeaveAttachment;
};

export type LeaveErrors = {
  /** Peringatan di atas formulir (M40, M18, KW20). */
  form?: { title: string; body: string };
  start?: string;
  end?: string;
  reason?: string;
  attachment?: string;
};

/**
 * Validasi pengajuan (FR-12, US-04 AC-2). Kuota hanya dipotong cuti tahunan; sakit lebih dari
 * 1 hari kerja wajib surat dokter. `checkRequired` false hanya memeriksa kuota (saat mengetik).
 */
export function validateLeave(
  draft: LeaveDraft,
  quota: LeaveQuota,
  { checkRequired = true } = {},
): { errors: LeaveErrors; days: number } {
  const errors: LeaveErrors = {};
  const start = parseDateInput(draft.start);
  const end = parseDateInput(draft.end);
  const days = start && end ? workingDaysBetween(start, end) : 0;

  if (checkRequired) {
    if (!start) errors.start = 'Format tanggal dd/mm/yyyy';
    if (!end) errors.end = 'Format tanggal dd/mm/yyyy';
    if (!start || !end) {
      errors.form = {
        title: 'Pengajuan belum bisa dikirim',
        body: 'Isi tanggal mulai dan selesai dengan format dd/mm/yyyy.',
      };
    }
  }
  if (start && end && end < start) errors.end = 'Tanggal selesai sebelum tanggal mulai';
  else if (start && end && days === 0) errors.end = 'Rentang ini hanya berisi akhir pekan';

  const remaining = remainingQuota(quota);
  if (draft.type === 'cuti' && days > remaining) {
    errors.end = `${days} hari > sisa kuota ${remaining} hari`;
    errors.form = {
      title: 'Kuota cuti tidak cukup',
      body: `Sisa kuota kamu ${remaining} hari${
        quota.pending > 0 ? ` (${quota.pending} hari masih menunggu persetujuan)` : ''
      }, sedangkan pengajuan ${days} hari. Kurangi tanggal atau pilih jenis Izin.`,
    };
  }
  if (checkRequired && !draft.reason.trim()) {
    errors.reason = 'Alasan wajib diisi';
    errors.form ??= {
      title: 'Pengajuan belum bisa dikirim',
      body: `Isi alasan ${leaveTypeLabels[draft.type].toLowerCase()} terlebih dahulu.`,
    };
  }
  if (checkRequired && draft.type === 'sakit' && days > 1 && !draft.attachment) {
    errors.attachment = 'Surat dokter wajib untuk sakit lebih dari 1 hari';
    errors.form ??= {
      title: 'Pengajuan belum bisa dikirim',
      body: 'Lampirkan surat dokter untuk sakit lebih dari 1 hari.',
    };
  }
  return { errors, days };
}

// ---------------------------------------------------------------------------------------------
// MOCK: data contoh Figma F06 (M16, KW17) sampai API pengajuan izin ada.

export const sampleLeaveQuota: LeaveQuota = {
  year: 2026,
  total: 12,
  used: 3,
  pending: 0,
  resetsOn: '1 Januari 2027',
};

/** Kuota hampir habis untuk contoh M18 dan KW20 (terpakai 10 dari 12). */
export const sampleLowLeaveQuota: LeaveQuota = { ...sampleLeaveQuota, used: 10 };

/** Atasan langsung yang menerima notifikasi (M05, M41). */
export const sampleLeaveApprover = { name: 'I Komang Agus S.', role: 'Team Lead' };

export const sampleLeaveRequests: LeaveRequest[] = [
  { id: 'sakit-2509', type: 'sakit', start: '2026-09-25', end: '2026-09-25', days: 0.5, reason: 'Kontrol dokter gigi', status: 'disetujui', submittedAt: '24/09/2026 · 10:02', decidedAt: '24/09/2026 · 13:30', decidedBy: 'I Komang Agus S.' },
  { id: 'wfh-1809', type: 'wfh', start: '2026-09-18', end: '2026-09-18', days: 1, reason: 'Alasan: deadline klien di kantor', status: 'ditolak', submittedAt: '17/09/2026 · 19:40', decidedAt: '17/09/2026 · 20:15', decidedBy: 'I Komang Agus S.', decisionNote: 'Presentasi klien harus dari kantor.' },
  { id: 'izin-0209', type: 'izin', start: '2026-09-02', end: '2026-09-02', days: 1, reason: 'Urusan administrasi bank', status: 'disetujui', submittedAt: '01/09/2026 · 08:20', decidedAt: '01/09/2026 · 09:05', decidedBy: 'I Komang Agus S.' },
];

/** Pengajuan cuti contoh M05 → M41 dan KW18 → KW19. */
export const sampleLeaveDraft: LeaveDraft = {
  type: 'cuti',
  start: '06/10/2026',
  end: '08/10/2026',
  reason: 'Acara keluarga di Singaraja.',
};

/** "Senin–Rabu, 06–08/10/2026 · 3 hari kerja" (M17) atau "Sen–Rab, 06–08/10/2026" (W40, `short`). */
export function formatLeaveSpan(
  request: Pick<LeaveRequest, 'start' | 'end'>,
  short = false,
): string {
  const names = short
    ? ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    : ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const day = (iso: string) => names[new Date(`${iso}T00:00:00Z`).getUTCDay()];
  const days = request.start === request.end ? day(request.start) : `${day(request.start)}–${day(request.end)}`;
  const range = formatLeaveRange({ ...request, days: 1 }).split(' · ')[0];
  return `${days}, ${range}`;
}

/** "3 hari kerja", "½ hari kerja". */
export const formatWorkingDays = (days: number) => `${formatLeaveDays(days)} kerja`;

// ---------------------------------------------------------------------------------------------
// MOCK F07: pengajuan Dhais di M17 (menunggu), M42 (disetujui), dan M43 (ditolak). Id dibedakan
// per status karena M17 dan M42 sebenarnya pengajuan yang sama sebelum dan sesudah disetujui.

export const sampleLeaveDetails: Record<'menunggu' | 'disetujui' | 'ditolak', LeaveRequest> = {
  menunggu: {
    id: 'cuti-0610-menunggu',
    type: 'cuti',
    start: '2026-10-06',
    end: '2026-10-08',
    days: 3,
    reason: 'Acara keluarga di Singaraja.',
    status: 'menunggu',
    attachment: { name: 'undangan-keluarga.pdf', sizeBytes: 240 * 1024, kind: 'PDF' },
    submittedAt: '01/10/2026 · 09:12',
    quotaLeft: 6,
  },
  disetujui: {
    id: 'cuti-0610-disetujui',
    type: 'cuti',
    start: '2026-10-06',
    end: '2026-10-08',
    days: 3,
    reason: 'Acara keluarga di Singaraja.',
    status: 'disetujui',
    submittedAt: '01/10/2026 · 09:12',
    decidedAt: '01/10/2026 · 14:05',
    decidedBy: 'I Komang Agus S.',
    decisionNote: 'Selamat berlibur, pastikan handover task ke Khamdafa.',
    quotaLeft: 6,
  },
  ditolak: {
    id: 'cuti-2010',
    type: 'cuti',
    start: '2026-10-20',
    end: '2026-10-21',
    days: 2,
    reason: 'Liburan bersama keluarga.',
    status: 'ditolak',
    submittedAt: '02/10/2026 · 08:15',
    decidedAt: '02/10/2026 · 10:30',
    decidedBy: 'I Komang Agus S.',
    decisionNote: 'Bentrok dengan deadline klien Teneriffe. Mohon geser ke minggu berikutnya.',
    quotaLeft: 6,
  },
};

/** "01/10/2026 · 09:12" di zona waktu tenant, untuk waktu diajukan dan diputuskan. */
export function formatStamp(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('day')}/${get('month')}/${get('year')} · ${get('hour')}:${get('minute')}`;
}
