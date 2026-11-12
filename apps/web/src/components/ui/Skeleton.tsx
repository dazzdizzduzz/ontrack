import styles from './Skeleton.module.css';

/** Batang placeholder saat memuat. Lebar dalam px atau persen. */
export function Skeleton({ width, height = 12 }: { width: number | string; height?: number }) {
  return <span className={styles.bar} style={{ width, height }} aria-hidden="true" />;
}

export function SkeletonCircle({ size = 36 }: { size?: number }) {
  return <span className={styles.circle} style={{ width: size, height: size }} aria-hidden="true" />;
}
