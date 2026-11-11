"use client";

import {
  LEAVE_ATTACHMENT_MAX_BYTES,
  LEAVE_REASON_MAX,
  formLeaveTypes,
  formatDateInput,
  formatFileSize,
  formatLeaveDays,
  formatLeaveRange,
  formatLeaveRangeShort,
  leaveFormLabels,
  leaveTypeLabels,
  parseDateInput,
  sampleLeaveApprover,
  sampleLeaveDraft,
  sampleLeaveQuota,
  sampleLeaveRequests,
  sampleLowLeaveQuota,
  validateLeave,
  type LeaveDraft,
  type LeaveQuota,
  type LeaveRequest,
  type LeaveStatus,
} from "@on-track/core";
import Image from "next/image";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChipButton } from "@/components/ui/Chip";
import { Drawer } from "@/components/ui/Drawer";
import { SelectField, TextareaField, TextField } from "@/components/ui/Field";
import { Toast } from "@/components/ui/Toast";
import {
  DateRangePopover,
  RequestDetailDrawer,
  RequestMenu,
} from "./IzinParts";
import styles from "./izin.module.css";

export type IzinPreview =
  "ajukan" | "baru" | "tanggal" | "kuota" | "terkirim" | "menu";

const WEEKDAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];
const weekdayOf = (iso: string) =>
  WEEKDAYS[new Date(`${iso}T00:00:00Z`).getUTCDay()] ?? "";

const statusBadges: Record<
  LeaveStatus,
  { tone: "warning" | "success" | "danger"; label: string }
> = {
  menunggu: { tone: "warning", label: "Menunggu" },
  disetujui: { tone: "success", label: "Disetujui" },
  ditolak: { tone: "danger", label: "Ditolak" },
};

const filters: { label: string; value: LeaveStatus | null }[] = [
  { label: "Semua", value: null },
  { label: "Menunggu", value: "menunggu" },
  { label: "Disetujui", value: "disetujui" },
  { label: "Ditolak", value: "ditolak" },
];

const typeOptions = formLeaveTypes.map((type) => leaveFormLabels[type]);
const emptyDraft: LeaveDraft = { type: "cuti", start: "", end: "", reason: "" };

/** Pengajuan cuti contoh KW19 (sudah terkirim, menunggu). */
const sentSample: LeaveRequest = {
  id: "cuti-contoh",
  type: "cuti",
  start: "2026-10-06",
  end: "2026-10-08",
  days: 3,
  reason: "Acara keluarga di Singaraja",
  status: "menunggu",
};

function QuotaBar({ quota }: { quota: LeaveQuota }) {
  return (
    <div className={styles.quotaBar}>
      <div className={styles.quotaTop}>
        <span className={styles.quotaLabel}>Cuti tahunan terpakai</span>
        <span className={styles.meta}>
          {quota.used} dari {quota.total} hari · sisa {quota.total - quota.used}
        </span>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-label="Cuti tahunan terpakai"
        aria-valuemin={0}
        aria-valuemax={quota.total}
        aria-valuenow={quota.used}
      >
        <span
          className={styles.fill}
          style={{ width: `${Math.min(1, quota.used / quota.total) * 100}%` }}
        />
      </div>
    </div>
  );
}

/**
 * KW17 · Izin & Cuti (Web), KW18 · Ajukan (drawer), KW19 · Terkirim (toast), KW20 · Kuota tidak
 * cukup, KW29 · Pilih tanggal (`?state=tanggal`), KW30 · Menu pengajuan (`?state=menu`). MOCK: pengajuan tersimpan di memori halaman; lampiran belum diunggah ke server.
 */
