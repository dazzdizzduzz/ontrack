import { parseDateInput } from './leave';

/** Proyek & task (F08 · FR-17, FR-19). Selaras dengan draf `Task` dan `Project` di docs/openapi.yaml. */
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'rendah' | 'sedang' | 'tinggi';

export type TaskClient = { id: string; name: string; internal?: boolean };

export type TaskPerson = { id: string; name: string; initials: string };

export type Project = {
  id: string;
  name: string;
  /** Nama pendek di kolom "Proyek / Klien" (W46): "Rebranding · JBM". */
  shortName: string;
  clientId: string;
  description?: string;
  /** "2026-10-12" */
  start?: string;
  target?: string;
  memberIds: string[];
  /** MOCK: dihitung server (task selesai ÷ semua task proyek). */
  progress: number;
  activeTasks: number;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  assigneeId: string;
  priority: TaskPriority;
  status: TaskStatus;
  /** "2026-10-01T17:00" waktu tenant. */
  due?: string;
  attachments?: TaskFile[];
  /** F09: pembuat task (Team Lead / Owner) yang menerima kiriman ke Review. */
  createdById?: string;
  comments?: TaskComment[];
  /** Kiriman hasil terakhir (M45, W51). */
  submission?: { files: TaskFile[]; note?: string; at: string };
  /** Permintaan revisi yang belum dijawab (M46); hilang saat hasil dikirim ulang. */
  revision?: { byId: string; note: string; at: string; due?: string };
};

export type TaskFile = { name: string; sizeBytes: number };

export type TaskComment = { id: string; authorId: string; text: string; at: string };

export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

export const taskStatusOrder: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

export const taskPriorityLabels: Record<TaskPriority, string> = {
  rendah: 'Rendah',
  sedang: 'Sedang',
  tinggi: 'Tinggi',
};

export const taskPriorityOrder: TaskPriority[] = ['rendah', 'sedang', 'tinggi'];

/** Batas formulir W10/W48. */
export const TASK_TITLE_MAX = 120;
export const TASK_DESCRIPTION_MAX = 500;
export const PROJECT_NAME_MAX = 80;
export const TASK_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;
export const TASK_ATTACHMENT_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'ai', 'fig'];

/**
 * Overdue (FR-20): tenggat lewat dan belum selesai. Selama menunggu review tidak dihitung overdue
 * (M45). Tenggat baru dari revisi (M46) menggantikan tenggat awal. `now` berformat sama dengan `due`.
 */
export function isOverdue(task: Pick<Task, 'due' | 'status' | 'revision'>, now: string): boolean {
  const due = task.revision?.due ?? task.due;
  return Boolean(due) && task.status !== 'done' && task.status !== 'review' && (due as string) < now;
}

/** "lewat 1 j", "lewat 45 m", "lewat 2 hari" untuk tenggat yang terlewat (M19). */
export function formatOverdueBy(due: string, now: string): string {
  const minutes = Math.round((Date.parse(`${now}:00Z`) - Date.parse(`${due}:00Z`)) / 60000);
  if (minutes < 60) return `lewat ${Math.max(1, minutes)} m`;
  if (minutes < 24 * 60) return `lewat ${Math.floor(minutes / 60)} j`;
  return `lewat ${Math.floor(minutes / (24 * 60))} hari`;
}

/** "2026-10-01T16:40" -> "01/10 16:40" (M45). */
export function formatTaskStamp(at: string): string {
  const [date = '', time = ''] = at.split('T');
  const [, month, day] = date.split('-');
  return `${day}/${month} ${time}`;
}

/** Gambar dipratinjau, file lain memakai ikon klip (M19, W51). */
export const isImageFile = (name: string) => /\.(png|jpe?g|gif|webp)$/i.test(name);

/** Batas catatan kiriman hasil dan catatan revisi (M44: "72/200", W53: "45/200"). */
export const TASK_NOTE_MAX = 200;
export const TASK_COMMENT_MAX = 500;

/** "2026-10-01T17:00" -> "01/10 · 17.00" (kartu Kanban W06). */
export function formatTaskDue(due: string): string {
  const [date = '', time = ''] = due.split('T');
  const [, month, day] = date.split('-');
  return `${day}/${month} · ${time.replace(':', '.')}`;
}

/** "07/10/2026 · 17.00" (juga menerima "07/10/2026 17:00") -> "2026-10-07T17:00". */
export function parseTaskDue(input: string): string | null {
  const match = input.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})\s*[·,]?\s*(\d{1,2})[.:](\d{2})$/);
  if (!match) return null;
  const [, dd, mm, yyyy, hh = '', min] = match;
  const day = Number(dd);
  const month = Number(mm);
  const hour = Number(hh);
  const minute = Number(min);
  if (month < 1 || month > 12 || hour > 23 || minute > 59) return null;
  const last = new Date(Date.UTC(Number(yyyy), month, 0)).getUTCDate();
  if (day < 1 || day > last) return null;
  return `${yyyy}-${mm}-${dd}T${hh.padStart(2, '0')}:${min}`;
}

