'use client';

import { useEffect, useRef, useState } from 'react';

export type ExportStep = 'ekspor' | 'pratinjau' | 'membuat';

/** Contoh di URL: `ekspor` (W38), `pratinjau` (W39), `membuat` (W97), `siap` (W98). */
export type ExportPreview = ExportStep | 'siap';

/** Lama simulasi server membuat PDF (W97 → W98). */
const GENERATE_MS = 2000;

/**
 * Alur ekspor W38 → W39 → W97 → W98. MOCK: server belum membuat PDF, jadi "Unduh PDF" hanya
 * menunggu 2 detik lalu menampilkan toast siap; file belum benar-benar diunduh.
 */
export function usePdfExport(preview?: ExportPreview) {
  const [step, setStep] = useState<ExportStep | null>(
    preview === 'siap' || preview === undefined ? null : preview,
  );
  const [ready, setReady] = useState(preview === 'siap');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function download() {
    setStep('membuat');
    timer.current = setTimeout(() => {
      setStep(null);
      setReady(true);
    }, GENERATE_MS);
  }

  function close() {
    if (timer.current) clearTimeout(timer.current);
    setStep(null);
  }

  return {
    step,
    open: () => setStep('ekspor'),
    preview: () => setStep('pratinjau'),
    download,
    close,
    ready,
    dismiss: () => setReady(false),
  };
}
