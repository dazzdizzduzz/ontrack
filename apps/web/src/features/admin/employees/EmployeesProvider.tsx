'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { initialEmployees, todayLabel, type Employee } from './data';

type EmployeesContextValue = {
  employees: Employee[];
  addEmployee: (employee: Employee) => void;
  updateEmployee: (employee: Employee) => void;
  deactivateEmployee: (id: string) => void;
  reactivateEmployee: (id: string) => void;
};

const EmployeesContext = createContext<EmployeesContextValue | null>(null);

/** MOCK: data hanya bertahan selama berpindah halaman, dan hilang saat dimuat ulang. */
export function EmployeesProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState(initialEmployees);

  const value = useMemo<EmployeesContextValue>(() => {
    const patch = (id: string, change: Partial<Employee>) =>
      setEmployees((rows) => rows.map((row) => (row.id === id ? { ...row, ...change } : row)));

    return {
      employees,
      addEmployee: (employee) => setEmployees((rows) => [employee, ...rows]),
      updateEmployee: (employee) => patch(employee.id, employee),
      deactivateEmployee: (id) => patch(id, { status: 'nonaktif', inactiveSince: todayLabel() }),
      reactivateEmployee: (id) => patch(id, { status: 'aktif', inactiveSince: undefined }),
    };
  }, [employees]);

  return <EmployeesContext.Provider value={value}>{children}</EmployeesContext.Provider>;
}

export function useEmployees() {
  const value = useContext(EmployeesContext);
  if (!value) throw new Error('useEmployees harus dipakai di dalam EmployeesProvider');
  return value;
}
