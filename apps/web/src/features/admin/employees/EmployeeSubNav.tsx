import { ChipLink } from '@/components/ui/Chip';
import styles from './EmployeeSubNav.module.css';

const items = [
  { href: '/data-karyawan', label: 'Daftar karyawan' },
  { href: '/data-karyawan/jadwal-lokasi', label: 'Jadwal & lokasi' },
  { href: '/data-karyawan/peran-akses', label: 'Peran & akses' },
];

export function EmployeeSubNav({ current }: { current: string }) {
  return (
    <nav aria-label="Bagian data karyawan" className={styles.subNav}>
      {items.map((item) => (
        <ChipLink
          key={item.href}
          href={item.href}
          prefetch={false}
          selected={item.href === current}
        >
          {item.label}
        </ChipLink>
      ))}
    </nav>
  );
}
