import type { ContentLanguageCode } from '../context/AppFlowContext';

export type PaymentReceipt = {
  orderId: string;
  paidAtLabel: string;
};

export function localeTagForContentLanguage(lang: ContentLanguageCode): string {
  if (lang === 'fr') return 'fr-FR';
  if (lang === 'rw') return 'rw-RW';
  return 'en-US';
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

/** Collect nested objects commonly used as API envelopes. */
function flattenCandidates(root: Record<string, unknown>): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [root];
  const data = asRecord(root.data);
  if (data) out.push(data);
  const payment = asRecord(root.payment) ?? (data ? asRecord(data.payment) : null);
  if (payment) out.push(payment);
  const result = asRecord(root.result) ?? (data ? asRecord(data.result) : null);
  if (result) out.push(result);
  return out;
}

function firstPick(candidates: Record<string, unknown>[], keys: string[]): string | undefined {
  for (const obj of candidates) {
    const s = pickString(obj, keys);
    if (s) return s;
  }
  return undefined;
}

function formatPaidAt(raw: unknown, locale: string, fallback: Date): string {
  if (typeof raw === 'string' && raw.trim()) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
    }
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
    }
  }
  return fallback.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * Best-effort parse of payment initiation responses (ibyapa shape may vary).
 * Always returns display-safe values (generated id / current time when missing).
 */
export function extractPaymentReceipt(data: unknown, lang: ContentLanguageCode): PaymentReceipt {
  const locale = localeTagForContentLanguage(lang);
  const now = new Date();
  const fallbackId = `NK-${now.getTime().toString(36).toUpperCase()}`;

  const root = asRecord(data) ?? {};
  const candidates = flattenCandidates(root);

  const orderId =
    firstPick(candidates, [
      'transaction_id',
      'transactionId',
      'orderId',
      'order_id',
      'reference',
      'ref',
      'paymentId',
      'payment_id',
      'trx_id',
      'trxId',
      'id',
      '_id',
    ]) ?? fallbackId;

  const dateRaw =
    firstPick(candidates, ['paid_at', 'paidAt', 'created_at', 'createdAt', 'updated_at', 'updatedAt', 'date']) ??
    candidates.map((c) => c.timestamp).find((x) => x !== undefined);

  const paidAtLabel = formatPaidAt(dateRaw, locale, now);

  return { orderId: orderId.startsWith('#') ? orderId : `#${orderId.replace(/^#+/, '')}`, paidAtLabel };
}
