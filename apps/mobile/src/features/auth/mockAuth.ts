import { isDemoCredentials } from '@on-track/core';

/** MOCK: akun demo hanya berlaku di mode development. Hapus saat kontrak auth ada. */
export function isDemoLogin(email: string, password: string): boolean {
  return __DEV__ && isDemoCredentials(email, password);
}
