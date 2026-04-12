import { apiRequest } from './api/client';
import type { StandardResponse } from './api/types';

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

export async function getExamQuestions(accessToken: string): Promise<TrafficQuestion[]> {
  const res = await apiRequest<StandardResponse<TrafficQuestion[]>>(`/api/traffic/get-questions`, {
    method: 'GET',
    accessToken,
  });
  return res.data ?? [];
}

export async function getSignQuestions(accessToken: string): Promise<TrafficQuestion[]> {
  const res = await apiRequest<StandardResponse<TrafficQuestion[]>>(`/api/traffic/get-sign-questions`, {
    method: 'GET',
    accessToken,
  });
  return res.data ?? [];
}
