import type { ContentLanguageCode } from '../context/AppFlowContext';

import { apiRequest, unwrapApiPayload } from './api/client';

export type VideoItem = {
  _id?: string;
  title?: string;
  name?: string;
  videoURL?: string;
  url?: string;
  video?: string;
  link?: string;
  duration?: string;
  durationMinutes?: number;
  thumbnail?: string;
  thumbnailURL?: string;
  imageURL?: string;
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
};

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
  console.log('[API getVideos] raw payload ->', JSON.stringify(json).substring(0, 500));
  const data = unwrapApiPayload<any>(json);
  
  // if nested in data.videos, data.data, ...
  const list = Array.isArray(data) ? data : Array.isArray(data?.videos) ? data.videos : Array.isArray(data?.data) ? data.data : Array.isArray(data?.allVideos) ? data.allVideos : [];
  return list;
}

export async function getPdfs(accessToken: string, language?: ContentLanguageCode): Promise<PdfItem[]> {
  const json = await apiRequest<unknown>(withLanguageQuery(`/api/pdf/get-all-pdf`, language), {
    method: 'GET',
    accessToken,
  });
  console.log('[API getPdfs] raw payload ->', JSON.stringify(json).substring(0, 500));
  const data = unwrapApiPayload<any>(json);
  
  const list = Array.isArray(data) ? data : Array.isArray(data?.pdfs) ? data.pdfs : Array.isArray(data?.data) ? data.data : Array.isArray(data?.allPdfs) ? data.allPdfs : [];
  return list;
}