export function IzinCuti({ preview }: { preview?: IzinPreview }) {
  const [requests, setRequests] = useState<LeaveRequest[]>(() =>
    preview === "terkirim"
      ? [sentSample, ...sampleLeaveRequests]
      : sampleLeaveRequests,
  );
  const [quota, setQuota] = useState<LeaveQuota>(() => {
    if (preview === "kuota") return sampleLowLeaveQuota;
    return preview === "terkirim"
      ? { ...sampleLeaveQuota, pending: 3 }
      : sampleLeaveQuota;
  });
  const [filter, setFilter] = useState<LeaveStatus | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(
    preview === "ajukan" ||
      preview === "baru" ||
      preview === "kuota" ||
      preview === "tanggal",
  );
  const [draft, setDraft] = useState<LeaveDraft>(
    preview === "ajukan" || preview === "kuota" || preview === "tanggal"
      ? sampleLeaveDraft
      : emptyDraft,
  );
  const [pickerOpen, setPickerOpen] = useState(preview === "tanggal");
  const [menuId, setMenuId] = useState<string | null>(
    preview === "menu" ? (sampleLeaveRequests[0]?.id ?? null) : null,
  );
  const [detail, setDetail] = useState<LeaveRequest | null>(null);
  const [cancelled, setCancelled] = useState<LeaveRequest | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [toast, setToast] = useState<LeaveRequest | null>(
    preview === "terkirim" ? sentSample : null,
  );

  const { errors, days } = validateLeave(draft, quota, {
    checkRequired: submitted,
  });
  const quotaBlocked =
    draft.type === "cuti" && errors.form?.title === "Kuota cuti tidak cukup";
  const showForm = errors.form && (submitted || quotaBlocked);
  const startIso = parseDateInput(draft.start);
  const endIso = parseDateInput(draft.end);
  const visible = requests.filter(
    (request) => !filter || request.status === filter,
  );
  const typeLabel = leaveTypeLabels[draft.type];

  function cancelRequest(request: LeaveRequest) {
    setRequests((current) => current.filter((item) => item.id !== request.id));
    if (request.type === "cuti" && request.status === "menunggu") {
      setQuota((current) => ({
        ...current,
        pending: Math.max(0, current.pending - request.days),
      }));
    }
    setMenuId(null);
    setToast(null);
    setCancelled(request);
  }

  const update = (patch: Partial<LeaveDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  function openDrawer() {
    setDraft(emptyDraft);
    setSubmitted(false);
    setFileError(null);
    setDrawerOpen(true);
  }

  function pickFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setFileError(null);
    if (!file) return;
    const isPdf = file.type === "application/pdf";
    if (!isPdf && file.type !== "image/jpeg") {
      setFileError("Gunakan file PDF atau JPG.");
      return;
    }
    if (file.size > LEAVE_ATTACHMENT_MAX_BYTES) {
      setFileError("Ukuran file lebih dari 5 MB.");
      return;
    }
    // MOCK: file hanya disimpan namanya; unggah ke server setelah API pengajuan ada.
    update({
      attachment: {
        name: file.name,
        sizeBytes: file.size,
        kind: isPdf ? "PDF" : "JPG",
      },
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    const result = validateLeave(draft, quota);
    if (Object.keys(result.errors).length > 0 || !startIso || !endIso) return;
    const request: LeaveRequest = {
      // MOCK: id sementara; nanti dari server.
      id: `${draft.type}-${startIso}-${requests.length}`,
      type: draft.type,
      start: startIso,
      end: endIso,
      days: result.days,
      reason: draft.reason.trim(),
      status: "menunggu",
      attachment: draft.attachment,
    };
    setRequests((current) => [request, ...current]);
    if (request.type === "cuti")
      setQuota((current) => ({
        ...current,
        pending: current.pending + request.days,
      }));
    setDrawerOpen(false);
    setFilter(null);
    setToast(request);
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Izin &amp; Cuti</h1>
          <p className={styles.subtitle}>
            Ajukan izin, sakit, atau cuti dan pantau statusnya
          </p>
        </div>
        <Button compact onClick={openDrawer}>
          Ajukan izin baru
          <Image
            src="/icons/plus-inverse.svg"
            alt=""
            width={20}
            height={20}
            unoptimized
          />
        </Button>
      </header>

      {toast && (
        <Toast
          tone="success"
          title="Pengajuan terkirim"
          onDismiss={() => setToast(null)}
        >
          {leaveTypeLabels[toast.type]} {formatLeaveRangeShort(toast)} ·{" "}
          {sampleLeaveApprover.name} sudah dinotifikasi.
        </Toast>
      )}

      {cancelled && (
        <Toast
          tone="success"
          title="Pengajuan dibatalkan"
          onDismiss={() => setCancelled(null)}
        >
          {leaveTypeLabels[cancelled.type]} {formatLeaveRangeShort(cancelled)}{" "}
          dibatalkan; atasan tidak perlu menyetujui lagi.
        </Toast>
      )}

      <div className={styles.columns}>
        <section className={styles.card} aria-labelledby="kuota-cuti">
          <h2 id="kuota-cuti" className={styles.cardTitle}>
            Kuota cuti {quota.year}
          </h2>
          <QuotaBar quota={quota} />
          <dl className={styles.kv}>
            <div>
              <dt>Jatah per tahun</dt>
              <dd>{quota.total} hari</dd>
            </div>
            <div>
              <dt>Terpakai</dt>
              <dd>{quota.used} hari</dd>
            </div>
            <div>
              <dt>Menunggu persetujuan</dt>
              <dd>{quota.pending} hari</dd>
            </div>
            <div>
              <dt>Reset kuota</dt>
              <dd>{quota.resetsOn}</dd>
            </div>
          </dl>
          <p className={styles.meta}>
            Izin dan sakit tidak memotong kuota cuti. Sakit lebih dari 1 hari
            wajib melampirkan surat dokter.
          </p>
        </section>

        <section className={styles.card} aria-labelledby="pengajuan-saya">
          <h2 id="pengajuan-saya" className={styles.cardTitle}>
            Pengajuan saya
          </h2>
          <div className={styles.chips}>
            {filters.map((item) => (
              <ChipButton
                key={item.label}
                selected={item.value === filter}
                showCheck={false}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </ChipButton>
            ))}
          </div>
          <ul className={styles.list}>
            {visible.map((request) => {
              const badge = statusBadges[request.status];
              return (
                <li key={request.id} className={styles.itemWrap}>
                  <button
                    type="button"
                    className={`${styles.item} ${styles.itemButton}`}
                    aria-haspopup="menu"
                    aria-expanded={menuId === request.id}
                    onClick={() =>
                      setMenuId(menuId === request.id ? null : request.id)
                    }
                  >
                    <span className={styles.itemTop}>
                      <span className={styles.itemTitle}>
                        {leaveTypeLabels[request.type]}
                      </span>
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                    </span>
                    <span className={styles.itemDate}>
                      <Image
                        src="/icons/calendar-16.svg"
                        alt=""
                        width={16}
                        height={16}
                        unoptimized
                      />
                      {formatLeaveRange(request)}
                    </span>
                    <span className={styles.meta}>{request.reason}</span>
                  </button>
                  {menuId === request.id && (
                    <RequestMenu
                      request={request}
                      onClose={() => setMenuId(null)}
                      onDetail={() => {
                        setMenuId(null);
                        setDetail(request);
                      }}
                      onCancel={() => cancelRequest(request)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
          {visible.length === 0 && (
            <p className={styles.empty}>
              Belum ada pengajuan dengan status ini.
            </p>
          )}
        </section>
      </div>

      {drawerOpen && (
        <Drawer
          title="Ajukan izin / cuti"
          onClose={() => setDrawerOpen(false)}
          onSubmit={submit}
          actions={
            <>
              <Button
                variant="secondary"
                compact
                onClick={() => setDrawerOpen(false)}
              >
                Batal
              </Button>
              <Button compact type="submit" disabled={quotaBlocked}>
                Ajukan {typeLabel.replace(" tahunan", "")}
                <Image
                  src="/icons/send.svg"
                  alt=""
                  width={20}
                  height={20}
                  unoptimized
                />
              </Button>
            </>
          }
        >
          {draft.type === "cuti" && <QuotaBar quota={quota} />}
          {showForm && errors.form && (
            <Alert tone="danger" title={errors.form.title}>
              {errors.form.body}
            </Alert>
          )}
          <SelectField
            label="Jenis pengajuan"
            options={typeOptions}
            value={leaveFormLabels[draft.type]}
            onChange={(event) => {
              const type = formLeaveTypes.find(
                (item) => leaveFormLabels[item] === event.target.value,
              );
              if (type) update({ type });
            }}
          />
          <div className={styles.datesWrap}>
            <div className={styles.dates}>
              <TextField
                label="Tanggal mulai"
                placeholder="dd/mm/yyyy"
                inputMode="numeric"
                maxLength={10}
                value={draft.start}
                onChange={(event) => update({ start: event.target.value })}
                onClick={() => setPickerOpen(true)}
                helper={startIso ? weekdayOf(startIso) : " "}
                error={errors.start}
              />
              <TextField
                label="Tanggal selesai"
                placeholder="dd/mm/yyyy"
                inputMode="numeric"
                maxLength={10}
                value={draft.end}
                onChange={(event) => update({ end: event.target.value })}
                onClick={() => setPickerOpen(true)}
                helper={
                  endIso && startIso
                    ? `${weekdayOf(endIso)} · ${formatLeaveDays(days)} kerja`
                    : " "
                }
                error={errors.end}
              />
            </div>
            {pickerOpen && (
              <DateRangePopover
                value={{ start: startIso, end: endIso }}
                onClose={() => setPickerOpen(false)}
                onApply={({ start, end }) => {
                  update({
                    start: formatDateInput(start),
                    end: formatDateInput(end),
                  });
                  setPickerOpen(false);
                }}
              />
            )}
          </div>
          <TextareaField
            label="Alasan"
            helper="Wajib diisi"
            maxLength={LEAVE_REASON_MAX}
            value={draft.reason}
            onChange={(event) => update({ reason: event.target.value })}
            error={errors.reason}
          />
          <div className={styles.attachment}>
            <span className={styles.attachmentLabel}>
              {draft.type === "sakit"
                ? "Surat dokter (wajib untuk sakit > 1 hari)"
                : "Lampiran (opsional)"}
            </span>
            {draft.attachment ? (
              <div className={styles.file}>
                <Image
                  src="/icons/paperclip.svg"
                  alt=""
                  width={20}
                  height={20}
                  unoptimized
                />
                <span className={styles.fileText}>
                  <span className={styles.fileName}>
                    {draft.attachment.name}
                  </span>
                  <span className={styles.meta}>
                    {draft.attachment.kind} ·{" "}
                    {formatFileSize(draft.attachment.sizeBytes)} · terunggah
                  </span>
                </span>
                <button
                  type="button"
                  className={styles.remove}
                  aria-label={`Hapus lampiran ${draft.attachment.name}`}
                  onClick={() => update({ attachment: undefined })}
                >
                  <Image
                    src="/icons/close-20.svg"
                    alt=""
                    width={20}
                    height={20}
                    unoptimized
                  />
                </button>
              </div>
            ) : (
              <label
                className={`${styles.upload} ${errors.attachment ? styles.uploadError : ""}`}
              >
                <input
                  type="file"
                  accept="application/pdf,image/jpeg"
                  className={styles.fileInput}
                  onChange={pickFile}
                />
                <span className={styles.uploadIcon}>
                  <Image
                    src="/icons/upload.svg"
                    alt=""
                    width={20}
                    height={20}
                    unoptimized
                  />
                </span>
                <span className={styles.fileText}>
                  <span className={styles.fileName}>
                    Unggah surat dokter / dokumen
                  </span>
                  <span className={styles.meta}>PDF atau JPG, maks. 5 MB</span>
                </span>
              </label>
            )}
            {(fileError ?? errors.attachment) && (
              <span className={styles.error} role="alert">
                {fileError ?? errors.attachment}
              </span>
            )}
          </div>
          {!showForm && (
            <Alert
              tone="info"
              title={
                draft.type === "cuti"
                  ? `Dikirim ke ${sampleLeaveApprover.role}`
                  : "Tidak memotong kuota cuti"
              }
            >
              {sampleLeaveApprover.name} akan menerima notifikasi untuk
              menyetujui.
            </Alert>
          )}
        </Drawer>
      )}

      {detail && (
        <RequestDetailDrawer request={detail} onClose={() => setDetail(null)} />
      )}
    </main>
  );
}
