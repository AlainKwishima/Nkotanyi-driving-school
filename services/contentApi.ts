import type { ContentLanguageCode } from '../context/AppFlowContext';

import { apiRequest, unwrapApiPayload } from './api/client';

export type VideoItem = {
  _id?: string;
  title?: string;
  name?: string;
  language?: string;
  videoURL?: string;
  url?: string;
  video?: string;
  link?: string;
  duration?: string;
  durationMinutes?: number;
  thumbnail?: string;
  thumbnailURL?: string;
  imageURL?: string;
  isNew?: boolean;
  createdAt?: string;
};

export type PdfItem = {
  _id?: string;
  title?: string;
  name?: string;
  language?: string;
  pdfURL?: string;
  url?: string;
  file?: string;
  fileUrl?: string;
  isNew?: boolean;
  createdAt?: string;
};

function languageHeader(language?: ContentLanguageCode): string | undefined {
  if (!language) return undefined;
  switch (language) {
    case 'rw':
      return 'rw-RW,rw;q=0.9,en;q=0.6';
    case 'fr':
      return 'fr-FR,fr;q=0.9,en;q=0.6';
    default:
      return 'en-US,en;q=0.9';
  }
}

function normalizeLanguageCode(raw: unknown): ContentLanguageCode | null {
  const value = String(raw ?? '').toLowerCase().trim();
  if (!value) return null;
  if (value === 'en' || value.includes('english') || value.includes('anglais')) return 'en';
  if (value === 'rw' || value.includes('kinyarwanda') || value.includes('rwanda')) return 'rw';
  if (value === 'fr' || value.includes('french') || value.includes('francais') || value.includes('fran')) return 'fr';
  return null;
}

function extractVideoList(data: any): VideoItem[] {
  return Array.isArray(data) ? data : Array.isArray(data?.videos) ? data.videos : Array.isArray(data?.data) ? data.data : Array.isArray(data?.allVideos) ? data.allVideos : [];
}

function extractPdfList(data: any): PdfItem[] {
  return Array.isArray(data) ? data : Array.isArray(data?.pdfs) ? data.pdfs : Array.isArray(data?.data) ? data.data : Array.isArray(data?.allPdfs) ? data.allPdfs : [];
}

export async function getVideos(accessToken: string, language?: ContentLanguageCode): Promise<VideoItem[]> {
  const json = await apiRequest<unknown>(`/api/videos/get-all-videos`, {
    method: 'GET',
    accessToken,
    headers: language ? { 'Accept-Language': languageHeader(language) ?? '' } : undefined,
  });
  const data = unwrapApiPayload<any>(json);
  const list = extractVideoList(data);
  return language ? list.filter((item) => normalizeLanguageCode(item.language) === language) : list;
}

export async function getPdfs(accessToken: string, language?: ContentLanguageCode): Promise<PdfItem[]> {
  const json = await apiRequest<unknown>(`/api/pdf/get-all-pdf`, {
    method: 'GET',
    accessToken,
    headers: language ? { 'Accept-Language': languageHeader(language) ?? '' } : undefined,
  });
  const data = unwrapApiPayload<any>(json);
  const list = extractPdfList(data);
  return language ? list.filter((item) => normalizeLanguageCode(item.language) === language) : list;
}
