import {
  sampleLeaveQuota,
  sampleLeaveRequests,
  type LeaveQuota,
  type LeaveRequest,
} from '@on-track/core';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type LeaveValue = {
  requests: LeaveRequest[];
  quota: LeaveQuota;
  /** Pengajuan terakhir yang dikirim, untuk M41. */
  lastSubmitted: LeaveRequest | null;
  submit: (request: LeaveRequest) => void;
};

const LeaveContext = createContext<LeaveValue | null>(null);

/**
 * MOCK: pengajuan izin tersimpan di memori aplikasi sampai API ada. Cuti yang diajukan langsung
 * masuk ke kuota "menunggu" agar tidak bisa diajukan dua kali melebihi sisa kuota.
 */
export function LeaveProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<LeaveRequest[]>(sampleLeaveRequests);
  const [quota, setQuota] = useState<LeaveQuota>(sampleLeaveQuota);
  const [lastSubmitted, setLastSubmitted] = useState<LeaveRequest | null>(null);

  const submit = useCallback((request: LeaveRequest) => {
    setRequests((current) => [request, ...current]);
    if (request.type === 'cuti') {
      setQuota((current) => ({ ...current, pending: current.pending + request.days }));
    }
    setLastSubmitted(request);
  }, []);

  const value = useMemo(
    () => ({ requests, quota, lastSubmitted, submit }),
    [lastSubmitted, quota, requests, submit],
  );

  return <LeaveContext.Provider value={value}>{children}</LeaveContext.Provider>;
}

export function useLeave() {
  const value = useContext(LeaveContext);
  if (!value) throw new Error('useLeave harus dipakai di dalam LeaveProvider');
  return value;
}
