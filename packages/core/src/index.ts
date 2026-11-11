export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCK_SECONDS = 15 * 60;
export const RESEND_RESET_SECONDS = 45;

export type LoginAttemptState = { attempts: number; lockSeconds: number };

export const initialLoginAttempts: LoginAttemptState = { attempts: 0, lockSeconds: 0 };

/** Status contoh dari Figma: 3/5 percobaan salah, dan akun terkunci sisa 14:32. */
export const loginPreviews = {
  salah: { attempts: 3, lockSeconds: 0 },
  terkunci: { attempts: MAX_LOGIN_ATTEMPTS, lockSeconds: 14 * 60 + 32 },
} as const satisfies Record<string, LoginAttemptState>;

export type LoginPreview = keyof typeof loginPreviews;

export function parseLoginPreview(value: unknown): LoginPreview | undefined {
  return value === 'salah' || value === 'terkunci' ? value : undefined;
}

/**
 * MOCK tahap tampilan: belum ada API, jadi layar login memakai reducer ini untuk
 * mensimulasikan gagal masuk dan penguncian akun. Ganti dengan respons API
 * saat kontrak auth tersedia.
 */
export function loginAttemptsReducer(
  state: LoginAttemptState,
  action: 'failed' | 'tick',
): LoginAttemptState {
  if (action === 'failed') {
    const attempts = state.attempts + 1;
    return { attempts, lockSeconds: attempts >= MAX_LOGIN_ATTEMPTS ? LOGIN_LOCK_SECONDS : 0 };
  }
  const lockSeconds = state.lockSeconds - 1;
  return lockSeconds > 0 ? { ...state, lockSeconds } : initialLoginAttempts;
}

/** 872 -> "14:32" */
export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** "daze@studiotigapagi.com" -> "d***@studiotigapagi.com" */
export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at < 1) return email;
  return `${email.charAt(0)}***${email.slice(at)}`;
}

export function isValidEmail(email: string): boolean {
  return /^\S+@\S+\.\S+$/.test(email.trim());
}

export function checkPassword(password: string) {
  return {
    minLength: password.length >= 8,
    lettersAndDigits: /\p{L}/u.test(password) && /\d/.test(password),
    uppercase: /\p{Lu}/u.test(password),
  };
}

/** "7250000.00" -> "7.250.000". Memakai string, bukan float, agar nilai uang tidak bergeser. */
export function formatThousands(amount: string): string {
  const [whole = ''] = amount.split('.');
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** "7250000.00" -> "Rp 7.250.000" */
export function formatRupiah(amount: string): string {
  return `Rp ${formatThousands(amount)}`;
}

/** "7.250.000" -> "7250000.00"; tanpa angka menghasilkan undefined. */
export function parseRupiahInput(input: string): string | undefined {
  const digits = input.replace(/\D/g, '');
  return digits ? `${digits}.00` : undefined;
}

/**
 * MOCK tahap tampilan: akun demo untuk mencoba alur login selama API belum
 * tersedia. Setiap aplikasi wajib membatasinya ke mode development. Hapus saat
 * kontrak auth ada.
 */
export function isDemoCredentials(email: string, password: string): boolean {
  return email.trim().toLowerCase() === 'demo@ontrack.test' && password === 'Demo1234';
}

export * from './attendance';
export * from './attendanceHistory';
export * from './leave';
export * from './notifications';
export * from './tasks';
export * from './payroll';
export * from './payslip';
export * from './dashboard';
