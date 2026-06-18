import type { ContentLanguageCode } from '../context/AppFlowContext';
import { API_BASE_URL } from '../config/api';

import { apiRequest, unwrapApiPayload } from './api/client';
import { ApiError } from './api/types';

export type RoadSignStudyItem = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  language: ContentLanguageCode | null;
  viewed: boolean;
};

export type RoadSignsProgress = {
  viewed: number;
  total: number;
};

export type RoadSignsResult = {
  items: RoadSignStudyItem[];
  progress: RoadSignsProgress;
  language: ContentLanguageCode | null;
  requestedLanguage: ContentLanguageCode;
  usedFallback: boolean;
};

type RawRoadSignsPage = {
  items?: unknown;
  pagination?: {
    total?: unknown;
    totalPages?: unknown;
  };
  language?: unknown;
  progress?: {
    viewed?: unknown;
    total?: unknown;
  };
};

const PAGE_SIZE = 50;
const MAX_PAGES = 50;

function isContentLanguage(value: unknown): value is ContentLanguageCode {
  return value === 'en' || value === 'rw' || value === 'fr';
}

function normalizeContentLanguage(value: unknown): ContentLanguageCode | null {
  const language = String(value ?? '').trim().toLowerCase();
  if (!language) return null;
  if (language === 'en' || language.startsWith('eng') || language.includes('english') || language.includes('anglais')) {
    return 'en';
  }
  if (language === 'rw' || language.includes('kinyarwanda') || language.includes('rwanda')) return 'rw';
  if (
    language === 'fr' ||
    language.startsWith('fre') ||
    language.includes('french') ||
    language.includes('français') ||
    language.includes('francais')
  ) {
    return 'fr';
  }
  return null;
}

function absoluteImageUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const base = API_BASE_URL.replace(/\/+$/, '');
  return `${base}/${value.replace(/^\/+/, '')}`;
}

function pickString(item: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function pickTranslation(
  item: Record<string, unknown>,
  requestedLanguage: ContentLanguageCode,
  responseLanguage: ContentLanguageCode | null,
): Record<string, unknown> | null {
  const translations = item.translations ?? item.translation ?? item.localizedContent ?? item.contents;
  if (!Array.isArray(translations)) return null;
  const records = translations.filter(
    (translation): translation is Record<string, unknown> =>
      Boolean(translation) && typeof translation === 'object' && !Array.isArray(translation),
  );
  return (
    records.find((translation) => normalizeContentLanguage(translation.language ?? translation.lang ?? translation.locale) === requestedLanguage) ??
    records.find((translation) => normalizeContentLanguage(translation.language ?? translation.lang ?? translation.locale) === responseLanguage) ??
    records[0] ??
    null
  );
}

function parseStudyItem(
  value: unknown,
  requestedLanguage: ContentLanguageCode,
  responseLanguage: ContentLanguageCode | null,
): RoadSignStudyItem | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const translation = pickTranslation(item, requestedLanguage, responseLanguage);
  const id = pickString(item, ['_id', 'id', 'signId', 'trafficSignId']);
  const name = pickString(translation ?? {}, ['name', 'title', 'label']) || pickString(item, ['name', 'title', 'label']);
  const description =
    pickString(translation ?? {}, ['description', 'meaning', 'explanation', 'content']) ||
    pickString(item, ['description', 'meaning', 'explanation', 'content']);
  const imageUrl = pickString(item, ['imageUrl', 'imageURL', 'image_url', 'image', 'signImage', 'url', 'file', 'fileUrl']);
  const language =
    normalizeContentLanguage(translation?.language ?? translation?.lang ?? translation?.locale) ??
    normalizeContentLanguage(item.language ?? item.lang ?? item.locale) ??
    responseLanguage;

  if (!id || !name || !description || !imageUrl) return null;

  return {
    id,
    name,
    description,
    imageUrl: absoluteImageUrl(imageUrl),
    language,
    viewed: item.viewed === true,
  };
}

