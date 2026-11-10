/**
 * Komponen gaji (F10 · FR-22, US-09). Uang selalu string desimal ("7000000.00"); hitungan memakai
 * bilangan bulat sen agar tidak ada pembulatan float. Selaras dengan draf `SalaryComponents`.
 */
export type SalaryField =
  | 'baseSalary'
  | 'transportAllowance'
  | 'overtimeRate'
  | 'projectBonus'
  | 'bpjsHealthPercent'
  | 'bpjsEmploymentPercent'
  | 'lateDeduction'
  | 'absentDeduction';

export type SalaryComponents = Record<SalaryField, string> & { autoPph21: boolean };

export type SalaryFieldInfo = {
  key: SalaryField;
  label: string;
  kind: 'money' | 'percent';
  group: 'pendapatan' | 'potongan';
  /** Teks bantuan di bawah kolom (W12). */
  helper: string;
  /** Nama pendek untuk log: "Gaji pokok 6,5 jt → 7,0 jt". */
  logName: string;
};

export const salaryFields: SalaryFieldInfo[] = [
  { key: 'baseSalary', label: 'Gaji pokok (Rp)', kind: 'money', group: 'pendapatan', helper: 'Per bulan', logName: 'Gaji pokok' },
  { key: 'transportAllowance', label: 'Tunjangan transport (Rp)', kind: 'money', group: 'pendapatan', helper: 'Tetap', logName: 'Tunjangan transport' },
  { key: 'overtimeRate', label: 'Tarif lembur (Rp/jam)', kind: 'money', group: 'pendapatan', helper: '1/173 × gaji pokok', logName: 'Tarif lembur' },
  { key: 'projectBonus', label: 'Bonus proyek (Rp)', kind: 'money', group: 'pendapatan', helper: 'Periode ini', logName: 'Bonus proyek' },
  { key: 'bpjsHealthPercent', label: 'BPJS Kesehatan (%)', kind: 'percent', group: 'potongan', helper: 'Ditanggung karyawan', logName: 'BPJS Kesehatan' },
  { key: 'bpjsEmploymentPercent', label: 'BPJS Ketenagakerjaan (%)', kind: 'percent', group: 'potongan', helper: 'JHT', logName: 'BPJS Ketenagakerjaan' },
  { key: 'lateDeduction', label: 'Potongan terlambat (Rp/kali)', kind: 'money', group: 'potongan', helper: 'Setelah toleransi 10 menit', logName: 'Potongan terlambat' },
  { key: 'absentDeduction', label: 'Potongan alpha (Rp/hari)', kind: 'money', group: 'potongan', helper: '1/22 × gaji pokok', logName: 'Potongan alpha' },
];

/** Batas alasan perubahan di dialog konfirmasi (W57: "50/200"). */
export const SALARY_REASON_MAX = 200;

/** "7000000.00" -> "7.000.000" (salinan lokal agar tidak mengimpor balik dari index). */
const formatThousands = (amount: string) =>
  (amount.split('.')[0] ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const toCents = (amount: string) => {
  const [whole = '0', fraction = ''] = amount.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2));
};

