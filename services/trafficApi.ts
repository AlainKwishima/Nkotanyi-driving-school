import type { ContentLanguageCode } from '../context/AppFlowContext';

import { apiRequest, unwrapApiPayload } from './api/client';

export type TrafficOption = {
  _id: string;
  optionText: string;
  optionImageURL: string | null;
  is_correct: boolean;
};

export type TrafficQuestion = {
  _id: string;
  question: {
    description: string;
    imageURLs: string[];
  };
  options: TrafficOption[];
  language?: string;
  isTrial?: boolean;
};

function withLanguageQuery(path: string, language?: ContentLanguageCode): string {
  if (!language) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}language=${encodeURIComponent(language)}`;
}

export async function getExamQuestions(
  accessToken: string,
  language?: ContentLanguageCode,
): Promise<TrafficQuestion[]> {
  const json = await apiRequest<unknown>(withLanguageQuery(`/api/traffic/get-questions`, language), {
    method: 'GET',
    accessToken,
  });
  const data = unwrapApiPayload<TrafficQuestion[] | unknown>(json);
  return Array.isArray(data) ? data : [];
}

export async function getSignQuestions(
  accessToken: string,
  language?: ContentLanguageCode,
): Promise<TrafficQuestion[]> {
  const json = await apiRequest<unknown>(withLanguageQuery(`/api/traffic/get-sign-questions`, language), {
    method: 'GET',
    accessToken,
  });
  const data = unwrapApiPayload<TrafficQuestion[] | unknown>(json);
  return Array.isArray(data) ? data : [];
}
