import { sampleLeaveDetails } from './leave';

/**
 * Notifikasi karyawan (F07 · FR-15, FR-20). Selaras dengan draf `Notification` di
 * docs/openapi.yaml; `kind` menentukan ikon dan halaman tujuan.
 */
export type NotificationKind =
  | 'leave_approved'
  | 'leave_rejected'
  | 'task_assigned'
  | 'task_revision'
  | 'task_overdue'
  | 'task_comment'
  | 'clockout_reminder'
  | 'payslip_published';

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Waktu relatif atau jam yang sudah siap tampil: "Baru saja", "10:24". */
  time: string;
  /** Pengelompokan di M20. */
  day: 'hari-ini' | 'kemarin';
  unread: boolean;
  /** Pengajuan izin tujuan; kosong untuk task dan lainnya (halaman task dikerjakan di F08). */
  leaveId?: string;
};

export const notificationDayLabels: Record<AppNotification['day'], string> = {
  'hari-ini': 'Hari ini',
  kemarin: 'Kemarin',
};

// ---------------------------------------------------------------------------------------------
// MOCK: notifikasi contoh Figma M20 dan KW25 sampai GET /me/notifications ada.

export const sampleNotifications: AppNotification[] = [
  {
    id: 'n-task-baru',
    kind: 'task_assigned',
    title: 'Task baru ditugaskan',
    body: 'Ananda S. menugaskan "Desain kop surat JBM" · tenggat 07/10 17.00',
    time: 'Baru saja',
    day: 'hari-ini',
    unread: true,
  },
  {
    id: 'n-revisi',
    kind: 'task_revision',
    title: 'Task perlu revisi',
    body: 'I Komang Agus S.: "Tagline masih terlalu kecil di versi monokrom…"',
    time: '10 menit lalu',
    day: 'hari-ini',
    unread: true,
  },
  {
    id: 'n-cuti-ditolak',
    kind: 'leave_rejected',
    title: 'Cuti kamu ditolak',
    body: 'I Komang Agus S. menolak cuti 20–21/10. Ketuk untuk lihat alasan.',
    time: 'Baru saja',
    day: 'hari-ini',
    unread: true,
    leaveId: sampleLeaveDetails.ditolak.id,
  },
  {
    id: 'n-cuti-disetujui',
    kind: 'leave_approved',
    title: 'Cuti kamu disetujui',
    body: 'I Komang Agus S. menyetujui cuti 06–08/10/2026.',
    time: '5 menit lalu',
    day: 'hari-ini',
    unread: true,
    leaveId: sampleLeaveDetails.disetujui.id,
  },
  {
    id: 'n-overdue',
    kind: 'task_overdue',
    title: 'Task melewati tenggat',
    body: '“Revisi logo JBM v3” lewat tenggat 17.00. Perbarui statusnya.',
    time: '2 jam lalu',
    day: 'hari-ini',
    unread: true,
  },
  {
    id: 'n-komentar',
    kind: 'task_comment',
    title: 'Komentar baru',
    body: 'I Komang Agus S.: “Warna logo sudah oke…”',
    time: '10:24',
    day: 'hari-ini',
    unread: false,
  },
  {
    id: 'n-clockout',
    kind: 'clockout_reminder',
    title: 'Pengingat clock-out',
    body: 'Kamu belum clock-out. Jam kerja berakhir 17.00.',
    time: '17:15',
    day: 'kemarin',
    unread: false,
  },
  {
    id: 'n-slip',
    kind: 'payslip_published',
    title: 'Slip gaji September terbit',
    body: 'Gaji bersih Rp 7.845.000 sudah bisa diunduh.',
    time: '09:00',
    day: 'kemarin',
    unread: false,
  },
];
