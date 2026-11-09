'use client';

import Image from 'next/image';
import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
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
  meta,
  children,
}: FieldText & { meta?: string; children: (control: ControlProps) => ReactNode }) {
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
          {meta && <p className={styles.message}>{meta}</p>}
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

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> &
  FieldText & {
    options: string[];
    /** Opsi kosong di urutan pertama, misalnya "Pilih divisi". */
    placeholder?: string;
  };

export function SelectField({
  label,
  helper,
  error,
  options,
  placeholder,
  ...selectProps
}: SelectFieldProps) {
  return (
    <FieldFrame label={label} helper={helper} error={error}>
      {(control) => (
        <div className={`${controlClass(error)} ${styles.selectControl}`}>
          <select className={styles.select} {...control} {...selectProps}>
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <Image
            src="/icons/chevron-down.svg"
            alt=""
            width={20}
            height={20}
            unoptimized
            className={styles.chevron}
          />
        </div>
      )}
    </FieldFrame>
  );
}

type TextareaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'value'> &
  FieldText & { value: string };

export function TextareaField({ label, helper, error, ...textareaProps }: TextareaFieldProps) {
  const { value, maxLength } = textareaProps;

  return (
    <FieldFrame
      label={label}
      helper={helper}
      error={error}
      meta={maxLength ? `${value.length}/${maxLength}` : undefined}
    >
      {(control) => (
        <div className={`${controlClass(error)} ${styles.textareaControl}`}>
          <textarea className={styles.textarea} {...control} {...textareaProps} />
        </div>
      )}
    </FieldFrame>
  );
}

export function SearchField(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return (
    <div className={styles.control}>
      <Image src="/icons/search.svg" alt="" width={20} height={20} unoptimized />
      <input type="search" className={styles.input} {...props} />
    </div>
  );
}
