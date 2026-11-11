'use client';

import {
  calendarWeeks,
  formatLeaveDays,
  formatLeaveRange,
  formatPeriod,
  isWeekend,
  leaveTypeLabels,
  pickRangeDate,
  sampleLeaveApprover,
  sampleLeaveToday,
  workingDaysBetween,
  type DateRange,
  type LeaveRequest,
  type MonthPeriod,
} from '@on-track/core';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import styles from './izin.module.css';

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

/** Tutup popover saat klik di luar atau Esc. */
function useDismiss(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, ref]);
}

/** KW30 · Menu pengajuan: lihat detail, atau batalkan selama masih menunggu. */
export function RequestMenu({
  request,
  onDetail,
  onCancel,
  onClose,
}: {
  request: LeaveRequest;
  onDetail: () => void;
  onCancel: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pending = request.status === 'menunggu';
  useDismiss(ref, onClose);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, []);

  return (
    <div ref={ref} className={styles.menu} role="menu" aria-label={`Menu ${leaveTypeLabels[request.type]}`}>
      <button type="button" role="menuitem" className={styles.menuItem} onClick={onDetail}>
        <Image src="/icons/menu-eye.svg" alt="" width={20} height={20} unoptimized />
        Lihat detail
      </button>
      <button
        type="button"
        role="menuitem"
        aria-disabled={!pending}
        className={`${styles.menuItem} ${styles.menuDanger}`}
        onClick={() => pending && onCancel()}
      >
        <Image src="/icons/close-danger.svg" alt="" width={20} height={20} unoptimized />
        Batalkan pengajuan
      </button>
      <p className={styles.menuNote}>
        {pending ? 'Bisa dibatalkan selama masih menunggu' : `Sudah ${request.status}, tidak bisa dibatalkan`}
      </p>
    </div>
  );
}

/** Rincian satu pengajuan dari menu "Lihat detail". */
export function RequestDetailDrawer({ request, onClose }: { request: LeaveRequest; onClose: () => void }) {
  const rows: [string, string][] = [
    ['Tanggal', formatLeaveRange(request)],
    ['Alasan', request.reason],
    ['Status', request.status === 'menunggu' ? `Menunggu ${sampleLeaveApprover.name}` : capitalize(request.status)],
    ...(request.decidedBy ? ([['Diputuskan', `${request.decidedBy}${request.decidedAt ? ` · ${request.decidedAt}` : ''}`]] as [string, string][]) : []),
    ...(request.submittedAt ? ([['Diajukan', request.submittedAt]] as [string, string][]) : []),
    ...(request.decisionNote ? ([['Catatan atasan', request.decisionNote]] as [string, string][]) : []),
  ];
  return (
    <Drawer
      title={leaveTypeLabels[request.type]}
      subtitle={formatLeaveRange(request)}
      onClose={onClose}
      onSubmit={(event) => event.preventDefault()}
    >
      <dl className={styles.kv}>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </Drawer>
  );
}

const periodOf = (iso: string): MonthPeriod => ({ year: Number(iso.slice(0, 4)), month: Number(iso.slice(5, 7)) });
const shift = ({ year, month }: MonthPeriod, delta: number): MonthPeriod => {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
};

/** KW29 · Pilih rentang tanggal: klik tanggal mulai lalu tanggal selesai, akhir pekan dilewati. */
export function DateRangePopover({
  value,
  onApply,
  onClose,
}: {
  value: DateRange;
  onApply: (range: { start: string; end: string }) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState<DateRange>(value);
  const [period, setPeriod] = useState<MonthPeriod>(periodOf(value.start ?? sampleLeaveToday));
  useDismiss(ref, onClose);
  const days = range.start ? workingDaysBetween(range.start, range.end ?? range.start) : 0;

  return (
    <div ref={ref} className={styles.picker} role="dialog" aria-label="Pilih tanggal">
      <div className={styles.pickerHead}>
        <button type="button" className={styles.pickerNav} aria-label="Bulan sebelumnya" onClick={() => setPeriod((p) => shift(p, -1))}>
          ‹
        </button>
        <span className={styles.pickerMonth} aria-live="polite">
          {formatPeriod(period)}
        </span>
        <button type="button" className={styles.pickerNav} aria-label="Bulan berikutnya" onClick={() => setPeriod((p) => shift(p, 1))}>
          ›
        </button>
      </div>
      <ul className={styles.pickerGrid}>
        {WEEKDAYS.map((day) => (
          <li key={day} className={styles.pickerWeekday} aria-hidden="true">
            {day}
          </li>
        ))}
        {calendarWeeks(period)
          .flat()
          .map((iso, index) => {
            if (!iso) return <li key={`x${index}`} aria-hidden="true" />;
            const edge = iso === range.start || iso === range.end;
            const inside = Boolean(range.start && range.end && iso > range.start && iso < range.end);
            const className = [
              styles.pickerDay,
              iso === sampleLeaveToday && !edge && styles.pickerToday,
              inside && styles.pickerInside,
              edge && styles.pickerEdge,
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <li key={iso}>
                <button
                  type="button"
                  className={className}
                  disabled={isWeekend(iso)}
                  aria-pressed={edge}
                  aria-label={`${Number(iso.slice(8))} ${formatPeriod(period)}`}
                  onClick={() => setRange((current) => pickRangeDate(current, iso))}
                >
                  {Number(iso.slice(8))}
                </button>
              </li>
            );
          })}
      </ul>
      <div className={styles.pickerFoot}>
        <span className={styles.meta}>
          {range.start ? `${formatLeaveDays(days)} kerja` : 'Pilih tanggal mulai'}
        </span>
        <Button
          compact
          disabled={!range.start}
          onClick={() => range.start && onApply({ start: range.start, end: range.end ?? range.start })}
        >
          Pakai
        </Button>
      </div>
    </div>
  );
}
