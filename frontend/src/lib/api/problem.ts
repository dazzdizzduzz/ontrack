/** Galat bergaya RFC 7807 (application/problem+json) yang dikirim Route Handler ke browser. */
export type Problem = {
  type: string;
  title: string;
  status: number;
  detail?: string;
};

export const PROBLEM_CONTENT_TYPE = 'application/problem+json';

export function isProblem(value: unknown): value is Problem {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.title === 'string' && typeof candidate.status === 'number';
}
