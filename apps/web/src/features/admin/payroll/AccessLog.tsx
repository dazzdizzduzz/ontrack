'use client';

import {
  accessResultLabels,
  accessSummary,
  sampleAccessLogs,
  sampleIncidentCode,
  shortIncidentCode,
  type PayrollAccessLog,
} from '@on-track/core';
import Image from 'next/image';
import { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { StatCard } from '@/components/ui/StatCard';
import { Toast } from '@/components/ui/Toast';
import shared from '../employees/employees.module.css';
import styles from './payslip-admin.module.css';

/** W101 · Detail satu entri log akses. */
function AccessDrawer({ log, onClose }: { log: PayrollAccessLog; onClose: () => void }) {
  const denied = log.result === 'ditolak';
  const rows: [string, string][] = [
    ['Pengguna', log.name],
    ['Peran', log.role],
    ['Waktu', log.atFull],
    ['Halaman', log.path],
    ['Perangkat', log.deviceFull],
  ];
  return (
    <Drawer
      title={denied ? 'Detail akses ditolak' : 'Detail akses'}
      subtitle={log.incidentCode ? `Kode insiden ${log.incidentCode}` : 'Akses sah · tanpa kode insiden'}
      onClose={onClose}
      onSubmit={(event) => event.preventDefault()}
    >
      <dl className={styles.kv}>
        {rows.map(([label, value]) => (
          <div key={label} className={styles.kvRow}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
        <div className={styles.kvRow}>
          <dt>Hasil</dt>
          <dd className={denied ? styles.danger : styles.strong}>{accessResultLabels[log.result]}</dd>
        </div>
      </dl>
      <Alert tone="info" title="Tercatat otomatis">
        {denied
          ? 'Percobaan ditolak server dan dicatat di log. Data ini tidak bisa diubah atau dihapus.'
          : 'Akses sah dicatat di log. Data ini tidak bisa diubah atau dihapus.'}
      </Alert>
    </Drawer>
  );
}

/**
 * W68 · Log akses payroll 30 hari (US-11 AC-1). Pratinjau `?state=detail` membuka W101.
 * MOCK: dari `sampleAccessLogs`; nanti GET /payroll/access-logs (draf F12).
 */
export function AccessLog({ preview }: { preview?: 'detail' }) {
  const [openId, setOpenId] = useState<string | null>(preview === 'detail' ? (sampleAccessLogs[0]?.id ?? null) : null);
  const [exported, setExported] = useState(false);
  const summary = accessSummary(sampleAccessLogs);
  const open = sampleAccessLogs.find((log) => log.id === openId);
  const highlighted = sampleAccessLogs.find((log) => log.incidentCode === sampleIncidentCode);

  return (
    <main className={shared.main}>
      <ButtonLink variant="ghost" compact href="/payroll/slip" className={shared.back}>
        Kembali ke Slip Gaji
      </ButtonLink>

      <header className={shared.header}>
        <div className={shared.titleBlock}>
          <h1 className={shared.title}>Log Akses Payroll</h1>
          <p className={shared.subtitle}>Semua akses ke modul payroll tercatat otomatis · 30 hari terakhir</p>
        </div>
        {/* MOCK: ekspor log belum ada di kontrak. */}
        <Button variant="secondary" compact onClick={() => setExported(true)}>
          Ekspor log
          <Image src="/icons/download.svg" alt="" width={20} height={20} unoptimized />
        </Button>
      </header>

      {exported && (
        <Toast tone="success" title="Log diekspor" onDismiss={() => setExported(false)}>
          Log akses 30 hari terakhir disiapkan sebagai Excel. Ekspor ini juga tercatat di log.
        </Toast>
      )}

      <div className={styles.kpis}>
        <StatCard label="Akses sah" value={String(summary.allowed)} meta="HRD & CEO" />
        <StatCard label="Ditolak (403)" value={String(summary.denied)} meta={`${summary.deniedUsers} pengguna`} />
        <StatCard label="Slip dibuka" value={String(summary.payslipsOpened)} meta="oleh pemilik" />
        <StatCard label="Ekspor" value={String(summary.exports)} meta="PDF/Excel" />
      </div>

      <div className={shared.tableWrap}>
        <div className={shared.tableScroll}>
          <table className={`${shared.table} ${styles.table}`}>
            <thead>
              <tr>
                <th scope="col">Pengguna</th>
                <th scope="col">Waktu</th>
                <th scope="col" className={styles.colWide}>
                  Halaman
                </th>
                <th scope="col">Perangkat</th>
                <th scope="col">Hasil</th>
                <th scope="col">Kode insiden</th>
                <th scope="col" className={shared.colActions}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {sampleAccessLogs.map((log) => {
                const denied = log.result === 'ditolak';
                return (
                  <tr key={log.id} className={log === highlighted ? styles.highlight : undefined}>
                    <td>
                      <div className={shared.person}>
                        <Avatar initials={log.initials} size="M" />
                        <div className={shared.personText}>
                          <span className={shared.personName}>{log.name}</span>
                          {log.showRole && <span className={styles.role}>{log.role}</span>}
                        </div>
                      </div>
                    </td>
                    <td>{log.at}</td>
                    <td>{log.path}</td>
                    <td>{log.device}</td>
                    <td className={denied ? styles.danger : undefined}>{accessResultLabels[log.result]}</td>
                    <td className={styles.strong}>
                      {log.incidentCode ? (
                        <abbr title={log.incidentCode}>{shortIncidentCode(log.incidentCode)}</abbr>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={shared.colActions}>
                      <Button
                        variant="ghost"
                        compact
                        aria-label={`Detail akses ${log.name} ${log.at}`}
                        onClick={() => setOpenId(log.id)}
                      >
                        Detail
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {highlighted?.incidentCode && (
        <p className={styles.lockNote}>
          <Image src="/icons/lock-16.svg" alt="" width={16} height={16} unoptimized />
          Kode insiden {highlighted.incidentCode} tercatat dari percobaan {highlighted.name} (US-11 AC-1). Log tidak
          dapat dihapus.
        </p>
      )}

      {open && <AccessDrawer log={open} onClose={() => setOpenId(null)} />}
    </main>
  );
}
