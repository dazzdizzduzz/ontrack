import styles from './Avatar.module.css';

type AvatarProps = { initials: string; size?: 'S' | 'M'; muted?: boolean };

export function Avatar({ initials, size = 'S', muted = false }: AvatarProps) {
  return (
    <span
      className={`${styles.avatar} ${styles[size]} ${muted ? styles.muted : ''}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
