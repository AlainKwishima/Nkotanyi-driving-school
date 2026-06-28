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

export async function savePerformance(
  accessToken: string,
  body: { examName: string; marks: number },
): Promise<unknown> {
  const raw = await apiRequest<unknown>(`/api/performance`, {
    method: 'POST',
    accessToken,
    body,
    headers: { token: `Bearer ${accessToken}` },
  });
  try {
    return unwrapApiPayload(raw);
  } catch {
    return raw;
  }
}
