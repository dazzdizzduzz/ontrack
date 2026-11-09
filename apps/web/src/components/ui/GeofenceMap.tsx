import Image from 'next/image';
import styles from './GeofenceMap.module.css';

/** Lebar lingkaran mengikuti Figma: 100 m = 160px dan 150 m = 200px. */
function circleSize(radiusMeters: number) {
  return Math.min(224, Math.max(48, 80 + radiusMeters * 0.8));
}

/** Ilustrasi peta dari Figma, bukan peta sungguhan. Radius tetap ditulis sebagai teks di luar peta. */
export function GeofenceMap({ radiusMeters }: { radiusMeters: number }) {
  const size = circleSize(radiusMeters);

  return (
    <div className={styles.map} role="img" aria-label={`Peta lokasi kantor, radius ${radiusMeters} meter`}>
      <span className={styles.roadA} />
      <span className={styles.roadB} />
      <span className={styles.roadC} />
      <span className={styles.roadD} />
      <span className={styles.center}>
        <Image src="/icons/geofence.png" alt="" width={size} height={size} unoptimized />
        <Image
          className={styles.pin}
          src="/icons/map-pin-office.svg"
          alt=""
          width={24}
          height={24}
          unoptimized
        />
      </span>
    </div>
  );
}
