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
};

function parseTime(isoLike: string): number {
  const t = Date.parse(isoLike);
  return Number.isFinite(t) ? t : 0;
}

function formatHistoryDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Best-effort map for `GET /api/performance/all` items (schema not documented). */
export function mapServerPerformanceEntry(raw: unknown, index: number): PerformanceHistoryRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = String(o._id ?? o.id ?? `srv_${index}`);
  const createdRaw = o.createdAt ?? o.updatedAt ?? o.date ?? o.examDate;
  const createdAt = typeof createdRaw === 'string' ? createdRaw : new Date().toISOString();
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
      : typeof o.timeSpent === 'string'
        ? o.timeSpent
        : typeof o.durationLabel === 'string'
          ? o.durationLabel
          : '—';
  const examType = typeof o.examType === 'string' ? o.examType : typeof o.type === 'string' ? o.type : '';
  const title =
    examType.toLowerCase().includes('sign') ? 'Signs exam' : examType ? `Exam (${examType})` : 'Theory exam';

  return {
    id,
    title,
    date: formatHistoryDate(createdAt),
    status: passed ? 'PASSED' : 'FAILED',
    answers: `${correct}/${total}`,
    duration,
    sortKey: parseTime(createdAt),
    percent,
    correct,
    total,
  };
}

export function mapLocalExamRecord(r: LocalExamRecord): PerformanceHistoryRow {
  const passed = r.percent >= 60;
  return {
    id: r.id,
    title: r.mode === 'signs' ? 'Signs exam' : 'Traffic exam',
    date: formatHistoryDate(r.createdAt),
    status: passed ? 'PASSED' : 'FAILED',
    answers: `${r.correct}/${r.total}`,
    duration: r.timeLabel,
    sortKey: parseTime(r.createdAt),
    percent: r.percent,
    correct: r.correct,
    total: r.total,
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
