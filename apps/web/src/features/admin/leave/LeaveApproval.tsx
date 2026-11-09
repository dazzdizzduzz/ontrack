'use client';

import {
  formatLeaveDays,
  formatLeaveRange,
  formatLeaveRangeShort,
  formatLeaveSpan,
  formatStamp,
  formatWorkingDays,
  leaveDayLabels,
  LEAVE_REASON_MAX,
  type LeaveStatus,
} from '@on-track/core';
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
import { DivisionMenu } from '../overtime/DivisionMenu';
import {
  rejectNouns,
  sampleApprover,
  sampleApproveNote,
  sampleDecisionAt,
  samplePeriod,
  sampleRejectReasons,
  sampleRequests,
  statusBadges,
  typeLabels,
  type ApprovalRequest,
} from './data';
import styles from './leave.module.css';

/**
 * Pratinjau lewat `?state=`: `detail` (W40), `disetujui` (W41), `tolak` (W04), `tolak-kosong`
 * (W42), `tolak-terisi` (W45), `ditolak` (W43).
 */
export type LeavePreview =
  | 'detail'
  | 'disetujui'
  | 'tolak'
  | 'tolak-kosong'
  | 'tolak-terisi'
  | 'ditolak';

type ToastState = { title: string; body: string };

const KHAMDAFA = 'khamdafa-0210';
const MADE = 'made-0610';

function rangeText(row: ApprovalRequest): string {
  return formatLeaveRange(row).split(' · ')[0] ?? '';
}

/** W41: "Cuti Made Nandana P. disetujui" + hari yang tercatat di kehadiran. */
function approvedToast(row: ApprovalRequest): ToastState {
  const title =
    row.type === 'cuti' ? `Cuti ${row.name} disetujui` : `${typeLabels[row.type]} ${row.name} disetujui`;
  return {
    title,
    body: `${formatLeaveRangeShort(row)} otomatis tercatat sebagai ${leaveDayLabels[row.type]} di data kehadiran. Notifikasi terkirim ke karyawan.`,
  };
}

/** W43: kuota hanya disebut untuk cuti tahunan. */
function rejectedToast(row: ApprovalRequest): ToastState {
  const end = row.name.endsWith('.') ? '' : '.';
  const quota = row.type === 'cuti' ? ' Kuota cutinya tidak berubah.' : '';
  return {
    title: 'Pengajuan ditolak',
    body: `Alasan penolakan terkirim ke ${row.name}${end}${quota}`,
  };
}

function withDecision(
  row: ApprovalRequest,
  status: LeaveStatus,
  at: string,
  note?: string,
): ApprovalRequest {
  return { ...row, status, decision: { at, by: sampleApprover, note } };
}

const decisionStamp = (date: Date) => formatStamp(date, 'Asia/Makassar');

function initialRequests(preview?: LeavePreview): ApprovalRequest[] {
  if (preview === 'disetujui') {
    return sampleRequests.map((row) =>
      row.id === MADE ? withDecision(row, 'disetujui', sampleDecisionAt, sampleApproveNote) : row,
    );
  }
  if (preview === 'ditolak') {
    return sampleRequests.map((row) =>
      row.id === MADE ? withDecision(row, 'ditolak', sampleDecisionAt, sampleRejectReasons.made) : row,
    );
  }
  return sampleRequests;
}

function initialRejectTarget(preview?: LeavePreview): string | null {
  if (preview === 'tolak') return KHAMDAFA;
  if (preview === 'tolak-kosong' || preview === 'tolak-terisi') return MADE;
  return null;
}

function initialReason(preview?: LeavePreview): string {
  if (preview === 'tolak') return sampleRejectReasons.khamdafa;
  if (preview === 'tolak-terisi') return sampleRejectReasons.made;
  return '';
}

/** Baris label–nilai di kartu detail W40. */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailRow}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/**
 * W03 · Persetujuan Izin, W40 · Detail (drawer), W41 · Disetujui, W04/W42/W45 · Dialog tolak,
 * W43 · Ditolak. MOCK: keputusan tersimpan di memori halaman. Saat integrasi: POST
 * /leave-requests/{id}/approve menulis hari cuti ke kehadiran (FR-16, W44) dan mengirim
 * notifikasi ke karyawan (FR-15, M20).
 */
