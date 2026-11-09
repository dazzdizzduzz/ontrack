/**
 * Data contoh dari Figma W15, W26, dan W27; belum tersambung ke API. Hanya Dhais
 * yang punya data lengkap di Figma, jadi kolom karyawan lain sengaja dikosongkan.
 */
export type EmployeeStatus = 'aktif' | 'nonaktif' | 'diundang';

export type Employee = {
  id: string;
  name: string;
  email: string;
  position: string;
  division: string;
  role: string;
  employment: string;
  status: EmployeeStatus;
  whatsapp?: string;
  joinedAt?: string;
  manager?: string;
  schedule?: string;
  location?: string;
  wfhWithoutApproval?: boolean;
  /** String desimal seperti di API, misalnya "7250000.00". */
  baseSalary?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  /** Tanggal nonaktif, format DD/MM/YYYY (W90). */
  inactiveSince?: string;
};

export const initialEmployees: Employee[] = [
  {
    id: 'ananda',
    name: 'Ananda Sartana',
    email: 'ananda@studiotigapagi.com',
    position: 'CEO',
    division: 'Manajemen',
    role: 'Owner',
    employment: 'Tetap',
    status: 'aktif',
  },
  {
    id: 'daze',
    name: 'Dhais Alfa Rysy',
    email: 'daze@studiotigapagi.com',
    position: 'Lead Graphic Designer',
    division: 'Design',
    role: 'Karyawan',
    employment: 'Tetap',
    status: 'aktif',
    whatsapp: '0857 3900 1122',
    joinedAt: '12/03/2024',
    manager: 'Ananda Sartana',
    schedule: 'Reguler · 09.00–17.00',
    location: 'Kantor Sanur',
    baseSalary: '7250000.00',
    bankName: 'BCA',
    bankAccountNumber: '0123454821',
    bankAccountHolder: 'Dhais Alfa Rysy',
  },
  {
    id: 'komang',
    name: 'I Komang Agus S.',
    email: 'komang@studiotigapagi.com',
    position: 'Project Lead',
    division: 'Developer',
    role: 'Team Lead',
    employment: 'Tetap',
    status: 'aktif',
  },
  {
    id: 'sri',
    name: 'Sri Rahayu',
    email: 'sri@studiotigapagi.com',
    position: 'HR & Finance',
    division: 'Finance',
    role: 'HRD',
    employment: 'Tetap',
    status: 'aktif',
  },
  {
    id: 'khamdafa',
    name: 'Khamdafa W.',
    email: 'khamdafa@studiotigapagi.com',
    position: 'Graphic Designer',
    division: 'Design',
    role: 'Karyawan',
    employment: 'Kontrak',
    status: 'aktif',
  },
  {
    id: 'bagus',
    name: 'Bagus Wiranata',
    email: 'bagus@studiotigapagi.com',
    position: 'Social Media Specialist',
    division: 'Marketing',
    role: 'Karyawan',
    employment: 'Magang',
    status: 'nonaktif',
  },
];

/**
 * Figma menulis "16 aktif" dan "1–6 dari 17", tetapi hanya menggambar 6 baris.
 * Sisa 11 karyawan belum ada di mock, jadi tombol "Berikutnya" belum punya halaman.
 */
export const ACTIVE_NOT_LISTED = 11;

/** "BCA", "0123454821", "Nama" -> "BCA ••••4821 · a.n. Nama" (W26). */
export function maskedBankAccount({
  bankName,
  bankAccountNumber,
  bankAccountHolder,
}: Employee): string | undefined {
  if (!bankName && !bankAccountNumber) return undefined;
  const lastDigits = bankAccountNumber ? ` ••••${bankAccountNumber.slice(-4)}` : '';
  const holder = bankAccountHolder ? ` · a.n. ${bankAccountHolder}` : '';
  return `${bankName ?? ''}${lastDigits}${holder}`.trim();
}

/** Tanggal hari ini dalam format DD/MM/YYYY untuk mock. */
export function todayLabel(): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());
}

/** Contoh W30 untuk `?state=ditambahkan`. */
export const sampleInvited: Employee = {
  id: 'ayu',
  name: 'Putu Ayu Lestari',
  email: 'ayu@studiotigapagi.com',
  position: 'UI/UX Designer',
  division: 'Design',
  role: 'Karyawan',
  employment: 'Kontrak',
  status: 'diundang',
};

export const divisions = ['Manajemen', 'Design', 'Developer', 'Finance', 'Marketing'];
export const filterDivisions = ['Design', 'Developer', 'Marketing'];
export const employments = ['Tetap', 'Kontrak', 'Magang'];
export const roles = ['Owner', 'HRD', 'Team Lead', 'Karyawan', 'Kasir'];

export const statusBadges = {
  aktif: { tone: 'success', label: 'Aktif' },
  nonaktif: { tone: 'neutral', label: 'Nonaktif' },
  diundang: { tone: 'neutral', label: 'Diundang' },
} as const;

/** "Putu Ayu Lestari" -> "PA" */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}
