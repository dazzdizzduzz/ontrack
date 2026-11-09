import Image from 'next/image';
import type { InputHTMLAttributes } from 'react';
import styles from './Toggle.module.css';

type ToggleProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'> & {
  label: string;
};

export function Toggle({ label, checked, ...props }: ToggleProps) {
  return (
    <label className={styles.toggle}>
      <input type="checkbox" role="switch" className={styles.input} checked={checked} {...props} />
      <Image
        className={styles.track}
        src={checked ? '/icons/toggle-on.svg' : '/icons/toggle-off.svg'}
        alt=""
        width={44}
        height={24}
        unoptimized
      />
      <span>{label}</span>
    </label>
  );
}