function parsePage(json: unknown, requestedLanguage: ContentLanguageCode): {
  items: RoadSignStudyItem[];
  rawItemCount: number;
  total: number | null;
  totalPages: number;
  language: ContentLanguageCode | null;
  progress: RoadSignsProgress | null;
} {
  const payload = unwrapApiPayload<RawRoadSignsPage>(json);
  const rawItems = Array.isArray(payload?.items) ? payload.items : null;
  if (!rawItems) {
    throw new ApiError('The road-sign API returned an invalid response.', 502);
  }

  const responseLanguage = normalizeContentLanguage(payload.language);
  const items = rawItems
    .map((item) => parseStudyItem(item, requestedLanguage, responseLanguage))
    .filter((item): item is RoadSignStudyItem => item !== null);
  if (rawItems.length > 0 && items.length === 0) {
    throw new ApiError('The road-sign API did not return usable study content.', 502);
  }

  const total =
    typeof payload.pagination?.total === 'number' && payload.pagination.total >= 0
      ? payload.pagination.total
      : null;
  const totalPages =
    typeof payload.pagination?.totalPages === 'number' && payload.pagination.totalPages > 0
      ? payload.pagination.totalPages
      : 1;
  const progress =
    typeof payload.progress?.viewed === 'number' && typeof payload.progress?.total === 'number'
      ? { viewed: payload.progress.viewed, total: payload.progress.total }
      : null;

  return {
    items,
    rawItemCount: rawItems.length,
    total,
    totalPages,
    language: responseLanguage,
    progress,
  };
}

function pagePath(page: number, language: ContentLanguageCode): string {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
    language,
  });
  return `/api/traffic-signs/get-signs?${query.toString()}`;
}

export async function getRoadSigns(
  accessToken: string,
  language: ContentLanguageCode,
  fallbackLanguages: ContentLanguageCode[] = [],
): Promise<RoadSignsResult> {
  const candidates = Array.from(new Set([language, ...fallbackLanguages]));
  let firstError: unknown = null;

  for (const candidate of candidates) {
    try {
      const result = await getRoadSignsForLanguage(accessToken, candidate);
      if (result.items.length > 0 || candidate === candidates[candidates.length - 1]) {
        return {
          ...result,
          requestedLanguage: language,
          usedFallback:
            candidate !== language ||
            (result.language !== null && result.language !== language) ||
            result.items.some((item) => item.language !== null && item.language !== language),
        };
      }
    } catch (error) {
      firstError ??= error;
    }
  }

  throw firstError instanceof Error ? firstError : new ApiError('Could not load road signs.', 500);
}

async function getRoadSignsForLanguage(
  accessToken: string,
  language: ContentLanguageCode,
): Promise<Omit<RoadSignsResult, 'requestedLanguage' | 'usedFallback'>> {
  const items: RoadSignStudyItem[] = [];
  let page = 1;
  let totalPages = 1;
  let responseLanguage: ContentLanguageCode | null = null;
  let progress: RoadSignsProgress | null = null;
  let total: number | null = null;

  do {
    const json = await apiRequest<unknown>(pagePath(page, language), {
      method: 'GET',
      accessToken,
      headers: { token: `Bearer ${accessToken}` },
    });
    const parsed = parsePage(json, language);
    items.push(...parsed.items);
    totalPages = Math.min(parsed.totalPages, MAX_PAGES);
    responseLanguage = parsed.language ?? responseLanguage;
    progress = parsed.progress ?? progress;
    total = parsed.total ?? total;

    if (parsed.rawItemCount === 0 || (total !== null && items.length >= total)) break;
    page += 1;
  } while (page <= totalPages);

  const languageItems = items.filter((item) => !item.language || item.language === language);
  const displayItems = languageItems.length > 0 ? languageItems : items;
  const uniqueItems = Array.from(new Map(displayItems.map((item) => [item.id, item])).values());

  return {
    items: uniqueItems,
    language: responseLanguage,
    progress: progress ?? {
      viewed: uniqueItems.filter((item) => item.viewed).length,
      total: total ?? uniqueItems.length,
    },
  };
}

export async function markRoadSignViewed(accessToken: string, signId: string): Promise<void> {
  await apiRequest(`/api/traffic-signs/mark-viewed/${encodeURIComponent(signId)}`, {
    method: 'POST',
    accessToken,
    headers: { token: `Bearer ${accessToken}` },
    body: {},
    skipAuthExpiredHandling: true,
  });
}
