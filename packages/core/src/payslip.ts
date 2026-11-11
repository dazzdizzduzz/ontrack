import { formatMoneyPlain } from './payroll';

/** Slip gaji milik karyawan (F12 · M09, M47, M48, KW23, KW24). Draf kontrak: /me/payslips. */
export type PayslipStatus = 'dibayar' | 'proses';

export type PayslipItem = {
  label: string;
  /** Label ringkas di dokumen PDF (M47/KW24), contoh "BPJS Kes (1%)". */
  pdfLabel?: string;
  amount: string;
  kind: 'earning' | 'deduction';
};

export type Payslip = {
  /** "2026-09", sama dengan parameter path {period}. */
  period: string;
  label: string;
  month: string;
  status: PayslipStatus;
  net?: string;
  gross?: string;
  deductions?: string;
  items: PayslipItem[];
  paidAt?: string;
  bankAccount?: string;
  approvedBy?: string;
  fileName?: string;
  fileSizeKb?: number;
};

export const payslipStatusLabels: Record<PayslipStatus, string> = { dibayar: 'Dibayar', proses: 'Proses' };

/** Data diri di kepala slip PDF. NIK = nomor induk karyawan, bukan NIK KTP. */
export const samplePayslipOwner = {
  name: 'Dhais Alfa Rysy',
  position: 'Lead Graphic Designer',
  employeeNumber: '2024-031',
  company: 'Studio Tigapagi',
};

