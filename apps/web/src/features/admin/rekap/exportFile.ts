import { sampleExporter } from './data';
import type { ExportOptions } from './ExportDialogs';

/** Jam pembuatan contoh W39 (dunia contoh Figma: 01/10/2026). */
const SAMPLE_CREATED_AT = '01/10/2026 17:50';
/** MOCK: ukuran perkiraan per halaman, dari contoh Figma (3 halaman = 248 KB). */
const SAMPLE_KB_PER_PAGE = 248 / 3;

/**
 * Nama file dan ringkasan pratinjau W39. MOCK: jumlah halaman diperkirakan dari isi yang
 * dipilih (ringkasan 1, detail harian 2, selfie 2) dan ukurannya dari contoh Figma; angka asli
 * datang dari server setelah PDF dibuat.
 */
export function exportFile(
  period: { label: string; range: string; short: string },
  options: ExportOptions,
  employees: number,
  subject = 'Kehadiran',
) {
  const pages = (options.summary ? 1 : 0) + (options.daily ? 2 : 0) + (options.selfie ? 2 : 0) || 1;
  const size = `${Math.round(pages * SAMPLE_KB_PER_PAGE)} KB`;
  return {
    fileName: `Rekap_${subject.replace(/\s+/g, '_')}_${period.short}.pdf`,
    meta: `${pages} halaman · ${size} · dibuat ${SAMPLE_CREATED_AT} oleh ${sampleExporter}`,
    /** Toast W98: "Rekap_Kehadiran_Sep2026.pdf · 3 halaman · 248 KB". */
    summary: `${pages} halaman · ${size}`,
    heading: `Rekap ${subject} · ${period.label}`,
    subheading: `${employees} karyawan · periode ${period.range}`,
    pages,
  };
}
