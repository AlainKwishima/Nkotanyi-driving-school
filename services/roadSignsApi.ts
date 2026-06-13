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

function absoluteImageUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const base = API_BASE_URL.replace(/\/+$/, '');
  return `${base}/${value.replace(/^\/+/, '')}`;
}

function parseStudyItem(value: unknown): RoadSignStudyItem | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const id = typeof item._id === 'string' ? item._id.trim() : '';
  const name = typeof item.name === 'string' ? item.name.trim() : '';
  const description = typeof item.description === 'string' ? item.description.trim() : '';
  const imageUrl = typeof item.imageUrl === 'string' ? item.imageUrl.trim() : '';

  if (!id || !name || !description || !imageUrl) return null;

  return {
    id,
    name,
    description,
    imageUrl: absoluteImageUrl(imageUrl),
    language: isContentLanguage(item.language) ? item.language : null,
    viewed: item.viewed === true,
  };
}

function parsePage(json: unknown): {
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

  const items = rawItems.map(parseStudyItem).filter((item): item is RoadSignStudyItem => item !== null);
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
    language: isContentLanguage(payload.language) ? payload.language : null,
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
): Promise<RoadSignsResult> {
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
    const parsed = parsePage(json);
    items.push(...parsed.items);
    totalPages = Math.min(parsed.totalPages, MAX_PAGES);
    responseLanguage = parsed.language ?? responseLanguage;
    progress = parsed.progress ?? progress;
    total = parsed.total ?? total;

    if (parsed.rawItemCount === 0 || (total !== null && items.length >= total)) break;
    page += 1;
  } while (page <= totalPages);

  const languageItems = items.filter((item) => !item.language || item.language === language);
  const uniqueItems = Array.from(new Map(languageItems.map((item) => [item.id, item])).values());

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
