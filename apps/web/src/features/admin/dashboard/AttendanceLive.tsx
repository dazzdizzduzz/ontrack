'use client';

import {
  applyLateCheckIn,
  areaCounts,
  liveStatusLabels,
  sampleAttendanceKpis,
  sampleDashboardContext,
  sampleLiveActivities,
  sampleLiveEvent,
  sampleMapPins,
  sampleNotCheckedIn,
  sampleRangeKpis,
  type DashboardRange,
  type LiveStatus,
  type MapPin,
} from '@on-track/core';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Toast } from '@/components/ui/Toast';
import { AttendanceKpiRow, ExportLink, LiveStamp, RangeTabs } from './DashboardParts';
import styles from './dashboard.module.css';

export type AttendanceLivePreview = 'live' | 'belum-absen';

/** MOCK: jeda sebelum event live contoh masuk (pengganti SSE /dashboard/attendance/stream). */
const LIVE_EVENT_MS = 6000;

const statusTones: Record<LiveStatus, 'success' | 'warning' | 'neutral'> = {
  hadir: 'success',
  terlambat: 'warning',
  wfh: 'neutral',
  sakit: 'neutral',
};

const pinStyles: Record<MapPin['kind'], string> = {
  hadir: styles.pinHadir ?? '',
  terlambat: styles.pinTerlambat ?? '',
  luar_area: styles.pinLuar ?? '',
};

/** Peta ilustrasi geofence dengan titik karyawan (bukan peta sungguhan). */
function LiveMap({ pins, inside, outside }: { pins: MapPin[]; inside: number; outside: number }) {
  const ctx = sampleDashboardContext;
  return (
    <div
      className={styles.map}
      role="img"
      aria-label={`Peta ${ctx.office}, radius ${ctx.radiusMeters} meter: ${inside} karyawan di dalam area, ${outside} di luar area`}
    >
      <span className={`${styles.road} ${styles.roadH1}`} />
      <span className={`${styles.road} ${styles.roadH2}`} />
      <span className={`${styles.road} ${styles.roadV1}`} />
      <span className={`${styles.road} ${styles.roadV2}`} />
      <span className={`${styles.road} ${styles.roadV3}`} />
      <span className={styles.geofence} />
      <span className={styles.office} />
      {pins.map((pin) => (
        <span key={pin.initials} className={styles.pin} style={{ left: `${pin.x}%`, top: `${pin.y}%` }}>
          <span className={`${styles.pinDot} ${pinStyles[pin.kind]}`} />
          <span className={styles.pinLabel}>{pin.initials}</span>
        </span>
      ))}
      <span className={styles.mapNote}>
        {inside} di dalam area · {outside} di luar area (WFH disetujui)
      </span>
    </div>
  );
}

/** W70 · Drill-down karyawan yang belum absen + kirim pengingat. */
function NotCheckedInDrawer({ onClose, onRemind }: { onClose: () => void; onRemind: (name: string) => void }) {
  const ctx = sampleDashboardContext;
  const people = sampleNotCheckedIn;
  return (
    <Drawer
      title={`Belum absen · ${people.length} karyawan`}
      subtitle={`${ctx.date} · jam masuk 09.00 + toleransi 10 menit`}
      onClose={onClose}
      onSubmit={(event) => event.preventDefault()}
      actions={
        people[0] && (
          <>
            <ButtonLink variant="secondary" compact href={`/data-karyawan/${people[0].id}`}>
              Lihat profil
            </ButtonLink>
            <Button compact onClick={() => onRemind(people[0]?.name ?? '')}>
              Kirim pengingat lagi
              <Image src="/icons/bell-inverse.svg" alt="" width={20} height={20} unoptimized />
            </Button>
          </>
        )
      }
    >
      {people.map((person) => (
        <div key={person.id} className={styles.personCard}>
          <Avatar initials={person.initials} size="M" />
          <span className={styles.highlightText}>
            <span className={styles.feedName}>{person.name}</span>
            <span className={styles.cardMeta}>
              {person.division} · {person.schedule} · {person.lastActive}
            </span>
          </span>
          <Badge tone="danger">Belum absen</Badge>
        </div>
      ))}
      {people[0] && (
        <dl className={styles.kv}>
          <div className={styles.kvRow}>
            <dt>Pengajuan izin hari ini</dt>
            <dd>{people[0].leaveToday}</dd>
          </div>
          <div className={styles.kvRow}>
            <dt>Pengingat otomatis</dt>
            <dd>Terkirim {people[0].reminderAt}</dd>
          </div>
          <div className={styles.kvRow}>
            <dt>Jika tidak absen s.d. 17.00</dt>
            <dd>Tercatat Alpha</dd>
          </div>
        </dl>
      )}
    </Drawer>
  );
}

