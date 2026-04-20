import type { LocalExamRecord } from './examHistoryStorage';

export type PerformanceHistoryRow = {
  id: string;
  title: string;
  date: string;
  status: 'PASSED' | 'FAILED';
  answers: string;
  duration: string;
  sortKey: number;
  /** Optional detail for modal */
  percent: number;
  correct: number;
  total: number;
  answeredCount?: number;
  startedAt?: string;
  finishedAt?: string;
  elapsedSec?: number;
  answerDetails?: Array<{
    questionId: string;
    questionText: string;
    selectedOptionText: string | null;
    correctOptionText: string | null;
    isCorrect: boolean;
  }>;
};

function parseTime(isoLike: string): number {
  const t = Date.parse(isoLike);
  return Number.isFinite(t) ? t : 0;
}

function mapExamTitleKey(examTypeRaw: string): string {
  const examType = examTypeRaw.trim().toLowerCase();
  if (!examType) return 'performance.theoryExam';
  if (examType.includes('sign')) return 'performance.signsExam';
  if (examType.includes('traffic') || examType.includes('road')) return 'performance.trafficExam';
  return 'performance.theoryExam';
}

/** Best-effort map for `GET /api/performance/all` items (schema not documented). */
export function mapServerPerformanceEntry(raw: unknown, index: number): PerformanceHistoryRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = String(o._id ?? o.id ?? `srv_${index}`);
  const createdRaw = o.createdAt ?? o.updatedAt ?? o.date ?? o.examDate;
  const createdAt = typeof createdRaw === 'string' ? createdRaw : new Date().toISOString();
  const startedAt = typeof o.startedAt === 'string' ? o.startedAt : undefined;
  const finishedAt = typeof o.finishedAt === 'string' ? o.finishedAt : undefined;
  const correct = Number(o.correctAnswers ?? o.correct ?? o.score ?? o.obtainedMarks ?? o.marksObtained ?? 0);
  const total = Number(o.totalQuestions ?? o.total ?? o.outOf ?? o.maxQuestions ?? 20) || 20;
  const percentRaw = o.percentage ?? o.percent ?? o.scorePercent;
  const percent =
    typeof percentRaw === 'number' && Number.isFinite(percentRaw)
      ? Math.round(percentRaw)
      : Math.round((correct / Math.max(total, 1)) * 100);
  const passed = Boolean(o.passed ?? o.isPassed ?? percent >= 60);
  const durationMin = o.durationMinutes ?? o.durationInMinutes ?? o.duration;
  const duration =
    typeof durationMin === 'number' && durationMin > 0
      ? `${Math.round(durationMin)} min`
      : typeof o.duration === 'string' && o.duration.trim()
        ? String(o.duration)
      : typeof o.timeSpent === 'string'
        ? o.timeSpent
        : typeof o.durationLabel === 'string'
          ? o.durationLabel
          : '—';
  const examType = typeof o.examType === 'string' ? o.examType : typeof o.type === 'string' ? o.type : '';
  const title = mapExamTitleKey(examType);

  return {
    id,
    title,
    date: createdAt,
    status: passed ? 'PASSED' : 'FAILED',
    answers: `${correct}/${total}`,
    duration,
    sortKey: parseTime(createdAt),
    percent,
    correct,
    total,
    answeredCount: typeof o.answeredCount === 'number' ? o.answeredCount : undefined,
    startedAt,
    finishedAt,
    elapsedSec: typeof o.elapsedSec === 'number' ? o.elapsedSec : typeof o.elapsedSeconds === 'number' ? o.elapsedSeconds : undefined,
    answerDetails: Array.isArray(o.answers)
      ? o.answers
          .filter((a) => a && typeof a === 'object')
          .map((a) => {
            const r = a as Record<string, unknown>;
            return {
              questionId: String(r.questionId ?? r._id ?? r.id ?? ''),
              questionText: String(r.questionText ?? r.question ?? ''),
              selectedOptionText: typeof r.selectedOptionText === 'string' ? r.selectedOptionText : null,
              correctOptionText: typeof r.correctOptionText === 'string' ? r.correctOptionText : null,
              isCorrect: Boolean(r.isCorrect),
            };
          })
      : undefined,
  };
}

export function mapLocalExamRecord(r: LocalExamRecord): PerformanceHistoryRow {
  const passed = r.percent >= 60;
  return {
    id: r.id,
    title: r.mode === 'signs' ? 'performance.signsExam' : 'performance.theoryExam',
    date: r.finishedAt ?? r.createdAt,
    status: passed ? 'PASSED' : 'FAILED',
    answers: `${r.correct}/${r.total}`,
    duration: r.timeLabel,
    sortKey: parseTime(r.finishedAt ?? r.createdAt),
    percent: r.percent,
    correct: r.correct,
    total: r.total,
    answeredCount: r.answeredCount,
    startedAt: r.startedAt,
    finishedAt: r.finishedAt,
    elapsedSec: r.elapsedSec,
    answerDetails: r.answers?.map((a) => ({
      questionId: a.questionId,
      questionText: a.questionText,
      selectedOptionText: a.selectedOptionText,
      correctOptionText: a.correctOptionText,
      isCorrect: a.isCorrect,
    })),
  };
}

export function mergePerformanceHistory(server: unknown[], local: LocalExamRecord[]): PerformanceHistoryRow[] {
  const fromServer = server.map((x, i) => mapServerPerformanceEntry(x, i)).filter(Boolean) as PerformanceHistoryRow[];
  const fromLocal = local.map(mapLocalExamRecord);
  const byId = new Map<string, PerformanceHistoryRow>();
  for (const row of [...fromServer, ...fromLocal]) {
    byId.set(row.id, row);
  }
  return Array.from(byId.values()).sort((a, b) => b.sortKey - a.sortKey);
}
