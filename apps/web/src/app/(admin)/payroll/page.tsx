import type { Metadata } from 'next';
import { PayrollRunPage, type PayrollRunPreview } from '@/features/admin/payroll/PayrollRunPage';

export const metadata: Metadata = { title: 'Payroll · On-Track' };

type PageProps = { searchParams: Promise<{ state?: string }> };

const previews: PayrollRunPreview[] = [
  'menghitung',
  'draft',
  'audit',
  'adjust',
  'adjust-kosong',
  'ajukan',
  'diajukan',
  'rincian',
  'setujui',
  'kembalikan',
  'disetujui',
  'dikembalikan',
];

/**
 * W59 · Payroll siap generate (bawaan) sampai W65 terkunci. Contoh lewat `?state=`, lihat
 * `PayrollRunPreview`.
 */
export default async function PayrollPage({ searchParams }: PageProps) {
  const { state } = await searchParams;
  const preview = previews.find((name) => name === state);
  return <PayrollRunPage key={preview} preview={preview} />;
}