/**
 * W01 · Dashboard kehadiran live, W02 · update live, W70 · belum absen. Pratinjau `?state=live`
 * (W02 langsung) dan `?state=belum-absen` (W70). MOCK: satu event clock-in contoh masuk setelah
 * 6 detik; nanti snapshot GET /dashboard/attendance/live + SSE /dashboard/attendance/stream.
 */
export function AttendanceLive({ preview }: { preview?: AttendanceLivePreview }) {
  const [range, setRange] = useState<DashboardRange>('hari');
  const [received, setReceived] = useState(preview === 'live');
  const [drawerOpen, setDrawerOpen] = useState(preview === 'belum-absen');
  const [reminded, setReminded] = useState<string | null>(null);
  const ctx = sampleDashboardContext;

  useEffect(() => {
    if (received || preview) return;
    const timer = setTimeout(() => setReceived(true), LIVE_EVENT_MS);
    return () => clearTimeout(timer);
  }, [preview, received]);

  const today = received ? applyLateCheckIn(sampleAttendanceKpis, sampleLiveEvent.lateAverageMinutes) : sampleAttendanceKpis;
  const kpis = range === 'hari' ? today : sampleRangeKpis[range];
  const pins = received ? [...sampleMapPins, sampleLiveEvent.pin] : sampleMapPins;
  const activities = received ? [sampleLiveEvent.activity, ...sampleLiveActivities] : sampleLiveActivities;
  const { inside, outside } = areaCounts(today, pins);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Dashboard Kehadiran</h1>
          <p className={styles.subtitle}>
            {ctx.date} · {ctx.office} · Jam kerja {ctx.workHours}
          </p>
        </div>
        <div className={styles.headerTools}>
          <LiveStamp label={received ? 'Diperbarui baru saja' : 'Diperbarui 2 detik lalu'} />
          <RangeTabs value={range} onChange={setRange} />
          <ExportLink />
        </div>
      </header>

      {reminded && (
        <Toast tone="success" title="Pengingat dikirim" onDismiss={() => setReminded(null)}>
          {reminded} menerima notifikasi pengingat absen di aplikasi.
        </Toast>
      )}

      <AttendanceKpiRow kpis={kpis} range={range} notCheckedInHref="/dashboard/kehadiran?state=belum-absen" />

      <div className={styles.liveRow}>
        <section className={styles.card} aria-labelledby="live-map">
          <div className={styles.cardHead}>
            <div>
              <h2 id="live-map" className={styles.cardTitle}>
                Peta Kehadiran Live
              </h2>
              <p className={styles.cardMeta}>
                Geofence {ctx.office} · radius {ctx.radiusMeters} m
              </p>
            </div>
            <ul className={styles.mapLegend}>
              <li>
                <span className={`${styles.dot} ${styles.dotPresent}`} />
                Kantor
              </li>
              <li>
                <span className={`${styles.pinDot} ${styles.pinHadir}`} />
                Hadir
              </li>
              <li>
                <span className={`${styles.dot} ${styles.dotLate}`} />
                Terlambat
              </li>
              <li>
                <span className={`${styles.dot} ${styles.dotDanger}`} />
                Luar area
              </li>
            </ul>
          </div>
          <LiveMap pins={pins} inside={inside} outside={outside} />
        </section>

        <section className={`${styles.card} ${styles.feedCard}`} aria-labelledby="live-feed">
          <div className={`${styles.cardHead} ${styles.feedHead}`}>
            <h2 id="live-feed" className={styles.cardTitle}>
              Aktivitas Live
            </h2>
            <span className={styles.liveBadge}>Live</span>
          </div>
          <ul className={styles.feed} aria-live="polite">
            {activities.map((item) => (
              <li
                key={item.id}
                className={`${styles.feedItem} ${received && item.id === sampleLiveEvent.activity.id ? styles.feedNew : ''}`}
              >
                <Avatar initials={item.initials} size="M" />
                <span className={styles.feedText}>
                  <span className={styles.feedName}>{item.name}</span>
                  <span className={styles.cardMeta}>{item.detail}</span>
                </span>
                <Badge tone={statusTones[item.status]}>{liveStatusLabels[item.status]}</Badge>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {drawerOpen && today.notCheckedIn > 0 && (
        <NotCheckedInDrawer
          onClose={() => setDrawerOpen(false)}
          onRemind={(name) => {
            setDrawerOpen(false);
            setReminded(name);
          }}
        />
      )}
    </main>
  );
}
