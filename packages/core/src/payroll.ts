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
 * Pratinjau gaji bersih (W12). BPJS dihitung dari gaji pokok saja (W58). Hasil akhir
 * tetap dihitung server saat payroll diproses (F11).
 */
export function salaryPreview(components: SalaryComponents, period: PreviewPeriod): SalaryPreview {
  const base = toCents(components.baseSalary);
  const transport = toCents(components.transportAllowance);
  const overtime = roundRupiah(toCents(components.overtimeRate) * period.overtimeHours);
  const gross = base + transport + toCents(components.projectBonus) + overtime;
  const bpjsPercent = Number(components.bpjsHealthPercent) + Number(components.bpjsEmploymentPercent);
  const bpjs = roundRupiah((base * bpjsPercent) / 100);
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

/** Periode berjalan Dhais: 3 jam lembur, 1 kali terlambat, PPh 21 estimasi Rp 245.000. */
export const samplePreviewPeriod: PreviewPeriod = {
  overtimeHours: 3,
  lateCount: 1,
  absentCount: 0,
  pph21Estimate: '245000.00',
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
  { id: 'komang', name: 'I Komang Agus S.', initials: 'IK', position: 'Team Lead', division: 'Developer', adjusted: false, components: { ...dhaisComponents, baseSalary: '8500000.00', transportAllowance: '750000.00', overtimeRate: '49132.95', projectBonus: '0.00', absentDeduction: '386363.64' }, base: '8500000.00', transport: '750000.00', updatedAt: '12/09/2026', logs: [{ id: 'k1', title: 'Profil gaji dibuat', by: 'HRD', at: '12/09/2026' }] },
  { id: 'khamdafa', name: 'Khamdafa W.', initials: 'KW', position: 'Graphic Designer', division: 'Design', adjusted: false, components: { ...dhaisComponents, baseSalary: '6500000.00', overtimeRate: '37572.25', projectBonus: '0.00', absentDeduction: '295454.55' }, base: '6500000.00', transport: '500000.00', updatedAt: '02/09/2026', logs: [{ id: 'w1', title: 'Profil gaji dibuat', by: 'HRD', at: '02/09/2026' }] },
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

// =============================================================================================
// F11 · Generate payroll, penyesuaian manual, dan approval CEO (FR-23–FR-25, US-10).

export type PayrollStatus = 'belum' | 'draft' | 'diajukan' | 'disetujui';

/** Komponen yang boleh disesuaikan manual di W13. */
export type AdjustableComponent = 'overtime' | 'projectBonus' | 'transportAllowance' | 'lateDeduction';

export const adjustableComponents: { key: AdjustableComponent; label: string; source: string }[] = [
  { key: 'overtime', label: 'Lembur', source: 'Otomatis dari absensi' },
  { key: 'projectBonus', label: 'Bonus proyek', source: 'Dari komponen gaji' },
  { key: 'transportAllowance', label: 'Tunjangan transport', source: 'Dari komponen gaji' },
  { key: 'lateDeduction', label: 'Potongan terlambat', source: 'Otomatis dari absensi' },
];

export type PayrollAdjustment = {
  id: string;
  employeeId: string;
  component: AdjustableComponent;
  before: string;
  after: string;
  reason: string;
  by: string;
  /** "01/11 10:24" */
  at: string;
};

export type PayrollItem = { key: string; label: string; amount: string; kind: 'earning' | 'deduction' };

export type PayrollLine = {
  employeeId: string;
  name: string;
  initials: string;
  position: string;
  division: string;
  adjusted: boolean;
  base: string;
  /** Kolom "Tunjangan" W07 = tunjangan transport + bonus proyek. */
  allowance: string;
  overtime: string;
  deductions: string;
  net: string;
  gross: string;
  items: PayrollItem[];
};

/** Periode berjalan per karyawan, dari kehadiran dan perhitungan PPh 21 server. */
export type EmployeePeriod = PreviewPeriod;

const sumCents = (values: string[]) => values.reduce((total, value) => total + toCents(value), 0);

/** Nilai otomatis satu komponen sebelum penyesuaian (W13 "Nilai sebelum"). */
export function automaticAmount(
  component: AdjustableComponent,
  components: SalaryComponents,
  period: EmployeePeriod,
): string {
  if (component === 'overtime') return fromCents(roundRupiah(toCents(components.overtimeRate) * period.overtimeHours));
  if (component === 'lateDeduction') return fromCents(toCents(components.lateDeduction) * period.lateCount);
  return components[component];
}

/**
 * Satu baris payroll (W07) dan rinciannya (W100). Rumus sama dengan pratinjau F10; penyesuaian
 * manual menggantikan nilai otomatis komponennya.
 */
export function computePayrollLine(
  profile: SalaryProfile,
  components: SalaryComponents,
  period: EmployeePeriod,
  adjustments: PayrollAdjustment[],
): PayrollLine {
  const own = adjustments.filter((item) => item.employeeId === profile.id);
  const amount = (component: AdjustableComponent) =>
    own.filter((item) => item.component === component).at(-1)?.after ?? automaticAmount(component, components, period);

  const transport = amount('transportAllowance');
  const bonus = amount('projectBonus');
  const overtime = amount('overtime');
  const late = amount('lateDeduction');
  // W58: dasar BPJS = gaji pokok saja (keputusan akhir menunggu backend).
  const bpjsBase = toCents(components.baseSalary);
  const health = fromCents(roundRupiah((bpjsBase * Number(components.bpjsHealthPercent)) / 100));
  const employment = fromCents(roundRupiah((bpjsBase * Number(components.bpjsEmploymentPercent)) / 100));
  const absent = fromCents(toCents(components.absentDeduction) * period.absentCount);
  const pph = components.autoPph21 ? period.pph21Estimate : '0.00';

  const items: PayrollItem[] = [
    { key: 'base', label: 'Gaji pokok', amount: components.baseSalary, kind: 'earning' },
    { key: 'transport', label: 'Tunjangan transport', amount: transport, kind: 'earning' },
    {
      key: 'overtime',
      label: period.overtimeHours ? `Lembur · ${period.overtimeHours} jam × ${formatMoneyPlain(components.overtimeRate)}` : 'Lembur',
      amount: overtime,
      kind: 'earning',
    },
    { key: 'bonus', label: 'Bonus proyek', amount: bonus, kind: 'earning' },
    { key: 'health', label: `BPJS Kesehatan ${components.bpjsHealthPercent}%`, amount: health, kind: 'deduction' },
    { key: 'employment', label: `BPJS Ketenagakerjaan ${components.bpjsEmploymentPercent}%`, amount: employment, kind: 'deduction' },
    { key: 'pph', label: 'PPh 21 (TER)', amount: pph, kind: 'deduction' },
    { key: 'late', label: `Terlambat · ${period.lateCount} kali`, amount: late, kind: 'deduction' },
    { key: 'absent', label: `Alpha · ${period.absentCount} hari`, amount: absent, kind: 'deduction' },
  ].filter((item) => item.kind === 'earning' || toCents(item.amount) > 0) as PayrollItem[];

  const gross = sumCents(items.filter((item) => item.kind === 'earning').map((item) => item.amount));
  const deductions = sumCents(items.filter((item) => item.kind === 'deduction').map((item) => item.amount));
  return {
    employeeId: profile.id,
    name: profile.name,
    initials: profile.initials,
    position: profile.position,
    division: profile.division,
    adjusted: own.length > 0,
    base: components.baseSalary,
    allowance: fromCents(toCents(transport) + toCents(bonus)),
    overtime,
    deductions: fromCents(deductions),
    gross: fromCents(gross),
    net: fromCents(gross - deductions),
    items,
  };
}

export type PayrollTotals = {
  employees: number;
  net: string;
  deductions: string;
  overtimeHours: number;
  overtimePay: string;
  adjustments: number;
};

/** Total KPI W07: baris yang tampil + ringkasan karyawan lain dari server. */
export function payrollTotals(
  lines: PayrollLine[],
  periods: Record<string, EmployeePeriod>,
  adjustments: PayrollAdjustment[],
  others: Omit<PayrollTotals, 'adjustments'>,
): PayrollTotals {
  return {
    employees: lines.length + others.employees,
    net: fromCents(sumCents(lines.map((line) => line.net)) + toCents(others.net)),
    deductions: fromCents(sumCents(lines.map((line) => line.deductions)) + toCents(others.deductions)),
    overtimeHours: lines.reduce((total, line) => total + (periods[line.employeeId]?.overtimeHours ?? 0), others.overtimeHours),
    overtimePay: fromCents(sumCents(lines.map((line) => line.overtime)) + toCents(others.overtimePay)),
    adjustments: adjustments.length,
  };
}

/** "Rp 118,4 jt" untuk kartu KPI. */
export const formatRupiahShort = (value: string) => `Rp ${formatMoneyShort(value)}`;

/** Batas alasan penyesuaian (W13 "78/200") dan catatan CEO (W66 "68/200"). */
export const PAYROLL_NOTE_MAX = 200;

// MOCK F11: data periode Oktober 2026 per karyawan dan ringkasan 11 karyawan lain.
export const samplePayrollPeriods: Record<string, EmployeePeriod> = {
  daze: { overtimeHours: 3, lateCount: 1, absentCount: 0, pph21Estimate: '245000.00' },
  komang: { overtimeHours: 0, lateCount: 0, absentCount: 0, pph21Estimate: '355000.00' },
  khamdafa: { overtimeHours: 0, lateCount: 1, absentCount: 0, pph21Estimate: '210000.00' },
  made: { overtimeHours: 8, lateCount: 0, absentCount: 0, pph21Estimate: '315000.00' },
  putu: { overtimeHours: 0, lateCount: 2, absentCount: 0, pph21Estimate: '300000.00' },
};

export const samplePayrollOthers: Omit<PayrollTotals, 'adjustments'> = {
  employees: 11,
  // Dipilih agar total sama dengan Figma W07: Rp 118,4 jt dan Rp 7,4 jt.
  net: '81055000.00',
  deductions: '4695000.00',
  overtimeHours: 15,
  overtimePay: '2200000.00',
};

/** Penyesuaian contoh W13 / W62: lembur Made yang belum tercatat karena GPS gagal. */
export const samplePayrollAdjustments: PayrollAdjustment[] = [
  {
    id: 'adj-made',
    employeeId: 'made',
    component: 'overtime',
    before: '346821.00',
    after: '450000.00',
    reason: 'Lembur 26/09 belum tercatat karena GPS gagal; disetujui Team Lead via chat.',
    by: 'Sri Rahayu (HRD)',
    at: '01/11 10:24',
  },
];

/** Catatan contoh W66 / W103. */
export const sampleReturnNote = 'Lembur Made Nandana 450.000 belum ada persetujuan atasan, mohon dicek ulang.';

/** Kesiapan data W59 yang tidak berasal dari profil gaji (MOCK: dari rekap F05, izin F06, lembur F04). */
export const samplePayrollReadiness = {
  attendance: { complete: 16, total: 16, until: '31/10' },
  leaveSynced: 5,
  overtimePending: 3,
};