const toCents = (value: string) => {
  const [whole = '0', fraction = ''] = value.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2));
};
const fromCents = (cents: number) => `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;

/** Total pendapatan, potongan, dan gaji bersih dihitung dari item agar angka slip selalu konsisten. */
function paid(base: Omit<Payslip, 'status' | 'net' | 'gross' | 'deductions'>): Payslip {
  const sum = (kind: PayslipItem['kind']) =>
    base.items.filter((item) => item.kind === kind).reduce((total, item) => total + toCents(item.amount), 0);
  const gross = sum('earning');
  const deductions = sum('deduction');
  return {
    ...base,
    status: 'dibayar',
    gross: fromCents(gross),
    deductions: fromCents(deductions),
    net: fromCents(gross - deductions),
  };
}

/** BPJS 1% + 2% dari gaji pokok saja (W58). */
const bpjsFor = (baseSalary: string): PayslipItem[] => {
  const base = toCents(baseSalary);
  return [
    { label: 'BPJS Kesehatan (1%)', pdfLabel: 'BPJS Kes (1%)', amount: fromCents(Math.round(base / 100)), kind: 'deduction' },
    { label: 'BPJS Ketenagakerjaan (2%)', pdfLabel: 'BPJS TK JHT (2%)', amount: fromCents(Math.round((base * 2) / 100)), kind: 'deduction' },
  ];
};

const shared = { bankAccount: 'BCA •••• 4821', approvedBy: 'Ananda Sartana (CEO)', fileSizeKb: 128 };

/**
 * MOCK: slip Dhais dari Figma M09/KW23. Slip yang sudah terbit adalah salinan beku saat payroll
 * dikunci, jadi tidak dihitung ulang dari komponen gaji F10 yang berlaku sekarang.
 */
export const samplePayslips: Payslip[] = [
  { period: '2026-10', label: 'Oktober 2026', month: 'Oktober', status: 'proses', items: [] },
  paid({
    ...shared,
    period: '2026-09',
    label: 'September 2026',
    month: 'September',
    paidAt: '30/09/2026',
    fileName: 'Slip_Gaji_Sep2026.pdf',
    items: [
      { label: 'Gaji pokok', amount: '7000000.00', kind: 'earning' },
      { label: 'Tunjangan transport', amount: '500000.00', kind: 'earning' },
      { label: 'Lembur (3 jam)', amount: '350000.00', kind: 'earning' },
      { label: 'Bonus proyek', amount: '500000.00', kind: 'earning' },
      ...bpjsFor('7000000.00'),
      { label: 'PPh 21', pdfLabel: 'PPh 21 (TER)', amount: '245000.00', kind: 'deduction' },
      { label: 'Terlambat (1×)', amount: '50000.00', kind: 'deduction' },
    ],
  }),
  paid({
    ...shared,
    period: '2026-08',
    label: 'Agustus 2026',
    month: 'Agustus',
    paidAt: '31/08/2026',
    fileName: 'Slip_Gaji_Agu2026.pdf',
    items: [
      { label: 'Gaji pokok', amount: '6500000.00', kind: 'earning' },
      { label: 'Tunjangan transport', amount: '500000.00', kind: 'earning' },
      { label: 'Lembur (6 jam)', amount: '700000.00', kind: 'earning' },
      { label: 'Bonus proyek', amount: '500000.00', kind: 'earning' },
      ...bpjsFor('6500000.00'),
      { label: 'PPh 21', pdfLabel: 'PPh 21 (TER)', amount: '295000.00', kind: 'deduction' },
      { label: 'Terlambat (2×)', amount: '100000.00', kind: 'deduction' },
    ],
  }),
  paid({
    ...shared,
    period: '2026-07',
    label: 'Juli 2026',
    month: 'Juli',
    paidAt: '31/07/2026',
    fileName: 'Slip_Gaji_Jul2026.pdf',
    items: [
      { label: 'Gaji pokok', amount: '6500000.00', kind: 'earning' },
      { label: 'Tunjangan transport', amount: '500000.00', kind: 'earning' },
      { label: 'Lembur (9 jam)', amount: '1050000.00', kind: 'earning' },
      { label: 'Bonus proyek', amount: '0.00', kind: 'earning' },
      ...bpjsFor('6500000.00'),
      { label: 'PPh 21', pdfLabel: 'PPh 21 (TER)', amount: '285000.00', kind: 'deduction' },
      { label: 'Terlambat (1×)', amount: '50000.00', kind: 'deduction' },
    ],
  }),
];

/** Slip terbaru yang sudah terbit (bawaan M09/KW23). */
export const latestPaidPayslip = (slips: Payslip[]) => slips.find((slip) => slip.status === 'dibayar');

/** "7000000.00" -> "7.000.000"; potongan diberi tanda minus tipografis seperti Figma. */
export function formatPayslipAmount(item: PayslipItem, withRp = true): string {
  const value = `${withRp ? 'Rp ' : ''}${formatMoneyPlain(item.amount)}`;
  if (item.kind === 'earning') return value;
  return withRp ? `– ${value}` : `−${value}`;
}

// ---------- W67 · Status pengiriman slip (HRD & CEO) ----------

/** Status kirim/buka/unduh per karyawan. Isi slip tidak ikut; nominal dari baris payroll F11. */
export type PayslipDelivery = {
  employeeId: string;
  sentAt: string;
  openedAt?: string;
  downloadedAt?: string;
};

export type DeliveryStatus = 'downloaded' | 'opened' | 'unopened';

export const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  downloaded: 'Diunduh',
  opened: 'Dibuka',
  unopened: 'Belum dibuka',
};

export const deliveryStatus = (delivery: PayslipDelivery): DeliveryStatus =>
  delivery.downloadedAt ? 'downloaded' : delivery.openedAt ? 'opened' : 'unopened';

export const samplePayslipIssuedAt = '01/11/2026 14:20';

/** MOCK: 5 karyawan yang tampil di W67. */
export const samplePayslipDeliveries: PayslipDelivery[] = [
  { employeeId: 'daze', sentAt: '01/11 14:20', openedAt: '01/11 14:31', downloadedAt: '01/11 14:32' },
  { employeeId: 'komang', sentAt: '01/11 14:20', openedAt: '01/11 15:02' },
  { employeeId: 'khamdafa', sentAt: '01/11 14:20' },
  { employeeId: 'made', sentAt: '01/11 14:20', openedAt: '01/11 16:45', downloadedAt: '01/11 16:46' },
  { employeeId: 'putu', sentAt: '01/11 14:20' },
];

/** MOCK: 11 karyawan lain di luar tabel W67 (8 dibuka, 5 di antaranya diunduh, 3 belum dibuka). */
export const samplePayslipOthers = { issued: 11, opened: 8, downloaded: 5 };

export function deliverySummary(deliveries: PayslipDelivery[], others = samplePayslipOthers) {
  const count = (status: DeliveryStatus[]) =>
    deliveries.filter((item) => status.includes(deliveryStatus(item))).length;
  const issued = deliveries.length + others.issued;
  const opened = count(['opened', 'downloaded']) + others.opened;
  return {
    issued,
    opened,
    openedPercent: Math.round((opened / issued) * 100),
    downloaded: count(['downloaded']) + others.downloaded,
    unopened: issued - opened,
  };
}

// ---------- W68 · W101 · Log akses payroll ----------

export type AccessResult = 'diizinkan' | 'ditolak';

export type PayrollAccessLog = {
  id: string;
  name: string;
  initials: string;
  role: string;
  /** Tampil di bawah nama (W68) hanya pada baris yang menyorotnya. */
  showRole?: boolean;
  at: string;
  atFull: string;
  path: string;
  device: string;
  deviceFull: string;
  result: AccessResult;
  incidentCode?: string;
};

export const accessResultLabels: Record<AccessResult, string> = { diizinkan: 'Diizinkan', ditolak: 'Ditolak (403)' };

/** "ACC-403-20261001-0917" -> "…0917" untuk kolom sempit W68. */
export const shortIncidentCode = (code: string) => `…${code.slice(-4)}`;

/** MOCK: log 30 hari terakhir dari Figma W68. Kode insiden contoh dipakai juga di W08. */
export const sampleIncidentCode = 'ACC-403-20261001-0917';

export const sampleAccessLogs: PayrollAccessLog[] = [
  { id: 'log-1', name: 'Khamdafa W.', initials: 'KW', role: 'Staff · Design', showRole: true, at: '01/10 09:17', atFull: '01/10/2026 09:17 WITA', path: '/payroll', device: 'Chrome', deviceFull: 'Chrome · macOS', result: 'ditolak', incidentCode: sampleIncidentCode },
  { id: 'log-2', name: 'Bagus Wiranata', initials: 'BW', role: 'Staff · Developer', at: '28/09 13:40', atFull: '28/09/2026 13:40 WITA', path: '/payroll/slip/DA', device: 'Safari iOS', deviceFull: 'Safari · iOS', result: 'ditolak', incidentCode: 'ACC-403-20260928-1340' },
  { id: 'log-3', name: 'Khamdafa W.', initials: 'KW', role: 'Staff · Design', at: '28/09 13:41', atFull: '28/09/2026 13:41 WITA', path: '/payroll', device: 'Chrome', deviceFull: 'Chrome · macOS', result: 'ditolak', incidentCode: 'ACC-403-20260928-1341' },
  { id: 'log-4', name: 'Sri Rahayu', initials: 'SR', role: 'HRD', showRole: true, at: '01/11 09:30', atFull: '01/11/2026 09:30 WITA', path: '/payroll/generate', device: 'Chrome', deviceFull: 'Chrome · Windows', result: 'diizinkan' },
  { id: 'log-5', name: 'Ananda Sartana', initials: 'AS', role: 'CEO · Owner', at: '01/11 14:20', atFull: '01/11/2026 14:20 WITA', path: '/payroll/approve', device: 'Safari', deviceFull: 'Safari · macOS', result: 'diizinkan' },
];

/** MOCK: ringkasan W68 (30 hari). Ditolak & pengguna ditolak dihitung dari log contoh. */
export function accessSummary(logs: PayrollAccessLog[]) {
  const denied = logs.filter((log) => log.result === 'ditolak');
  return {
    allowed: 148,
    denied: denied.length,
    deniedUsers: new Set(denied.map((log) => log.name)).size,
    payslipsOpened: 11,
    exports: 2,
  };
}
