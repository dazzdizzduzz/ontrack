'use client';

import Image from 'next/image';
import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import styles from './Field.module.css';

type FieldText = {
  label: string;
  /** Teks bantuan. Teks kosong (" ") hanya menjaga ruang baris, sesuai Figma. */
  helper?: string;
  /** Pesan galat; menggantikan helper dan menandai field tidak valid. */
  error?: string;
};

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & FieldText;

type ControlProps = {
  id: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
};

function FieldFrame({
  label,
  helper,
  error,
  children,
}: FieldText & { children: (control: ControlProps) => ReactNode }) {
  const id = useId();
  const message = error ?? helper;
  const hasMessage = Boolean(message?.trim());
  const messageId = `${id}-message`;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': hasMessage ? messageId : undefined,
      })}
      {message !== undefined && (
        <div className={styles.messageRow}>
          <p
            id={hasMessage ? messageId : undefined}
            className={`${styles.message} ${error ? styles.messageError : ''}`}
          >
            {message}
          </p>
        </div>
      )}
    </div>
  );
}

const controlClass = (error?: string) =>
  `${styles.control} ${error ? styles.controlError : ''}`;

function InputField({
  label,
  helper,
  error,
  trailing,
  ...inputProps
}: FieldProps & { trailing?: ReactNode }) {
  return (
    <FieldFrame label={label} helper={helper} error={error}>
      {(control) => (
        <div className={controlClass(error)}>
          <input className={styles.input} {...control} {...inputProps} />
          {trailing}
        </div>
      )}
    </FieldFrame>
  );
}

export function TextField(props: FieldProps) {
  return <InputField {...props} />;
}

export function PasswordField(props: Omit<FieldProps, 'type'>) {
  const [visible, setVisible] = useState(false);

  return (
    <InputField
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          className={styles.toggle}
          aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          <Image
            src={visible ? '/icons/eye.svg' : '/icons/eye-off.svg'}
            alt=""
            width={20}
            height={20}
            unoptimized
          />
        </button>
      }
    />
  );
}
