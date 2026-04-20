import Constants from 'expo-constants';

const DEFAULT_API = 'https://www.ibyapa.com';

function pickNonEmptyUrl(...candidates: Array<string | undefined>): string | undefined {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim().length > 0) {
      // Strip all trailing slashes — one leftover slash + path `/api/...` becomes `//api` and nginx returns 404.
      return c.trim().replace(/\/+$/, '');
    }
  }
  return undefined;
}

const fromExpoExtra =
  typeof Constants.expoConfig?.extra?.apiUrl === 'string' ? Constants.expoConfig.extra.apiUrl : undefined;

/**
 * Base URL for NKOTANYI / ibyapa API (same backend as the website).
 * Priority: `expo.extra.apiUrl` (from app.config.js) → `EXPO_PUBLIC_API_URL` → production.
 *
 * Note: `??` alone is unsafe here — an empty `EXPO_PUBLIC_API_URL` would yield `''`, and fetch would use
 * **relative** `/api/...` URLs against the Expo dev server (Metro), producing 404 on web.
 */
export const API_BASE_URL = pickNonEmptyUrl(fromExpoExtra, process.env.EXPO_PUBLIC_API_URL) ?? DEFAULT_API;
