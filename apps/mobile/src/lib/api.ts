import { createApiClient, type AuthTokens, type TokenStore } from '@on-track/api';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'ontrack.at';
const REFRESH_KEY = 'ontrack.rt';

/**
 * Alamat API. Isi EXPO_PUBLIC_API_URL di .env.local bila perlu.
 * Default: mock Prism port 4010 di komputer yang menjalankan Metro, karena di HP "localhost" adalah HP itu sendiri.
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
  return `http://${host}:4010`; // Prism tidak memakai awalan /v1
}

export const API_BASE_URL = resolveBaseUrl();

export const tokenStore: TokenStore = {
  getAccessToken: () => SecureStore.getItemAsync(ACCESS_KEY),
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_KEY),
  async setTokens(tokens: AuthTokens) {
    await SecureStore.setItemAsync(ACCESS_KEY, tokens.access_token);
    await SecureStore.setItemAsync(REFRESH_KEY, tokens.refresh_token);
  },
  async clear() {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};

export const api = createApiClient({
  baseUrl: API_BASE_URL,
  tokens: tokenStore,
  onSessionExpired: () => router.replace('/login'),
});
