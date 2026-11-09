'use client';

import {
  MAX_GPS_ACCURACY_METERS,
  formatClock,
  formatDayDate,
  formatDuration,
  type GeofenceResult,
} from '@on-track/core';
import Image from 'next/image';
import { useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import {
  clockOutAt,
  geofenceAt,
  geofenceFor,
  recordAt,
  sampleClockIn,
  sampleClockOutTime,
  summaryAt,
  TENANT_TIME_ZONE,
  TEST_ANY_LOCATION,
  type WebClockInRecord,
  type WebClockInScenario,
  type WebClockOutRecord,
} from './data';
import { useBrowserLocation, type BrowserLocation } from './useBrowserLocation';
import { useNow } from './useNow';
import { useWebcam, type WebcamStatus } from './useWebcam';
import styles from './ClockInDialog.module.css';

type ClockInDialogProps = {
  /** Contoh Figma (KW11 / KW13 / KW14). Tanpa nilai, lokasi dibaca dari browser. */
  scenario?: WebClockInScenario;
  onClose: () => void;
} & (
  | { mode?: 'in'; onClockIn: (record: WebClockInRecord) => void }
  /** KW14: `clockIn` adalah catatan clock-in hari ini. */
  | {
      mode: 'out';
      clockIn: WebClockInRecord;
      /** Jam clock-out contoh untuk pratinjau (KW26: 15:30). */
      previewTime?: string;
      onClockOut: (record: WebClockOutRecord) => void;
    }
);

/** Batas catatan pulang cepat, sama dengan mobile (M34). */
const NOTE_MAX_LENGTH = 200;

/** Lokasi browser yang belum bisa dinilai. Tidak ada desain Figma; mengikuti pola M29. */
const unavailable: Record<
  Exclude<BrowserLocation['state'], 'siap'>,
  { title: string; meta: string; badge: string; alert?: string }
> = {
  mencari: { title: 'Mencari lokasi…', meta: 'Membaca lokasi dari browser', badge: 'Mencari' },
  ditolak: {
    title: 'Izin lokasi belum diberikan',
    meta: 'Lokasi dibutuhkan untuk clock-in',
    badge: 'Tanpa lokasi',
    alert:
      'Izinkan lokasi untuk situs ini lewat ikon di samping alamat browser, lalu tekan Coba lagi.',
  },
  mati: {
    title: 'Lokasi tidak tersedia',
    meta: 'Browser belum bisa menentukan posisi',
    badge: 'Tanpa lokasi',
    alert: 'Nyalakan layanan lokasi dan Wi-Fi di perangkat, lalu coba lagi.',
  },
  gagal: {
    title: 'Lokasi tidak terbaca',
    meta: 'Waktu membaca lokasi habis',
    badge: 'Tanpa lokasi',
    alert: 'Coba lagi, atau gunakan aplikasi mobile untuk clock-in.',
  },
};

/** Webcam yang belum siap. Tidak ada desain Figma; mengikuti pola peringatan lokasi. */
const webcamAlerts: Record<Exclude<WebcamStatus, 'meminta' | 'siap'>, { title: string; body: string }> = {
  ditolak: {
    title: 'Izin kamera belum diberikan',
    body: 'Izinkan kamera untuk situs ini lewat ikon di samping alamat browser, lalu tekan Coba lagi.',
  },
  'tidak-ada': {
    title: 'Kamera tidak ditemukan',
    body: 'Sambungkan webcam, atau gunakan aplikasi mobile untuk clock-in.',
  },
  gagal: {
    title: 'Kamera tidak bisa dibuka',
    body: 'Tutup aplikasi lain yang memakai kamera, lalu tekan Coba lagi.',
  },
};

/** Lingkaran radius kantor di peta berdiameter 150 px; lingkaran akurasi memakai skala yang sama. */
const RADIUS_IMAGE_PX = 150;
const accuracySize = (accuracyMeters: number) =>
  Math.round((accuracyMeters / sampleClockIn.radiusMeters) * RADIUS_IMAGE_PX);

const badges: Record<GeofenceResult, { tone: 'success' | 'danger' | 'warning'; label: string }> = {
  'dalam-area': { tone: 'success', label: 'Dalam area' },
  'luar-area': { tone: 'danger', label: 'Luar area' },
  // KW27: lokasi browser yang kurang akurat ditandai kuning.
  'gps-lemah': { tone: 'warning', label: 'Kurang akurat' },
};

/**
 * KW11 · Clock In (Web), KW13 · Ditolak, dan KW14 · Clock Out (`mode="out"`). Memakai <dialog>
 * asli: fokus terkunci, Esc menutup. Mode perangkat memakai lokasi browser dan webcam.
 * MOCK: peta masih ilustrasi Figma, dan contoh `?state=` memakai foto ilustrasi.
 */
export function ClockInDialog(props: ClockInDialogProps) {
  const { scenario, onClose } = props;
  const clockingOut = props.mode === 'out';
  const action = clockingOut ? 'Clock-out' : 'Clock-in';
  const [note, setNote] = useState('');
  const ref = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const live = scenario === undefined;
  const now = useNow();
  const browser = useBrowserLocation(sampleClockIn.point, live);

  const testMode = live && TEST_ANY_LOCATION;
  const location: BrowserLocation = !live
    ? { state: 'siap', ...geofenceFor(scenario) }
    : testMode && browser.location.state === 'siap'
      ? { ...browser.location, distance: 0 }
      : browser.location;
  const geofence = location.state === 'siap' ? geofenceAt(location) : null;
  const pending = location.state === 'siap' ? null : unavailable[location.state];
  const result = geofence?.result;
  const {
    videoRef,
    status: webcamStatus,
    retry: retryWebcam,
    capture,
  } = useWebcam(live && !clockingOut && result === 'dalam-area');
  // KW27: clock-in dengan lokasi kurang akurat tidak membuka kamera.
  const weakClockIn = result === 'gps-lemah' && !clockingOut;
  const webcamAlert =
    live && webcamStatus !== 'meminta' && webcamStatus !== 'siap'
      ? webcamAlerts[webcamStatus]
      : null;

  const date = live && now ? formatDayDate(now, TENANT_TIME_ZONE) : sampleClockIn.date;
  const time = live && now ? formatClock(now, TENANT_TIME_ZONE) : sampleClockIn.time;
  // KW14: jam clock-out dari perangkat; contoh Figma 17:44.
  const samplePreviewTime = (props.mode === 'out' && props.previewTime) || sampleClockOutTime;
  const outTime = live && now ? formatClock(now, TENANT_TIME_ZONE) : samplePreviewTime;
  const summary = props.mode === 'out' ? summaryAt(props.clockIn, outTime) : null;
  const early = (summary?.earlyMinutes ?? 0) > 0;

  useEffect(() => {
    ref.current?.showModal();
    headingRef.current?.focus();
  }, []);

  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === ref.current) onClose();
  }

  function clockOut() {
    if (!geofence || props.mode !== 'out') return;
    // MOCK: belum dikirim ke server. Saat integrasi, server mencatat jam clock-out, menilai
    // ulang radius, dan membuat pengajuan lembur untuk Team Lead (W34).
    const takenAt = live ? formatClock(new Date(), TENANT_TIME_ZONE) : samplePreviewTime;
    props.onClockOut(clockOutAt(props.clockIn, takenAt, geofence, note));
  }

  function clockIn() {
    if (!geofence || geofence.result !== 'dalam-area' || props.mode === 'out') return;
    // MOCK: foto dan lokasi belum dikirim ke server. Jam diambil saat tombol ditekan.
    const photo = live ? capture() : null;
    if (live && !photo) return;
    const takenAt = live ? formatClock(new Date(), TENANT_TIME_ZONE) : sampleClockIn.time;
    props.onClockIn({ ...recordAt(takenAt, geofence), photo: photo ?? undefined });
  }

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={handleClick}
    >
      <div className={styles.content}>
        <header className={styles.header}>
          <h2 id={titleId} ref={headingRef} tabIndex={-1} className={styles.title}>
            {clockingOut ? 'Clock Out' : 'Clock In'} · {date}
          </h2>
          <button type="button" className={styles.close} aria-label="Tutup" onClick={onClose}>
            <Image src="/icons/close-20.svg" alt="" width={20} height={20} unoptimized />
          </button>
        </header>

        <p className={styles.step}>1. Verifikasi lokasi</p>
        {/* KW26: dialog pulang cepat tanpa peta agar ringkasan dan catatan muat. */}
        {!early && (
        <div
          className={styles.map}
          role="img"
          aria-label={
            geofence && result !== 'gps-lemah'
              ? `Peta lokasi: ${geofence.distanceLabel} dari ${sampleClockIn.office}`
              : 'Peta lokasi: posisi belum diketahui'
          }
        >
          <span className={styles.roadA} />
          <span className={styles.roadB} />
          <span className={styles.roadC} />
          <span className={styles.roadD} />
          <Image
            className={styles.radius}
            src="/icons/geofence-radius.png"
            alt=""
            width={150}
            height={150}
            unoptimized
          />
          <Image
            className={styles.office}
            src="/icons/map-office.svg"
            alt=""
            width={20}
            height={20}
            unoptimized
          />
          {result === 'gps-lemah' && geofence && (
            <span
              className={styles.accuracy}
              style={{ width: accuracySize(geofence.accuracy), height: accuracySize(geofence.accuracy) }}
            />
          )}
          {(result === 'dalam-area' || result === 'luar-area') && (
            <Image
              className={result === 'dalam-area' ? styles.you : styles.youOutside}
              src={result === 'dalam-area' ? '/icons/map-you.svg' : '/icons/map-you-outside.svg'}
              alt=""
              width={18}
              height={18}
              unoptimized
            />
          )}
        </div>
        )}

        <div className={styles.status} aria-live="polite">
          <div className={styles.statusText}>
            <p className={styles.statusTitle}>
              {pending?.title}
              {result === 'dalam-area' &&
                `${sampleClockIn.office} · ${geofence?.distanceLabel} dari titik`}
              {result === 'luar-area' && `Kamu berada ${geofence?.distanceLabel} dari kantor`}
              {result === 'gps-lemah' && 'Lokasi dari browser kurang akurat'}
            </p>
            <p className={styles.statusMeta}>
              {pending?.meta}
              {result === 'dalam-area' &&
                `Akurasi GPS ±${geofence?.accuracy} m · radius ${sampleClockIn.radiusMeters} m`}
              {result === 'luar-area' &&
                `Batas radius ${sampleClockIn.radiusMeters} m · Akurasi GPS ±${geofence?.accuracy} m`}
              {result === 'gps-lemah' &&
                `Akurasi ±${geofence?.accuracy} m · dibutuhkan ≤ ±${MAX_GPS_ACCURACY_METERS} m`}
            </p>
          </div>
          {result ? (
            <Badge tone={badges[result].tone}>{badges[result].label}</Badge>
          ) : (
            <Badge tone="neutral">{pending?.badge ?? ''}</Badge>
          )}
        </div>

        {testMode && (
          <p className={styles.note}>Mode tes: lokasi mana saja dianggap di {sampleClockIn.office}.</p>
        )}

        {result === 'luar-area' && (
          <Alert tone="danger" title={`${action} ditolak`}>
            {clockingOut
              ? 'Kamu di luar radius kantor. Kembali ke area kantor, lalu coba lagi.'
              : 'Kamu di luar radius kantor dan belum punya izin WFH/Dinas Luar hari ini.'}
          </Alert>
        )}
        {result === 'gps-lemah' && (
          <Alert tone="warning" title={`Belum bisa ${action.toLowerCase()}`}>
            Lokasi dari laptop sering kurang akurat. Sambungkan ke Wi-Fi kantor atau pakai aplikasi di HP, lalu coba lagi.
          </Alert>
        )}
        {pending?.alert && (
          <Alert tone="warning" title={`Belum bisa ${action.toLowerCase()}`}>
            {pending.alert}
          </Alert>
        )}

        {result === 'dalam-area' && summary && (
          <>
            <p className={styles.step}>2. Ringkasan jam kerja</p>
            <dl className={styles.summary}>
              <div className={styles.summaryRow}>
                <dt>Clock-in</dt>
                <dd>
                  {props.mode === 'out' && props.clockIn.time} ·{' '}
                  {props.mode === 'out' && props.clockIn.status.status === 'hadir' ? 'Hadir' : 'Terlambat'}
                </dd>
              </div>
              <div className={styles.summaryRow}>
                <dt>Clock-out</dt>
                <dd>{outTime}</dd>
              </div>
              <div className={styles.summaryRow}>
                <dt>Total jam kerja</dt>
                <dd>{formatDuration(summary.workedMinutes)}</dd>
              </div>
              {early ? (
                <div className={styles.summaryRow}>
                  <dt>Jam pulang</dt>
                  <dd>{sampleClockIn.schedule.end}</dd>
                </div>
              ) : (
                <div className={styles.summaryRow}>
                  <dt>Lembur (estimasi)</dt>
                  <dd>
                    {summary.overtimeMinutes > 0
                      ? `${summary.overtimeMinutes} menit · perlu persetujuan`
                      : 'Tidak ada'}
                  </dd>
                </div>
              )}
            </dl>
            {early ? (
              // KW26 · Clock Out — Pulang Cepat (Web).
              <>
                <Alert tone="warning" title="Clock-out sebelum jam pulang">
                  Status hari ini akan tercatat Pulang Cepat {formatDuration(summary.earlyMinutes)}.
                </Alert>
                <TextField
                  label="Catatan pulang cepat (opsional)"
                  helper={`Terlihat oleh atasan di rekap kehadiran · maks. ${NOTE_MAX_LENGTH} karakter`}
                  value={note}
                  maxLength={NOTE_MAX_LENGTH}
                  onChange={(event) => setNote(event.target.value)}
                />
              </>
            ) : (
              <p className={styles.note}>
                Lembur dihitung jika clock-out lebih dari 30 menit setelah jam pulang (
                {sampleClockIn.schedule.end}), lalu menunggu persetujuan atasan.
              </p>
            )}
          </>
        )}

        {/* KW27: pratinjau kamera baru tampil setelah akurasi ≤ ±50 m. */}
        {weakClockIn && (
          <p className={styles.step}>2. Selfie lewat webcam · tersedia setelah lokasi akurat</p>
        )}
        {result === 'dalam-area' && !clockingOut && (
          <>
            <p className={styles.step}>2. Selfie lewat webcam</p>
            {live ? (
              <div
                className={styles.viewfinder}
                role="img"
                aria-label={`Pratinjau webcam. Posisikan wajah di dalam bingkai. ${date} · ${time} WITA`}
              >
                <video ref={videoRef} className={styles.video} autoPlay muted playsInline />
                {webcamStatus === 'siap' ? (
                  <Image
                    className={styles.guideLive}
                    src="/icons/face-guide.png"
                    alt=""
                    width={132}
                    height={168}
                    unoptimized
                  />
                ) : (
                  <span className={styles.cameraState}>
                    {webcamStatus === 'meminta' ? 'Membuka kamera…' : 'Kamera belum aktif'}
                  </span>
                )}
                <span className={`${styles.caption} ${styles.captionOnVideo}`}>
                  {date} · {time} WITA · {sampleClockIn.office}
                </span>
              </div>
            ) : (
            <div
              className={styles.viewfinder}
              role="img"
              aria-label={`Pratinjau webcam. Wajah terdeteksi. ${date} · ${time} WITA`}
            >
              <Image
                className={styles.photo}
                src="/icons/selfie-photo.png"
                alt=""
                width={342}
                height={236}
                unoptimized
              />
              <Image
                className={styles.head}
                src="/icons/selfie-head.svg"
                alt=""
                width={96}
                height={118}
                unoptimized
              />
              <span className={styles.shoulders} />
              <Image
                className={styles.guide}
                src="/icons/face-guide-ok.png"
                alt=""
                width={132}
                height={168}
                unoptimized
              />
              <span className={styles.detected}>
                <Image src="/icons/check-ink.svg" alt="" width={14} height={14} unoptimized />
                Wajah terdeteksi
              </span>
              <span className={styles.caption}>
                {date} · {time} WITA · {sampleClockIn.office}
              </span>
            </div>
            )}
            {webcamAlert && (
              <Alert tone="warning" title={webcamAlert.title}>
                {webcamAlert.body}
              </Alert>
            )}
            <p className={styles.note}>
              Browser akan meminta izin lokasi &amp; kamera. Foto hanya dipakai untuk verifikasi absensi
              (UU PDP No. 27/2022).
            </p>
          </>
        )}
        {result !== 'dalam-area' && location.state !== 'mencari' && !weakClockIn && (
          <p className={styles.note}>
            Lokasi dibaca dari browser. Jika lokasi kurang tepat, aktifkan Wi-Fi atau gunakan aplikasi
            mobile.
          </p>
        )}

        <footer className={styles.footer}>
          <Button variant="secondary" compact onClick={onClose}>
            Batal
          </Button>
          {webcamAlert && (
            <Button variant="secondary" compact onClick={retryWebcam}>
              Coba lagi
              <Image src="/icons/refresh.svg" alt="" width={20} height={20} unoptimized />
            </Button>
          )}
          {result === 'dalam-area' && clockingOut && (
            <Button compact onClick={clockOut}>
              {early ? 'Tetap clock out' : 'Clock Out sekarang'}
            </Button>
          )}
          {weakClockIn && (
            // KW27: hanya Batal dan Coba lagi. Di pratinjau `?state=` tombol ini tidak berbuat apa-apa.
            <Button compact onClick={live ? browser.refresh : undefined}>
              Coba lagi
              <Image src="/icons/refresh.svg" alt="" width={20} height={20} unoptimized />
            </Button>
          )}
          {result === 'dalam-area' && !clockingOut && (
            <Button
              variant="accent"
              compact
              disabled={live && webcamStatus !== 'siap'}
              onClick={clockIn}
            >
              Ambil selfie &amp; Clock In
              <Image src="/icons/camera.svg" alt="" width={20} height={20} unoptimized />
            </Button>
          )}
          {result === 'luar-area' && !clockingOut && (
            // MOCK: pengajuan WFH / Dinas Luar dikerjakan di F06.
            <Button variant="secondary" compact>
              Ajukan WFH / Dinas Luar
              <Image src="/icons/arrow-right.svg" alt="" width={20} height={20} unoptimized />
            </Button>
          )}
          {live && result !== 'dalam-area' && !weakClockIn && location.state !== 'mencari' && (
            <Button variant="secondary" compact onClick={browser.refresh}>
              Coba lagi
              <Image src="/icons/refresh.svg" alt="" width={20} height={20} unoptimized />
            </Button>
          )}
          {result !== 'dalam-area' && !weakClockIn && (
            <Button compact disabled>
              {clockingOut ? 'Clock Out' : 'Clock In'}
            </Button>
          )}
        </footer>
      </div>
    </dialog>
  );
}
