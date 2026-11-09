import Image from 'next/image';
import styles from './AuthBrandPanel.module.css';
import { portals, type Portal } from './portals';

export function AuthBrandPanel({ portal }: { portal: Portal }) {
  const { headline, subline, stats } = portals[portal].brand;

  return (
    <aside className={styles.panel}>
      <div className={styles.logo}>
        <Image src="/icons/logo-dot.svg" alt="" width={16} height={16} unoptimized />
        <span>On-Track</span>
      </div>
      <div className={styles.copy}>
        <p className={styles.headline}>{headline}</p>
        <p className={styles.subline}>{subline}</p>
      </div>
      <dl className={styles.stats}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <dt className={styles.statLabel}>{stat.label}</dt>
            <dd className={styles.statValue}>{stat.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
