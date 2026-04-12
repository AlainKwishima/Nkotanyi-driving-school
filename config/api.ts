/**
 * Base URL for NKOTANYI / ibyapa API.
 * Override with EXPO_PUBLIC_API_URL in `.env` or app config when using staging.
 */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://www.ibyapa.com').replace(/\/$/, '');
