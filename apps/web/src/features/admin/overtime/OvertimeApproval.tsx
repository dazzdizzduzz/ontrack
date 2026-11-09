'use client';

import { formatClock, formatDistance, formatDuration, parseClockTime } from '@on-track/core';
import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ChipButton } from '@/components/ui/Chip';
import { Dialog } from '@/components/ui/Dialog';
import { Drawer } from '@/components/ui/Drawer';
import { TextareaField } from '@/components/ui/Field';
import { Toast } from '@/components/ui/Toast';
import { initialsOf } from '../employees/data';
import shared from '../employees/employees.module.css';
import {
  overtimeCell,
  overtimeText,
  sampleApprover,
  sampleApproveTarget,
  sampleDecisionAt,
  samplePeriod,
  sampleRejectTarget,
  sampleOvertime,
  statusBadges,
  type OvertimeRequest,
  type OvertimeStatus,
} from './data';
import { DivisionMenu } from './DivisionMenu';
import styles from './overtime.module.css';

/** Batas alasan penolakan, sama dengan alasan nonaktif di W29 (W35: "51/200"). */
const REASON_MAX = 200;
const TIME_ZONE = 'Asia/Makassar';

export type OvertimePreview = 'tolak' | 'disetujui' | 'ditolak' | 'detail' | 'divisi';

type ToastState = { tone: 'success' | 'info'; title: string; body: string };

/** "01/10 · 18:10" di zona tenant, untuk riwayat W94. */
function decisionStamp(date: Date): string {
  const day = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    timeZone: TIME_ZONE,
  }).format(date);
  return `${day} · ${formatClock(date, TIME_ZONE)}`;
}

function withDecision(
  row: OvertimeRequest,
  status: OvertimeStatus,
  at: string,
  reason?: string,
): OvertimeRequest {
  const history =
    status === 'disetujui'
      ? [
          { at, text: `Disetujui oleh ${sampleApprover}` },
          { at, text: 'Masuk perhitungan payroll Oktober' },
        ]
      : [{ at, text: `Ditolak oleh ${sampleApprover}${reason ? `: ${reason}` : ''}` }];
  return { ...row, status, history: [...row.history, ...history] };
}

function approvedToast(row: OvertimeRequest): ToastState {
  return {
    tone: 'success',
    title: 'Lembur disetujui',
    body: `${row.name} · ${overtimeText(row.minutes)} masuk ke perhitungan payroll Oktober.`,
  };
}

/** W93: toast informasi, bukan sukses, karena lembur tidak dibayar. */
function rejectedToast(row: OvertimeRequest): ToastState {
  // Nama yang sudah diakhiri titik ("Khamdafa W.") tidak diberi titik lagi.
  const end = row.name.endsWith('.') ? '' : '.';
  return { tone: 'info', title: 'Lembur ditolak', body: `Alasan dikirim ke ${row.name}${end}` };
}

function initialRequests(preview?: OvertimePreview): OvertimeRequest[] {
  if (preview === 'disetujui' || preview === 'detail') {
    return sampleOvertime.map((row) =>
      row.id === sampleApproveTarget.id ? withDecision(row, 'disetujui', sampleDecisionAt) : row,
    );
  }
  // W93: yang ditolak Khamdafa W., sama dengan dialog W35.
  if (preview === 'ditolak') {
    return sampleOvertime.map((row) =>
      row.id === sampleRejectTarget.id
        ? withDecision(row, 'ditolak', sampleDecisionAt, 'Lembur belum dikonfirmasi ke Team Lead sebelumnya.')
        : row,
    );
  }
  return sampleOvertime;
}

/** W94: baris label–nilai di panel detail. */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailRow}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/**
 * W34 · Persetujuan Lembur, W35 · Tolak (dialog), W36 · Disetujui (toast), W93 · Ditolak (toast),
 * W94 · Detail (drawer), W95 · Pilih divisi. MOCK: keputusan tersimpan di memori halaman. Saat
 * integrasi, lembur yang disetujui masuk ke payroll (F11) dan alasan penolakan dikirim ke
 * karyawan sebagai notifikasi (F07).
 */
