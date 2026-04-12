import { apiRequest } from './api/client';
import type { StandardResponse } from './api/types';

/**
 * `GET /api/performance/all` — authenticated user's performance history.
 * Response may be a raw array or wrapped in `{ status, data }` depending on server version.
 */
export async function getPerformanceHistory(accessToken: string): Promise<unknown[]> {
  const raw = await apiRequest<unknown>(`/api/performance/all`, {
    method: 'GET',
    accessToken,
  });
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const d = (raw as { data: unknown }).data;
    if (Array.isArray(d)) return d;
  }
  return [];
}
