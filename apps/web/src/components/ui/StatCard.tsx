import styles from './StatCard.module.css';

type StatCardProps = { label: string; value: string; meta: string };

export function StatCard({ label, value, meta }: StatCardProps) {
  return (
    <div className={styles.card}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value}</p>
      <p className={styles.meta}>{meta}</p>
    </div>
  );
}
