import { apiRequest, unwrapApiPayload } from './api/client';

/**
 * `GET /api/performance/all` — authenticated user's performance history.
 * Response may be a raw array or wrapped in `{ status, data }` depending on server version.
 */
export async function getPerformanceHistory(accessToken: string): Promise<unknown[]> {
  const raw = await apiRequest<unknown>(`/api/performance/all`, {
    method: 'GET',
    accessToken,
  });
  try {
    const data = unwrapApiPayload<unknown[] | unknown>(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
