'use client';

import { useEffect, useRef, type ComponentProps } from 'react';
import { Alert } from './Alert';
import styles from './Toast.module.css';

const DISMISS_MS = 5000;

type ToastProps = ComponentProps<typeof Alert> & { onDismiss: () => void };

/**
 * Alert yang mengambang di kanan bawah layar (W73, W79) atau selebar layar di
 * ponsel (W80). Hilang sendiri setelah 5 detik.
 */
export function Toast({ onDismiss, ...alertProps }: ToastProps) {
  const dismiss = useRef(onDismiss);

  useEffect(() => {
    dismiss.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const timer = setTimeout(() => dismiss.current(), DISMISS_MS);
    return () => clearTimeout(timer);
  }, [alertProps.title, alertProps.children]);

  return (
    <div className={styles.toast}>
      <Alert {...alertProps} />
    </div>
  );
}