/** "2026-10-07T17:00" -> "07/10/2026 · 17.00" untuk nilai awal kolom tenggat. */
export function formatTaskDueInput(due: string): string {
  const [date = '', time = ''] = due.split('T');
  const [yyyy, mm, dd] = date.split('-');
  return `${dd}/${mm}/${yyyy} · ${time.replace(':', '.')}`;
}

export type TaskDraft = {
  title: string;
  projectId: string;
  assigneeId: string;
  due: string;
  priority: TaskPriority;
  description: string;
};

export type TaskErrors = Partial<Record<'title' | 'assigneeId' | 'due', string>>;

/** US-06 AC-2: judul dan penanggung jawab wajib. Tenggat opsional, tetapi formatnya harus benar. */
export function validateTask(draft: TaskDraft): TaskErrors {
  const errors: TaskErrors = {};
  if (!draft.title.trim()) errors.title = 'Judul task wajib diisi';
  if (!draft.assigneeId) errors.assigneeId = 'Penanggung jawab wajib dipilih';
  if (draft.due.trim() && !parseTaskDue(draft.due)) errors.due = 'Format: 07/10/2026 · 17.00';
  return errors;
}

export type ProjectDraft = {
  name: string;
  clientId: string;
  start: string;
  target: string;
  description: string;
  memberIds: string[];
};

export type ProjectErrors = Partial<Record<'name' | 'clientId' | 'start' | 'target', string>>;

/** W48: nama dan klien wajib; tanggal opsional, target tidak boleh sebelum mulai. */
export function validateProject(draft: ProjectDraft): ProjectErrors {
  const errors: ProjectErrors = {};
  if (!draft.name.trim()) errors.name = 'Nama proyek wajib diisi';
  if (!draft.clientId) errors.clientId = 'Klien wajib dipilih';
  const start = draft.start.trim() ? parseDateInput(draft.start) : null;
  const target = draft.target.trim() ? parseDateInput(draft.target) : null;
  if (draft.start.trim() && !start) errors.start = 'Format: 12/10/2026';
  if (draft.target.trim() && !target) errors.target = 'Format: 30/11/2026';
  else if (start && target && target < start) errors.target = 'Target selesai tidak boleh sebelum tanggal mulai';
  return errors;
}

// ---------------------------------------------------------------------------------------------
// MOCK: data contoh Figma W06, W46, W47 sampai API proyek & task ada.

/** "Sekarang" di contoh Figma: Kamis 01/10/2026 sore, sehingga "Revisi logo JBM v3" overdue. */
export const sampleTaskNow = '2026-10-01T18:00';

export const sampleTaskClients: TaskClient[] = [
  { id: 'jbm', name: 'JBM' },
  { id: 'teneriffe', name: 'Teneriffe' },
  { id: 'pokemu', name: 'Pokemu' },
  { id: 'internal', name: 'Internal', internal: true },
  { id: 'copia', name: 'Copia (coffee & gelato)' },
];

export const sampleTaskPeople: TaskPerson[] = [
  { id: 'daze', name: 'Dhais Alfa Rysy', initials: 'DA' },
  { id: 'bagus', name: 'Bagus Wiranata', initials: 'BW' },
  { id: 'khamdafa', name: 'Khamdafa W.', initials: 'KW' },
  { id: 'komang', name: 'I Komang Agus S.', initials: 'IK' },
  { id: 'putu', name: 'I Putu Ari D.', initials: 'AR' },
  { id: 'made', name: 'Made Nandana P.', initials: 'MN' },
];

export const sampleProjects: Project[] = [
  {
    id: 'rebranding-jbm',
    name: 'Rebranding JBM',
    shortName: 'Rebranding',
    clientId: 'jbm',
    description: 'Logo, kop surat, dan brand guideline Jamkrida Bali Mandara.',
    target: '2026-10-31',
    memberIds: ['daze', 'komang'],
    progress: 60,
    activeTasks: 4,
  },
  {
    id: 'website-teneriffe',
    name: 'Website Teneriffe',
    shortName: 'Website',
    clientId: 'teneriffe',
    description: 'Wireframe, UI, dan katalog e-commerce Teneriffe Collection.',
    target: '2026-11-15',
    memberIds: ['khamdafa', 'komang', 'daze'],
    progress: 35,
    activeTasks: 3,
  },
  {
    id: 'social-pokemu',
    name: 'Social media Pokemu',
    shortName: 'Social media',
    clientId: 'pokemu',
    description: 'Konten feed & reels bulanan untuk Pokemu.',
    target: '2026-10-31',
    memberIds: ['bagus'],
    progress: 50,
    activeTasks: 2,
  },
  {
    id: 'ontrack',
    name: 'On-Track (internal)',
    shortName: 'On-Track',
    clientId: 'internal',
    description: 'Desain & pengembangan On-Track untuk operasional Tigapagi.',
    target: '2026-11-30',
    memberIds: ['daze', 'putu', 'made'],
    progress: 70,
    activeTasks: 3,
  },
];

