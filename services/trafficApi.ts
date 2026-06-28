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
    explanation?: string;
    feedback?: string;
  };
  options: TrafficOption[];
  explanation?: string;
  feedback?: string;
  answerExplanation?: string;
  correction?: string;
  language?: string;
  isTrial?: boolean;
  type?: string;
  examType?: string;
  questionType?: string;
  category?: string;
  questionCategory?: string;
  mode?: string;
  isSign?: boolean;
  isRoadSign?: boolean;
  isTrafficSign?: boolean;
};

const SIGN_FETCH_ATTEMPTS = 8;
const SIGN_QUESTION_TARGET = 20;

function withQuery(path: string, params: Record<string, string | number | boolean | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    query.set(key, String(value));
  }
  if (!query.toString()) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}${query.toString()}`;
}

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function questionText(question: TrafficQuestion): string {
  return normalizeText(
    [
      question.question?.description,
      question.type,
      question.examType,
      question.questionType,
      question.category,
      question.questionCategory,
      question.mode,
    ].join(' '),
  );
}

function hasRoadSignKeyword(question: TrafficQuestion): boolean {
  const text = questionText(question);
  return [
    'road sign',
    'traffic sign',
    'sign means',
    'this sign',
    'warning sign',
    'mandatory sign',
    'prohibitory sign',
    'regulatory sign',
    'panneau',
    'panneaux',
    'signalisation',
    'ce panneau',
    'icyapa',
    'ibyapa',
    'iki cyapa',
    'ibyapa byo mu muhanda',
  ].some((keyword) => text.includes(keyword));
}

function isRoadSignQuestion(question: TrafficQuestion): boolean {
  if (question.isSign === true || question.isRoadSign === true || question.isTrafficSign === true) return true;
  const explicitType = normalizeText(
    question.type ?? question.examType ?? question.questionType ?? question.category ?? question.questionCategory ?? question.mode,
  );
  if (/(^|[-_\s])(sign|signs|road-sign|road-signs|traffic-sign|traffic-signs|panneau|ibyapa)([-_\s]|$)/.test(explicitType)) {
    return true;
  }
  return hasRoadSignKeyword(question);
}

async function fetchQuestions(
  accessToken: string,
  params: Record<string, string | number | boolean | undefined> = {},
): Promise<TrafficQuestion[]> {
  const json = await apiRequest<unknown>(withQuery(`/api/traffic/get-questions`, params), {
    method: 'GET',
    accessToken,
  });
  const data = unwrapApiPayload<TrafficQuestion[] | unknown>(json);
  return Array.isArray(data) ? data : [];
}

export async function getExamQuestions(
  accessToken: string,
  language?: ContentLanguageCode,
): Promise<TrafficQuestion[]> {
  return fetchQuestions(accessToken, {
    lang: language,
  });
}

/**
 * Exam-only sign questions. Road-sign study content lives in `roadSignsApi.ts`.
 */
export async function getSignQuestions(
  accessToken: string,
  language?: ContentLanguageCode,
): Promise<TrafficQuestion[]> {
  const byId = new Map<string, TrafficQuestion>();

  for (let attempt = 0; attempt < SIGN_FETCH_ATTEMPTS && byId.size < SIGN_QUESTION_TARGET; attempt += 1) {
    const batch = await fetchQuestions(accessToken, {
      lang: language,
      signsOnly: true,
      limit: SIGN_QUESTION_TARGET,
    });
    const filtered = batch.filter(isRoadSignQuestion);
    for (const question of batch) {
      if (filtered.includes(question)) {
        byId.set(question._id, question);
      }
      if (byId.size >= SIGN_QUESTION_TARGET) break;
    }
  }

  return [...byId.values()];
}
