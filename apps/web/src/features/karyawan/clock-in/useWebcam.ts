'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * - `ditolak`: izin kamera untuk situs ini ditolak.
 * - `tidak-ada`: tidak ada webcam, atau halaman bukan HTTPS/localhost.
 * - `gagal`: kamera dipakai aplikasi lain atau tidak bisa dibuka.
 */
export type WebcamStatus = 'meminta' | 'siap' | 'ditolak' | 'tidak-ada' | 'gagal';

function statusOf(error: unknown): WebcamStatus {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'ditolak';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'tidak-ada';
  return 'gagal';
}

/**
 * Webcam depan untuk selfie KW11. Kamera hanya menyala selama `enabled`, dan dimatikan saat
 * dialog ditutup supaya lampu kamera tidak terus menyala.
 */
export function useWebcam(enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<WebcamStatus>('meminta');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let stream: MediaStream | null = null;

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new DOMException('getUserMedia tidak tersedia', 'NotFoundError');
        }
        const opened = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (cancelled) {
          opened.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = opened;
        const video = videoRef.current;
        if (video) {
          video.srcObject = opened;
          // Siap setelah gambar pertama tampil, supaya foto tidak kosong.
          await video.play();
        }
        if (!cancelled) setStatus('siap');
      } catch (error) {
        if (!cancelled) setStatus(statusOf(error));
      }
    }

    void start();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [enabled, attempt]);

  const retry = useCallback(() => {
    setStatus('meminta');
    setAttempt((count) => count + 1);
  }, []);

  /** Mengambil satu frame sebagai JPEG data URL, dicerminkan seperti yang terlihat di layar. */
  const capture = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.6);
  }, []);

  return { videoRef, status, retry, capture };
}
