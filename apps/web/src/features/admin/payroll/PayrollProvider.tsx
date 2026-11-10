'use client';

import {
  samplePayrollRules,
  sampleSalaryProfiles,
  type PayrollRules,
  type SalaryLog,
  type SalaryProfile,
} from '@on-track/core';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type PayrollValue = {
  profiles: SalaryProfile[];
  rules: PayrollRules;
  saveProfile: (profile: SalaryProfile, log: SalaryLog) => void;
  saveRules: (rules: PayrollRules) => void;
};

const PayrollContext = createContext<PayrollValue | null>(null);

/**
 * MOCK: profil gaji dan aturan global tersimpan di memori selama berpindah antar-halaman payroll.
 * Saat integrasi: /payroll/salary-profiles dan /payroll/rules (draf F10).
 */
export function PayrollProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<SalaryProfile[]>(sampleSalaryProfiles);
  const [rules, setRules] = useState<PayrollRules>(samplePayrollRules);

  const saveProfile = useCallback((profile: SalaryProfile, log: SalaryLog) => {
    setProfiles((list) =>
      list.map((item) => (item.id === profile.id ? { ...profile, logs: [log, ...profile.logs] } : item)),
    );
  }, []);

  const value = useMemo(
    () => ({ profiles, rules, saveProfile, saveRules: setRules }),
    [profiles, rules, saveProfile],
  );
  return <PayrollContext.Provider value={value}>{children}</PayrollContext.Provider>;
}

export function usePayroll() {
  const value = useContext(PayrollContext);
  if (!value) throw new Error('usePayroll harus dipakai di dalam PayrollProvider');
  return value;
}