export function LeaveApproval({ preview }: { preview?: LeavePreview }) {
  const [requests, setRequests] = useState<ApprovalRequest[]>(() => initialRequests(preview));
  const [filter, setFilter] = useState<LeaveStatus>('menunggu');
  const [division, setDivision] = useState<string | null>(null);
  // Pengajuan yang baru diputuskan tetap terlihat di tab aktif agar hasilnya jelas (W41, W43).
  const [decided, setDecided] = useState<string[]>(() =>
    preview === 'disetujui' || preview === 'ditolak' ? [MADE] : [],
  );
  const [detailId, setDetailId] = useState<string | null>(() =>
    preview === 'detail' ? MADE : null,
  );
  const [note, setNote] = useState(preview === 'detail' ? sampleApproveNote : '');
  const [rejectId, setRejectId] = useState<string | null>(() => initialRejectTarget(preview));
  const [reason, setReason] = useState(() => initialReason(preview));
  // W42: pesan galat muncul setelah kolom alasan pernah disentuh lalu dibiarkan kosong.
  const [touched, setTouched] = useState(preview === 'tolak-kosong');
  const [toast, setToast] = useState<ToastState | null>(() => {
    const made = sampleRequests.find((row) => row.id === MADE);
    if (!made) return null;
    if (preview === 'disetujui') return approvedToast(made);
    return preview === 'ditolak' ? rejectedToast(made) : null;
  });

  const pending = requests.filter((row) => row.status === 'menunggu').length;
  const visible = requests.filter(
    (row) =>
      (row.status === filter || decided.includes(row.id)) &&
      (!division || row.division === division),
  );
  const detail = requests.find((row) => row.id === detailId) ?? null;
  const rejecting = requests.find((row) => row.id === rejectId) ?? null;
  const reasonMissing = reason.trim().length === 0;

  function decide(row: ApprovalRequest, status: LeaveStatus, text?: string) {
    const at = decisionStamp(new Date());
    setRequests((rows) =>
      rows.map((item) => (item.id === row.id ? withDecision(item, status, at, text) : item)),
    );
    setDecided((ids) => [...ids, row.id]);
  }

  function approve(row: ApprovalRequest, text?: string) {
    // MOCK: catatan dan notifikasi belum terkirim karena belum ada API.
    decide(row, 'disetujui', text?.trim() || undefined);
    setToast(approvedToast(row));
    closeDetail();
  }

  function openReject(row: ApprovalRequest) {
    setDetailId(null);
    setRejectId(row.id);
  }

  function closeDetail() {
    setDetailId(null);
    setNote('');
  }

  function closeReject() {
    setRejectId(null);
    setReason('');
    setTouched(false);
  }

  function handleReject(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!rejecting || reasonMissing) return;
    decide(rejecting, 'ditolak', reason.trim());
    setToast(rejectedToast(rejecting));
    closeReject();
  }

  function selectFilter(next: LeaveStatus) {
    setFilter(next);
    setDecided([]);
  }

  return (
    <main className={shared.main}>
      <header className={shared.header}>
        <div className={shared.titleBlock}>
          <h1 className={shared.title}>Izin &amp; Cuti</h1>
          <p className={shared.subtitle}>
            {pending} pengajuan menunggu persetujuan · {samplePeriod}
          </p>
        </div>
        {/* MOCK: ekspor PDF izin belum ada di kontrak. */}
        <Button variant="secondary" compact>
          Ekspor PDF
          <Image src="/icons/download.svg" alt="" width={20} height={20} unoptimized />
        </Button>
      </header>

      {toast && (
        <Toast tone="success" title={toast.title} onDismiss={() => setToast(null)}>
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
        <DivisionMenu value={division} onChange={setDivision} />
      </div>

      <div className={shared.tableWrap}>
        <div className={shared.tableScroll}>
          <table className={`${shared.table} ${styles.table}`}>
            <thead>
              <tr>
                <th scope="col">Karyawan</th>
                <th scope="col" className={styles.colType}>
                  Jenis
                </th>
                <th scope="col" className={styles.colDate}>
                  Tanggal
                </th>
                <th scope="col" className={styles.colDuration}>
                  Durasi
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
                          {/* W40: nama membuka detail beserta dampaknya. */}
                          <button
                            type="button"
                            className={styles.nameButton}
                            onClick={() => setDetailId(row.id)}
                          >
                            {row.name}
                          </button>
                          <span className={shared.personEmail}>{row.division}</span>
                        </div>
                      </div>
                    </td>
                    <td>{typeLabels[row.type]}</td>
                    <td>{rangeText(row)}</td>
                    <td>{formatLeaveDays(row.days)}</td>
                    <td>
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                    </td>
                    <td className={shared.colActions}>
                      {row.status === 'menunggu' ? (
                        <div className={styles.actions}>
                          <Button
                            variant="secondary"
                            compact
                            aria-label={`Tolak pengajuan ${row.name}`}
                            onClick={() => openReject(row)}
                          >
                            Tolak
                          </Button>
                          <Button
                            compact
                            aria-label={`Setujui pengajuan ${row.name}`}
                            onClick={() => approve(row)}
                          >
                            Setujui
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          compact
                          aria-label={`Lihat detail pengajuan ${row.name}`}
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
                    Tidak ada pengajuan dengan status ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <Drawer
          title={detail.name}
          subtitle={`${detail.position} · atasan ${detail.supervisor}`}
          leading={<Avatar initials={detail.initials ?? initialsOf(detail.name)} />}
          onClose={closeDetail}
          onSubmit={(event) => {
            event.preventDefault();
            approve(detail, note);
          }}
          actions={
            detail.status === 'menunggu' ? (
              <>
                <Button variant="secondary" compact onClick={() => openReject(detail)}>
                  Tolak
                </Button>
                <Button compact type="submit">
                  Setujui
                  <Image src="/icons/check-inverse-20.svg" alt="" width={20} height={20} unoptimized />
                </Button>
              </>
            ) : undefined
          }
        >
          <div className={styles.statusRow}>
            <p className={styles.statusText}>
              {typeLabels[detail.type]} · {formatWorkingDays(detail.days)}
            </p>
            <Badge tone={statusBadges[detail.status].tone}>
              {statusBadges[detail.status].label}
            </Badge>
          </div>

          <dl className={styles.detail}>
            <DetailRow label="Tanggal" value={formatLeaveSpan(detail, true)} />
            <DetailRow label="Diajukan" value={detail.submittedAt} />
            <DetailRow label="Alasan" value={detail.reason} />
            <DetailRow label="Lampiran" value={detail.attachment ?? '—'} />
          </dl>

          {detail.status === 'menunggu' ? (
            <>
              <p className={styles.sectionLabel}>Dampak bila disetujui</p>
              <dl className={styles.detail}>
                {detail.quotaBefore !== undefined && (
                  <DetailRow
                    label="Sisa kuota cuti"
                    value={`${detail.quotaBefore} → ${detail.quotaBefore - detail.days} hari`}
                  />
                )}
                <DetailRow
                  label={`Rekan ${detail.division} cuti di tanggal sama`}
                  value={
                    detail.colleaguesOnLeave.length ? detail.colleaguesOnLeave.join(', ') : 'Tidak ada'
                  }
                />
                <DetailRow
                  label="Tercatat di kehadiran"
                  value={`${formatLeaveRangeShort(detail)} sebagai ${leaveDayLabels[detail.type]}`}
                />
              </dl>

              {detail.tasksDue.length > 0 && (
                <Alert
                  tone="warning"
                  title={`${detail.tasksDue.length} task bertenggat di tanggal ${detail.type === 'cuti' ? 'cuti' : 'izin'}`}
                >
                  {detail.tasksDue.map((task) => `"${task.title}" · tenggat ${task.due}`).join('; ')}.
                  Pertimbangkan alihkan penanggung jawab.
                </Alert>
              )}

              <TextareaField
                label="Catatan untuk karyawan (opsional)"
                helper="Terkirim bersama notifikasi"
                maxLength={LEAVE_REASON_MAX}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </>
          ) : (
            detail.decision && (
              <>
                <p className={styles.sectionLabel}>Keputusan</p>
                <dl className={styles.detail}>
                  <DetailRow
                    label={detail.status === 'disetujui' ? 'Disetujui' : 'Ditolak'}
                    value={`${detail.decision.at} oleh ${detail.decision.by}`}
                  />
                  {detail.decision.note && (
                    <DetailRow
                      label={detail.status === 'disetujui' ? 'Catatan' : 'Alasan penolakan'}
                      value={detail.decision.note}
                    />
                  )}
                  {detail.status === 'disetujui' && (
                    <DetailRow
                      label="Tercatat di kehadiran"
                      value={`${formatLeaveRangeShort(detail)} sebagai ${leaveDayLabels[detail.type]}`}
                    />
                  )}
                </dl>
              </>
            )
          )}
        </Drawer>
      )}

      {rejecting && (
        <Dialog
          title={`Tolak ${rejectNouns[rejecting.type]} ${rejecting.name}?`}
          description={`${typeLabels[rejecting.type]} · ${formatLeaveRange(rejecting)}. Alasan penolakan wajib diisi dan akan dikirim ke karyawan.`}
          onClose={closeReject}
          onSubmit={handleReject}
          actions={
            <>
              <Button variant="secondary" compact onClick={closeReject}>
                Batal
              </Button>
              <Button variant="danger" compact type="submit" disabled={reasonMissing}>
                Tolak
              </Button>
            </>
          }
        >
          <TextareaField
            label="Alasan"
            helper="Wajib diisi"
            error={touched && reasonMissing ? 'Alasan wajib diisi sebelum menolak' : undefined}
            maxLength={LEAVE_REASON_MAX}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            onBlur={() => setTouched(true)}
            required
            autoFocus
          />
        </Dialog>
      )}
    </main>
  );
}
