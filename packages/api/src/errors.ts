import type { ProblemDetails } from './client';

/** Error RFC 7807 dari API. `code` dipakai untuk memilih layar, misalnya GPS_WEAK atau OUTSIDE_GEOFENCE. */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors?: Record<string, string>;

  constructor(problem: ProblemDetails) {
    super(problem.detail ?? problem.title);
    this.name = 'ApiError';
    this.status = problem.status;
    this.code = problem.code;
    this.fieldErrors = problem.errors;
  }
}

function isProblem(value: unknown): value is ProblemDetails {
  return typeof value === 'object' && value !== null && 'status' in value && 'title' in value;
}

/** Ambil `data` dari hasil openapi-fetch, atau lempar ApiError. Cocok untuk queryFn TanStack Query. */
export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  // 204 No Content sah walau tanpa data.
  if (result.response.ok) return result.data as T;
  if (isProblem(result.error)) throw new ApiError(result.error);
  throw new ApiError({
    type: 'about:blank',
    title: 'Terjadi kesalahan',
    status: result.response.status,
    detail: 'Server membalas tanpa detail. Coba lagi sebentar lagi.',
  });
}
