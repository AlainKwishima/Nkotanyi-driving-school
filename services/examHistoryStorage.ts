import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'nkotanyi.examHistory.v1';
const MAX_RECORDS = 50;

export type LocalExamAnswerDetail = {
  questionId: string;
  questionText: string;
  selectedOptionId: string | null;
  selectedOptionText: string | null;
  correctOptionId: string | null;
  correctOptionText: string | null;
  isCorrect: boolean;
};

export type LocalExamRecord = {
  id: string;
  correct: number;
  total: number;
  percent: number;
  timeLabel: string;
  mode: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  elapsedSec?: number;
  answeredCount?: number;
  answers?: LocalExamAnswerDetail[];
};

export async function readLocalExamRecords(): Promise<LocalExamRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as LocalExamRecord[]) : [];
  } catch {
    return [];
  }
}

export async function appendLocalExamRecord(entry: Omit<LocalExamRecord, 'id' | 'createdAt'>): Promise<void> {
  const prev = await readLocalExamRecords();
  const record: LocalExamRecord = {
    ...entry,
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  const next = [record, ...prev].slice(0, MAX_RECORDS);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}