export const sampleTasks: Task[] = [
  { id: 't-brand', title: 'Brand guideline On-Track', projectId: 'ontrack', assigneeId: 'daze', priority: 'sedang', status: 'todo', due: '2026-10-04T17:00' },
  { id: 't-storyboard', title: 'Storyboard reels promo', projectId: 'social-pokemu', assigneeId: 'bagus', priority: 'rendah', status: 'todo', due: '2026-10-06T17:00' },
  { id: 't-mockup', title: 'Mockup kop surat', projectId: 'rebranding-jbm', assigneeId: 'daze', priority: 'rendah', status: 'todo', due: '2026-10-07T12:00' },
  {
    id: 't-logo',
    title: 'Revisi logo JBM v3',
    projectId: 'rebranding-jbm',
    assigneeId: 'daze',
    priority: 'tinggi',
    status: 'in_progress',
    due: '2026-10-01T17:00',
    createdById: 'komang',
    description:
      'Perbaiki proporsi simbol, perbesar jarak tagline, dan siapkan versi monokrom untuk kop surat. Referensi: feedback klien 30/09.',
    attachments: [
      { name: 'logo-jbm-v3.png', sizeBytes: 1.2 * 1024 * 1024 },
      { name: 'feedback.pdf', sizeBytes: 180 * 1024 },
    ],
    comments: [
      { id: 'c1', authorId: 'komang', text: 'Warna logo sudah oke, tolong perbesar spacing tagline.', at: '2026-10-01T10:24' },
      { id: 'c2', authorId: 'daze', text: 'Siap, versi revisi saya upload sebelum 15.00.', at: '2026-10-01T10:40' },
    ],
  },
  { id: 't-wireframe', title: 'Wireframe landing Teneriffe', projectId: 'website-teneriffe', assigneeId: 'daze', priority: 'sedang', status: 'in_progress', due: '2026-10-02T12:00' },
  { id: 't-katalog', title: 'Katalog produk 30 SKU', projectId: 'website-teneriffe', assigneeId: 'komang', priority: 'sedang', status: 'in_progress', due: '2026-10-05T17:00' },
  {
    id: 't-feed',
    title: 'Konten feed Instagram Oktober',
    projectId: 'social-pokemu',
    assigneeId: 'bagus',
    priority: 'rendah',
    status: 'review',
    due: '2026-10-03T10:00',
    createdById: 'komang',
    submission: {
      files: [
        { name: 'feed-01.png', sizeBytes: 820 * 1024 },
        { name: 'feed-02.png', sizeBytes: 790 * 1024 },
        { name: 'feed-03.png', sizeBytes: 805 * 1024 },
      ],
      note: '3 desain feed minggu 1–2 sudah sesuai brief. Caption ada di dokumen terlampir.',
      at: '2026-10-02T18:12',
    },
  },
  { id: 't-figma', title: 'Setup Figma Variables', projectId: 'ontrack', assigneeId: 'daze', priority: 'sedang', status: 'done', due: '2026-09-30T17:00' },
  { id: 't-moodboard', title: 'Moodboard rebranding', projectId: 'rebranding-jbm', assigneeId: 'daze', priority: 'rendah', status: 'done', due: '2026-09-28T17:00' },
];

/** Isian contoh W10 ("Desain kop surat JBM", 52/500). */
export const sampleTaskDraft: TaskDraft = {
  title: 'Desain kop surat JBM',
  projectId: 'rebranding-jbm',
  assigneeId: 'daze',
  due: '07/10/2026 · 17.00',
  priority: 'sedang',
  description: 'Kop surat A4 versi warna & monokrom, ikuti logo v3.',
};

/** Isian contoh W48 ("Kampanye Copia Q4"). */
export const sampleProjectDraft: ProjectDraft = {
  name: 'Kampanye Copia Q4',
  clientId: 'copia',
  start: '12/10/2026',
  target: '30/11/2026',
  description: 'Konsep visual & konten media sosial Copia untuk Q4.',
  memberIds: ['daze', 'bagus'],
};

/** Pengguna yang login di contoh karyawan (M06, KW21). */
export const sampleTaskUserId = 'daze';

/** Isian contoh M44: dua file (satu masih terunggah 72%) dan catatan 72/200. */
export const sampleSubmissionDraft = {
  files: [
    { name: 'logo-jbm-v3-final.ai', sizeBytes: 4.2 * 1024 * 1024 },
    { name: 'logo-jbm-v3-preview.png', sizeBytes: 860 * 1024 },
  ],
  note: 'Proporsi simbol & jarak tagline sudah diperbaiki, versi monokrom terlampir.',
};

/** Contoh M46: revisi dari Team Lead dengan tenggat baru. */
export const sampleRevision = {
  byId: 'komang',
  note: 'Tagline masih terlalu kecil di versi monokrom, perbesar 2pt.',
  at: '2026-10-02T09:15',
  due: '2026-10-03T17:00',
};

/** Komentar review contoh W51 (40/200) dan catatan revisi W53 (45/200). */
export const sampleReviewComment = 'Mantap, warna sudah sesuai brand Pokemu.';
export const sampleRevisionNote = 'Feed 03 perlu ganti foto produk, kurang tajam.';
