import { apiRequest } from './api/client';
import type { StandardResponse } from './api/types';

export type VideoItem = {
  _id?: string;
  title?: string;
  name?: string;
  videoURL?: string;
  url?: string;
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
  pdfURL?: string;
  url?: string;
  fileUrl?: string;
};

export async function getVideos(accessToken: string): Promise<VideoItem[]> {
  const res = await apiRequest<StandardResponse<VideoItem[]>>(`/api/videos/get-all-videos`, {
    method: 'GET',
    accessToken,
  });
  return res.data ?? [];
}

export async function getPdfs(accessToken: string): Promise<PdfItem[]> {
  const res = await apiRequest<StandardResponse<PdfItem[]>>(`/api/pdf/get-all-pdf`, {
    method: 'GET',
    accessToken,
  });
  return res.data ?? [];
}
