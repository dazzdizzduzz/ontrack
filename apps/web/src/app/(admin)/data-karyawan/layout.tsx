import type { ReactNode } from 'react';
import { EmployeesProvider } from '@/features/admin/employees/EmployeesProvider';
import { ScheduleLocationsProvider } from '@/features/admin/schedule/ScheduleLocationsProvider';

export default function EmployeesLayout({ children }: { children: ReactNode }) {
  return (
    <EmployeesProvider>
      <ScheduleLocationsProvider>{children}</ScheduleLocationsProvider>
    </EmployeesProvider>
  );
}
