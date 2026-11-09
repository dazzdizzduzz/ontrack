import createClient, { type Middleware } from 'openapi-fetch';
import type { components, paths } from './schema';

export type AuthTokens = components['schemas']['AuthTokens'];
export type ProblemDetails = components['schemas']['ProblemDetails'];

/** Tempat menyimpan token. Mobile: expo-secure-store. Web memakai cookie httpOnly lewat proxy, jadi tidak perlu ini. */
export interface TokenStore {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(tokens: AuthTokens): Promise<void>;
  clear(): Promise<void>;
}

export interface ApiClientOptions {
  baseUrl: string;
  tokens?: TokenStore;
  /** Dipanggil saat refresh token ditolak; arahkan pengguna ke layar login. */
  onSessionExpired?: () => void;
  fetch?: typeof globalThis.fetch;
}

// Endpoint auth tidak memakai Bearer dan tidak boleh memicu refresh.
const PUBLIC_PATHS = ['/auth/login', '/auth/refresh', '/auth/password/forgot', '/auth/password/reset'];

export function createApiClient({ baseUrl, tokens, onSessionExpired, fetch: fetchImpl }: ApiClientOptions) {
  const baseFetch = fetchImpl ?? globalThis.fetch;
  const client = createClient<paths>({ baseUrl, fetch: baseFetch });
  if (!tokens) return client;

  // Satu refresh untuk banyak request yang kena 401 bersamaan (refresh token dirotasi, hanya sah sekali).
  let refreshing: Promise<string | null> | null = null;
  const refresh = () =>
    (refreshing ??= (async () => {
      try {
        const rt = await tokens.getRefreshToken();
        if (!rt) return null;
        const res = await baseFetch(`${baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: rt }),
        });
        if (!res.ok) return null;
        const next = (await res.json()) as AuthTokens;
        await tokens.setTokens(next);
        return next.access_token;
      } catch {
        return null;
      } finally {
        refreshing = null;
      }
    })());

  const retryCopies = new WeakMap<Request, Request>();

  const auth: Middleware = {
    async onRequest({ request, schemaPath }) {
      if (PUBLIC_PATHS.includes(schemaPath)) return request;
      const at = await tokens.getAccessToken();
      if (at) request.headers.set('Authorization', `Bearer ${at}`);
      retryCopies.set(request, request.clone());
      return request;
    },
    async onResponse({ request, response, schemaPath }) {
      if (response.status !== 401 || PUBLIC_PATHS.includes(schemaPath)) return response;
      const copy = retryCopies.get(request);
      const at = await refresh();
      if (!at || !copy) {
        await tokens.clear();
        onSessionExpired?.();
        return response;
      }
      copy.headers.set('Authorization', `Bearer ${at}`);
      return baseFetch(copy);
    },
  };

  client.use(auth);
  return client;
}

export type ApiClient = ReturnType<typeof createApiClient>;
