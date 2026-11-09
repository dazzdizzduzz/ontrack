import type { InputHTMLAttributes } from 'react';
import styles from './Checkbox.module.css';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  /** Sembunyikan label secara visual, tetapi tetap dibaca screen reader. */
  hideLabel?: boolean;
};

export function Checkbox({ label, hideLabel = false, ...props }: CheckboxProps) {
  return (
    <label className={`${styles.checkbox} ${hideLabel ? styles.iconOnly : ''}`}>
      <input type="checkbox" className={styles.control} {...props} />
      <span className={hideLabel ? styles.srOnly : undefined}>{label}</span>
    </label>
  );
}