export function OvertimeApproval({ preview }: { preview?: OvertimePreview }) {
  const [requests, setRequests] = useState<OvertimeRequest[]>(() => initialRequests(preview));
  const [filter, setFilter] = useState<OvertimeStatus>('menunggu');
  const [division, setDivision] = useState<string | null>(null);
  // Pengajuan yang baru diputuskan tetap terlihat di filter aktif agar hasilnya jelas (W36, W93).
  const [decided, setDecided] = useState<string[]>(() => {
    if (preview === 'ditolak') return [sampleRejectTarget.id];
    return preview === 'disetujui' || preview === 'detail' ? [sampleApproveTarget.id] : [];
  });
  const [rejecting, setRejecting] = useState<OvertimeRequest | null>(() =>
    preview === 'tolak' ? sampleRejectTarget : null,
  );
  const [detailId, setDetailId] = useState<string | null>(() =>
    preview === 'detail' ? sampleApproveTarget.id : null,
  );
  const [reason, setReason] = useState(
    preview === 'tolak' ? 'Lembur belum dikonfirmasi ke Team Lead sebelumnya.' : '',
  );
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(() => {
    if (preview === 'disetujui') return approvedToast(sampleApproveTarget);
    return preview === 'ditolak' ? rejectedToast(sampleRejectTarget) : null;
  });

  const pending = requests.filter((row) => row.status === 'menunggu').length;
  const visible = requests.filter(
    (row) =>
      (row.status === filter || decided.includes(row.id)) &&
      (!division || row.division === division),
  );
  const detail = requests.find((row) => row.id === detailId) ?? null;
  const reasonMissing = reason.trim().length === 0;

  function decide(row: OvertimeRequest, status: OvertimeStatus, note?: string) {
    const at = decisionStamp(new Date());
    setRequests((rows) =>
      rows.map((item) => (item.id === row.id ? withDecision(item, status, at, note) : item)),
    );
    setDecided((ids) => [...ids, row.id]);
  }

  function approve(row: OvertimeRequest) {
    decide(row, 'disetujui');
    setToast(approvedToast(row));
  }

  function closeDialog() {
    setRejecting(null);
    setReason('');
    setSubmitted(false);
  }

  function handleReject(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!rejecting || reasonMissing) return;
    // MOCK: alasan belum dikirim karena belum ada API.
    decide(rejecting, 'ditolak', reason.trim());
    setToast(rejectedToast(rejecting));
    closeDialog();
  }

  function selectFilter(next: OvertimeStatus) {
    setFilter(next);
    setDecided([]);
  }

  const detailWorked =
    detail?.clockIn &&
    formatDuration((parseClockTime(detail.clockOut) ?? 0) - (parseClockTime(detail.clockIn) ?? 0));

  return (
    <main className={shared.main}>
      <header className={shared.header}>
        <div className={shared.titleBlock}>
          <h1 className={shared.title}>Persetujuan Lembur</h1>
          <p className={shared.subtitle}>
            {pending} lembur menunggu persetujuan · {samplePeriod}
          </p>
        </div>
        {/* MOCK: ekspor PDF dikerjakan bersama rekap kehadiran (F05). */}
        <Button variant="secondary" compact>
          Ekspor PDF
          <Image src="/icons/download.svg" alt="" width={20} height={20} unoptimized />
        </Button>
      </header>

      {toast && (
        <Toast tone={toast.tone} title={toast.title} onDismiss={() => setToast(null)}>
          {toast.body}
        </Toast>
      )}

      <div className={shared.tools}>
        <ChipButton selected={filter === 'menunggu'} onClick={() => selectFilter('menunggu')}>
          Menunggu · {pending}
        </ChipButton>
        <ChipButton selected={filter === 'disetujui'} onClick={() => selectFilter('disetujui')}>
          Disetujui
        </ChipButton>
        <ChipButton selected={filter === 'ditolak'} onClick={() => selectFilter('ditolak')}>
          Ditolak
        </ChipButton>
        <DivisionMenu value={division} onChange={setDivision} defaultOpen={preview === 'divisi'} />
      </div>

      <Alert tone="info" title="Lembur dihitung otomatis">
        Dari clock-out lebih dari 30 menit setelah jam pulang, maksimal 3 jam/hari. Yang disetujui
        masuk ke payroll.
      </Alert>

      <div className={shared.tableWrap}>
        <div className={shared.tableScroll}>
          <table className={`${shared.table} ${styles.table}`}>
            <thead>
              <tr>
                <th scope="col">Karyawan</th>
                <th scope="col" className={styles.colDate}>
                  Tanggal
                </th>
                <th scope="col" className={styles.colTime}>
                  Jam pulang → clock-out
                </th>
                <th scope="col" className={styles.colDuration}>
                  Lembur
                </th>
                <th scope="col" className={styles.colStatus}>
                  Status
                </th>
                <th scope="col" className={shared.colActions}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const badge = statusBadges[row.status];
                return (
                  <tr key={row.id}>
                    <td>
                      <div className={shared.person}>
                        <Avatar initials={row.initials ?? initialsOf(row.name)} size="M" />
                        <div className={shared.personText}>
                          <span className={shared.personName}>{row.name}</span>
                          <span className={shared.personEmail}>{row.division}</span>
                        </div>
                      </div>
                    </td>
                    <td>{row.date}</td>
                    <td>
                      {row.scheduleEnd} → {row.clockOut}
                    </td>
                    <td>{overtimeCell(row.minutes)}</td>
                    <td>
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                    </td>
                    <td className={shared.colActions}>
                      {row.status === 'menunggu' ? (
                        <div className={styles.actions}>
                          <Button
                            variant="secondary"
                            compact
                            aria-label={`Tolak lembur ${row.name}`}
                            onClick={() => setRejecting(row)}
                          >
                            Tolak
                          </Button>
                          <Button
                            compact
                            aria-label={`Setujui lembur ${row.name}`}
                            onClick={() => approve(row)}
                          >
                            Setujui
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          compact
                          aria-label={`Lihat detail lembur ${row.name}`}
                          onClick={() => setDetailId(row.id)}
                        >
                          Lihat detail
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className={shared.empty}>
                    Tidak ada lembur dengan status ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rejecting && (
        <Dialog
          title={`Tolak lembur ${rejecting.name}?`}
          description={`${rejecting.date} · lembur ${overtimeText(rejecting.minutes)}. Alasan wajib diisi dan dikirim ke karyawan.`}
          onClose={closeDialog}
          onSubmit={handleReject}
          actions={
            <>
              <Button variant="secondary" compact onClick={closeDialog}>
                Batal
              </Button>
              <Button variant="danger" compact type="submit">
                Tolak lembur
              </Button>
            </>
          }
        >
          <TextareaField
            label="Alasan"
            helper="Wajib diisi"
            error={submitted && reasonMissing ? 'Wajib diisi' : undefined}
            maxLength={REASON_MAX}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            autoFocus
          />
        </Dialog>
      )}

      {detail && (
        <Drawer
          title="Detail lembur"
          onClose={() => setDetailId(null)}
          onSubmit={(event) => event.preventDefault()}
        >
          <div className={shared.person}>
            <Avatar initials={detail.initials ?? initialsOf(detail.name)} size="M" />
            <div className={shared.personText}>
              <span className={shared.personName}>{detail.name}</span>
              <span className={shared.personEmail}>
                {detail.position ? `${detail.position} · ${detail.division}` : detail.division}
              </span>
            </div>
          </div>
          <dl className={styles.detail}>
            <DetailRow label="Tanggal" value={detail.longDate} />
            {detail.clockIn && detailWorked && (
              <DetailRow
                label="Jam kerja"
                value={`${detail.clockIn} – ${detail.clockOut} (${detailWorked})`}
              />
            )}
            <DetailRow
              label="Jam pulang → clock-out"
              value={`${detail.scheduleEnd} → ${detail.clockOut}`}
            />
            <DetailRow label="Lembur" value={overtimeText(detail.minutes)} />
            {detail.distance !== undefined && (
              <DetailRow
                label="Lokasi clock-out"
                value={`Kantor Sanur · ${formatDistance(detail.distance)}`}
              />
            )}
            <DetailRow label="Status" value={statusBadges[detail.status].label} />
          </dl>
          <section className={styles.history} aria-label="Riwayat">
            <h3 className={styles.historyTitle}>Riwayat</h3>
            <ol className={styles.historyList}>
              {detail.history.map((entry) => (
                <li key={`${entry.at}-${entry.text}`}>
                  <span className={styles.historyAt}>{entry.at}</span>
                  <span>{entry.text}</span>
                </li>
              ))}
            </ol>
          </section>
        </Drawer>
      )}
    </main>
  );
}
