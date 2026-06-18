import type { ContentLanguageCode } from '../context/AppFlowContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiRequest, unwrapApiPayload } from './api/client';
import { ApiError } from './api/types';

export type VideoItem = {
  _id?: string;
  title?: string;
  name?: string;
  videoURL?: string;
  videoUrl?: string;
  url?: string;
  video?: string;
  link?: string;
  videoLink?: string;
  video_link?: string;
  youtubeUrl?: string;
  youtubeURL?: string;
  embedUrl?: string;
  embedURL?: string;
  fileUrl?: string;
  fileURL?: string;
  duration?: string;
  durationMinutes?: number;
  thumbnail?: string;
  thumbnailURL?: string;
  thumbnailUrl?: string;
  imageURL?: string;
  imageUrl?: string;
};

export type PdfItem = {
  _id?: string;
  title?: string;
  name?: string;
  language?: string;
  lang?: string;
  locale?: string;
  contentLanguage?: string;
  content_language?: string;
  pdfURL?: string;
  url?: string;
  file?: string;
  fileUrl?: string;
};

const PDF_CACHE_PREFIX = 'nkotanyi.pdfs.v2';

export type PdfFetchResult = {
  items: PdfItem[];
  requestedLanguage: ContentLanguageCode;
  resolvedLanguage: ContentLanguageCode | null;
  usedFallback: boolean;
};

export function normalizeContentLanguage(value: unknown): ContentLanguageCode | null {
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

function pdfLanguage(item: PdfItem): ContentLanguageCode | null {
  return normalizeContentLanguage(
    item.language ?? item.lang ?? item.locale ?? item.contentLanguage ?? item.content_language,
  );
}

function extractContentList<T>(json: unknown, keys: string[]): T[] {
  const data = unwrapApiPayload<any>(json);
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

function withLanguageQuery(path: string, language?: ContentLanguageCode): string {
  if (!language) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}language=${encodeURIComponent(language)}`;
}

export async function getVideos(accessToken: string, language?: ContentLanguageCode): Promise<VideoItem[]> {
  const json = await apiRequest<unknown>(withLanguageQuery(`/api/videos/get-all-videos`, language), {
    method: 'GET',
    accessToken,
  });
  return extractContentList<VideoItem>(json, ['videos', 'data', 'allVideos', 'items']);
}

function uniqueLanguages(languages: Array<ContentLanguageCode | null | undefined>): ContentLanguageCode[] {
  const seen = new Set<ContentLanguageCode>();
  for (const language of languages) {
    if (language) seen.add(language);
  }
  return [...seen];
}

function resolvePdfListForLanguage(list: PdfItem[], language: ContentLanguageCode): {
  items: PdfItem[];
  resolvedLanguage: ContentLanguageCode | null;
  availableLanguages: ContentLanguageCode[];
} {
  const matching = list.filter((item) => pdfLanguage(item) === language);
  const unlabelled = list.filter((item) => pdfLanguage(item) === null);
  const availableLanguages = uniqueLanguages(list.map(pdfLanguage));

  if (matching.length > 0) {
    return { items: matching, resolvedLanguage: language, availableLanguages };
  }

  if (list.length > 0 && unlabelled.length === list.length) {
    return { items: unlabelled, resolvedLanguage: null, availableLanguages };
  }

  return { items: [], resolvedLanguage: availableLanguages[0] ?? null, availableLanguages };
}

async function fetchRawPdfs(accessToken: string, language?: ContentLanguageCode): Promise<PdfItem[]> {
  const json = await apiRequest<unknown>(withLanguageQuery(`/api/pdf/get-all-pdf`, language), {
    method: 'GET',
    accessToken,
  });
  return extractContentList<PdfItem>(json, ['pdfs', 'data', 'allPdfs', 'items']);
}

export async function getPdfs(accessToken: string, language?: ContentLanguageCode): Promise<PdfItem[]> {
  const cacheKey = language ? `${PDF_CACHE_PREFIX}.${language}` : null;
  try {
    const list = await fetchRawPdfs(accessToken, language);
    if (!language) return list;

    const { items: resolved, availableLanguages } = resolvePdfListForLanguage(list, language);

    if (resolved.length > 0) {
      if (cacheKey) await AsyncStorage.setItem(cacheKey, JSON.stringify(resolved));
      return resolved;
    }

    if (list.length > 0) {
      const available = availableLanguages.join(', ') || 'unknown';
      throw new ApiError(
        `The PDF service returned ${available} documents instead of ${language}.`,
        502,
        'PDF_LANGUAGE_MISMATCH',
        { requestedLanguage: language, availableLanguages: available },
      );
    }
    return [];
  } catch (error) {
    if (cacheKey) {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as unknown;
        if (Array.isArray(parsed)) return parsed as PdfItem[];
      }
    }
    throw error;
  }
}

export async function getPdfsWithFallback(
  accessToken: string,
  language: ContentLanguageCode,
  fallbackLanguages: ContentLanguageCode[] = [],
): Promise<PdfFetchResult> {
  const candidates = uniqueLanguages([language, ...fallbackLanguages]);
  let firstMismatch: ApiError | null = null;

  for (const candidate of candidates) {
    const cacheKey = `${PDF_CACHE_PREFIX}.${candidate}`;
    try {
      const list = await fetchRawPdfs(accessToken, candidate);
      const { items, resolvedLanguage, availableLanguages } = resolvePdfListForLanguage(list, candidate);

      if (items.length > 0) {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(items));
        return {
          items,
          requestedLanguage: language,
          resolvedLanguage,
          usedFallback: candidate !== language || (resolvedLanguage != null && resolvedLanguage !== language),
        };
      }

      if (list.length > 0 && !firstMismatch) {
        const available = availableLanguages.join(', ') || 'unknown';
        firstMismatch = new ApiError(
          `The PDF service returned ${available} documents instead of ${candidate}.`,
          502,
          'PDF_LANGUAGE_MISMATCH',
          { requestedLanguage: candidate, availableLanguages: available },
        );
      }
    } catch (error) {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as unknown;
        if (Array.isArray(parsed)) {
          return {
            items: parsed as PdfItem[],
            requestedLanguage: language,
            resolvedLanguage: candidate,
            usedFallback: candidate !== language,
          };
        }
      }
      if (error instanceof ApiError && error.code === 'PDF_LANGUAGE_MISMATCH' && !firstMismatch) {
        firstMismatch = error;
        continue;
      }
      throw error;
    }
  }

  if (firstMismatch) throw firstMismatch;
  return { items: [], requestedLanguage: language, resolvedLanguage: language, usedFallback: false };
}