const fromCents = (cents: number) => `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;

/** Dibulatkan ke rupiah terdekat, seperti slip gaji. */
const roundRupiah = (cents: number) => Math.round(cents / 100) * 100;

export type ParsedInput = { value: string } | { error: string };

/**
 * Isian uang/persen dari pengguna: "7.000.000", "7000000", "1,5". Titik = pemisah ribuan
 * (uang), koma = desimal. Nilai negatif dan bukan angka ditolak (US-09 AC-2, W55).
 */
export function parseSalaryInput(input: string, kind: SalaryFieldInfo['kind']): ParsedInput {
  const text = input.trim().replace(/\s/g, '');
  if (!text) return { error: 'Wajib diisi' };
  if (/^-/.test(text)) return { error: 'Nilai tidak boleh negatif' };
  if (kind === 'percent') {
    if (!/^\d+([.,]\d{1,2})?$/.test(text)) return { error: 'Harus berupa angka' };
    const value = text.replace(',', '.');
    if (Number(value) > 100) return { error: 'Maksimal 100%' };
    return { value: value.replace(/\.?0+$/, '') || '0' };
  }
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(text)) return { error: 'Harus berupa angka' };
  const [whole = '0', fraction = ''] = text.split(',');
  return { value: `${whole.replace(/\./g, '')}.${fraction.padEnd(2, '0')}` };
}

/** "116666.67" -> "116.667" (dibulatkan ke rupiah untuk ditampilkan di kolom). */
export function formatSalaryInput(value: string, kind: SalaryFieldInfo['kind']): string {
  if (kind === 'percent') return value.replace('.', ',');
  return formatThousands(fromCents(roundRupiah(toCents(value))));
}

/** "7000000.00" -> "7.000.000" (tabel W54). */
export const formatMoneyPlain = (value: string) => formatThousands(fromCents(roundRupiah(toCents(value))));

/** Log W12: 6500000 -> "6,5 jt", 750000 -> "750 rb". */
export function formatMoneyShort(value: string): string {
  const rupiah = Math.round(toCents(value) / 100);
  if (rupiah >= 1_000_000) return `${(Math.round(rupiah / 100_000) / 10).toFixed(1).replace('.', ',')} jt`;
  if (rupiah >= 1_000) return `${Math.round(rupiah / 1_000)} rb`;
  return String(rupiah);
}

/** Data periode berjalan untuk pratinjau (dari kehadiran dan payroll Draft). */
export type PreviewPeriod = {
  overtimeHours: number;
  lateCount: number;
  absentCount: number;
  /** MOCK: PPh 21 TER dihitung server; pratinjau memakai estimasi terakhir. */
  pph21Estimate: string;
};

export type SalaryPreview = { gross: string; deductions: string; net: string };

/**
 * Pratinjau gaji bersih (W12). BPJS dihitung dari gaji pokok + tunjangan tetap (W58). Hasil akhir
 * tetap dihitung server saat payroll diproses (F11).
 */
export function salaryPreview(components: SalaryComponents, period: PreviewPeriod): SalaryPreview {
  const base = toCents(components.baseSalary);
  const transport = toCents(components.transportAllowance);
  const overtime = roundRupiah(toCents(components.overtimeRate) * period.overtimeHours);
  const gross = base + transport + toCents(components.projectBonus) + overtime;
  const bpjsPercent = Number(components.bpjsHealthPercent) + Number(components.bpjsEmploymentPercent);
  const bpjs = roundRupiah(((base + transport) * bpjsPercent) / 100);
  const deductions =
    bpjs +
    toCents(components.lateDeduction) * period.lateCount +
    toCents(components.absentDeduction) * period.absentCount +
    (components.autoPph21 ? toCents(period.pph21Estimate) : 0);
  return { gross: fromCents(gross), deductions: fromCents(deductions), net: fromCents(gross - deductions) };
}

export type SalaryChange = { field: SalaryField; from: string; to: string };

/** Uang dibandingkan per rupiah (kolom menampilkan rupiah bulat), persen apa adanya. */
function sameValue(field: SalaryFieldInfo, a: string, b: string): boolean {
  return field.kind === 'money' ? roundRupiah(toCents(a)) === roundRupiah(toCents(b)) : toCents(a) === toCents(b);
}

/**
 * Gabungkan isian dengan nilai tersimpan: kolom yang tidak diubah tetap memakai nilai asli
 * (mis. tarif lembur 116666.67 yang tampil "116.667"), agar tidak tercatat sebagai perubahan.
 */
export function mergeSalaryInput(saved: SalaryComponents, parsed: Record<SalaryField, string>, autoPph21: boolean): SalaryComponents {
  const merged = { ...saved, autoPph21 };
  for (const field of salaryFields) {
    if (!sameValue(field, saved[field.key], parsed[field.key])) merged[field.key] = parsed[field.key];
  }
  return merged;
}

/** Komponen yang berubah, untuk dialog konfirmasi (W57) dan log. */
export function salaryChanges(before: SalaryComponents, after: SalaryComponents): SalaryChange[] {
  return salaryFields
    .filter((field) => !sameValue(field, before[field.key], after[field.key]))
    .map((field) => ({ field: field.key, from: before[field.key], to: after[field.key] }));
}

export function formatChangeValue(change: SalaryChange, short = false): { from: string; to: string } {
  const info = salaryFields.find((field) => field.key === change.field);
  if (info?.kind === 'percent') return { from: `${change.from}%`, to: `${change.to}%` };
  const fmt = short ? formatMoneyShort : formatMoneyPlain;
  return { from: fmt(change.from), to: fmt(change.to) };
}

export type SalaryLog = { id: string; title: string; by: string; at: string; reason?: string };

export type SalaryProfile = {
  id: string;
  name: string;
  initials: string;
  position: string;
  division: string;
  /** Profil menimpa aturan global ("Disesuaikan HRD"). */
  adjusted: boolean;
  /** null = belum lengkap (BPJS/potongan belum diatur). */
  components: SalaryComponents | null;
  base: string;
  transport: string;
  /** "30/09/2026" */
  updatedAt?: string;
  logs: SalaryLog[];
};

export type PayrollRules = {
  overtimeDivisor: number;
  overtimeAfterMinutes: string;
  overtimeRequiresApproval: boolean;
  lateDeduction: string;
  absentDivisor: number;
  bpjsHealthPercent: string;
  bpjsEmploymentPercent: string;
  pph21Method: 'ter';
  defaultPtkp: string;
  autoPph21: boolean;
};

export const ptkpOptions = ['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3'];

// ---------------------------------------------------------------------------------------------
// MOCK: data contoh Figma W54, W12, W58 sampai API komponen gaji ada.

/** Profil yang tidak tampil di tabel contoh: 16 karyawan, 14 lengkap (W54). */
export const SALARY_PROFILES_NOT_LISTED = 11;

/** Periode berjalan Dhais: 3 jam lembur, 1 kali terlambat, PPh 21 estimasi Rp 230.000. */
export const samplePreviewPeriod: PreviewPeriod = {
  overtimeHours: 3,
  lateCount: 1,
  absentCount: 0,
  pph21Estimate: '230000.00',
};

/** Payroll Oktober sudah Draft, jadi perubahan berlaku mulai November (W57). */
export const sampleEffectivePeriod = { current: 'Oktober 2026', next: 'November 2026' };

const dhaisComponents: SalaryComponents = {
  baseSalary: '7000000.00',
  transportAllowance: '500000.00',
  // Disesuaikan HRD: lebih tinggi dari 1/173 × gaji pokok.
  overtimeRate: '116666.67',
  projectBonus: '500000.00',
  bpjsHealthPercent: '1',
  bpjsEmploymentPercent: '2',
  lateDeduction: '50000.00',
  absentDeduction: '320000.00',
  autoPph21: true,
};

export const sampleSalaryProfiles: SalaryProfile[] = [
  {
    id: 'daze',
    name: 'Dhais Alfa Rysy',
    initials: 'DA',
    position: 'Lead Graphic Designer',
    division: 'Design',
    adjusted: true,
    components: dhaisComponents,
    base: '7000000.00',
    transport: '500000.00',
    updatedAt: '30/09/2026',
    logs: [
      { id: 'l3', title: 'Gaji pokok 6,5 jt → 7,0 jt', by: 'HRD', at: '30/09/2026 14:02' },
      { id: 'l2', title: 'Bonus proyek ditambahkan', by: 'HRD', at: '28/09/2026 10:15' },
      { id: 'l1', title: 'Profil gaji dibuat', by: 'HRD', at: '01/03/2026' },
    ],
  },
  { id: 'komang', name: 'I Komang Agus S.', initials: 'IK', position: 'Team Lead', division: 'Design', adjusted: false, components: { ...dhaisComponents, baseSalary: '6500000.00', transportAllowance: '750000.00', overtimeRate: '37572.25', projectBonus: '0.00', absentDeduction: '295454.55' }, base: '6500000.00', transport: '750000.00', updatedAt: '12/09/2026', logs: [{ id: 'k1', title: 'Profil gaji dibuat', by: 'HRD', at: '12/09/2026' }] },
  { id: 'khamdafa', name: 'Khamdafa W.', initials: 'KW', position: 'Graphic Designer', division: 'Design', adjusted: false, components: { ...dhaisComponents, baseSalary: '5500000.00', overtimeRate: '31791.91', projectBonus: '0.00', absentDeduction: '250000.00' }, base: '5500000.00', transport: '500000.00', updatedAt: '02/09/2026', logs: [{ id: 'w1', title: 'Profil gaji dibuat', by: 'HRD', at: '02/09/2026' }] },
  { id: 'made', name: 'Made Nandana P.', initials: 'MN', position: 'Developer', division: 'Developer', adjusted: true, components: null, base: '7500000.00', transport: '500000.00', logs: [] },
  { id: 'putu', name: 'I Putu Ari D.', initials: 'AR', position: 'Developer', division: 'Developer', adjusted: false, components: null, base: '6500000.00', transport: '500000.00', logs: [] },
];

export const samplePayrollRules: PayrollRules = {
  overtimeDivisor: 173,
  overtimeAfterMinutes: '30',
  overtimeRequiresApproval: true,
  lateDeduction: '50000.00',
  absentDivisor: 22,
  bpjsHealthPercent: '1',
  bpjsEmploymentPercent: '2',
  pph21Method: 'ter',
  defaultPtkp: 'TK/0',
  autoPph21: true,
};

/** Profil baru dari aturan global, untuk "Lengkapi" (W54) karyawan yang belum lengkap. */
export function componentsFromRules(profile: Pick<SalaryProfile, 'base' | 'transport'>, rules: PayrollRules): SalaryComponents {
  const base = toCents(profile.base);
  return {
    baseSalary: profile.base,
    transportAllowance: profile.transport,
    overtimeRate: fromCents(Math.round(base / rules.overtimeDivisor)),
    projectBonus: '0.00',
    bpjsHealthPercent: rules.bpjsHealthPercent,
    bpjsEmploymentPercent: rules.bpjsEmploymentPercent,
    lateDeduction: rules.lateDeduction,
    absentDeduction: fromCents(Math.round(base / rules.absentDivisor)),
    autoPph21: rules.autoPph21,
  };
}

/** Sampel isian W55: gaji pokok negatif dan tunjangan berupa kata. */
export const sampleInvalidInputs: Partial<Record<SalaryField, string>> = {
  baseSalary: '-7.000.000',
  transportAllowance: 'lima ratus ribu',
};

/** Sampel W57: tunjangan transport 500.000 → 750.000 dengan alasan. */
export const sampleSalaryEdit = { field: 'transportAllowance' as const, value: '750.000', reason: 'Penyesuaian tunjangan transport sesuai kebijakan Q4.' };

/**
 * Nilai rumus global untuk kolom yang punya rumus (tarif lembur, potongan alpha). Dipakai untuk
 * label "Nilai khusus HRD · rumus global Rp 40.462" bila nilai profil berbeda (W12, W55–W57).
 */
export function formulaValue(field: SalaryField, baseSalary: string, rules: PayrollRules): string | null {
  if (field === 'overtimeRate') return fromCents(Math.round(toCents(baseSalary) / rules.overtimeDivisor));
  if (field === 'absentDeduction') return fromCents(Math.round(toCents(baseSalary) / rules.absentDivisor));
  return null;
}

/** true bila nilai berbeda dari rumus global (dibandingkan per rupiah). */
export function differsFromFormula(value: string, formula: string): boolean {
  return roundRupiah(toCents(value)) !== roundRupiah(toCents(formula));
}
