import { normalizeAccountPhone } from './phone';

/** Rwanda mobile in international form: 250 + 7 + 8 digits (same as backend / website). */
const RW_MOBILE = /^2507\d{8}$/;

/** Phone/account field for login and signup (normalized 250… Rwanda mobile). */
export function isValidRwandaAccountPhone(raw: string): boolean {
  const normalized = normalizeAccountPhone(raw.trim());
  return RW_MOBILE.test(normalized);
}

export function validateName(name: string): { ok: true } | { ok: false; key: string } {
  const t = name.trim();
  if (!t) return { ok: false, key: 'validate.nameRequired' };
  if (t.length < 4) return { ok: false, key: 'validate.nameShort' };
  if (t.length > 80) return { ok: false, key: 'validate.nameLong' };
  return { ok: true };
}

export function validatePasswordMin(password: string, min = 8): { ok: true } | { ok: false; key: string } {
  if (!password) return { ok: false, key: 'validate.passwordRequired' };
  if (password.length < min) return { ok: false, key: 'validate.passwordShort' };
  return { ok: true };
}

/** Matches UI “security requirements” on reset password screen. */
export function validatePasswordStrong(password: string): { ok: true } | { ok: false; key: string } {
  const min = validatePasswordMin(password, 8);
  if (!min.ok) return min;
  if (!/\d/.test(password)) return { ok: false, key: 'validate.passwordNeedsNumber' };
  if (!/[^A-Za-z0-9\s]/.test(password)) return { ok: false, key: 'validate.passwordNeedsSpecial' };
  return { ok: true };
}

export function validatePasswordsMatch(a: string, b: string): { ok: true } | { ok: false; key: string } {
  if (a !== b) return { ok: false, key: 'validate.passwordMismatch' };
  return { ok: true };
}

const CARD_DIGITS_MIN = 13;
const CARD_DIGITS_MAX = 19;

export function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

/** Luhn check for card numbers (from right). */
export function passesLuhn(digits: string): boolean {
  if (digits.length < CARD_DIGITS_MIN || digits.length > CARD_DIGITS_MAX) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = parseInt(digits[i]!, 10);
    if (Number.isNaN(n)) return false;
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

export function validateCardNumber(raw: string): { ok: true } | { ok: false; key: string } {
  const d = digitsOnly(raw);
  if (d.length < CARD_DIGITS_MIN || d.length > CARD_DIGITS_MAX || !passesLuhn(d)) {
    return { ok: false, key: 'validate.cardNumber' };
  }
  return { ok: true };
}

/** MM/YY; not in the past (local calendar). */
export function validateCardExpiry(raw: string): { ok: true } | { ok: false; key: string } {
  const m = raw.trim().match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m) return { ok: false, key: 'validate.cardExpiry' };
  const month = parseInt(m[1]!, 10);
  const yy = parseInt(m[2]!, 10);
  if (month < 1 || month > 12) return { ok: false, key: 'validate.cardExpiry' };
  const yFull = 2000 + yy;
  const expEnd = new Date(yFull, month, 0, 23, 59, 59, 999);
  const now = new Date();
  if (expEnd.getTime() < now.getTime()) return { ok: false, key: 'validate.cardExpired' };
  return { ok: true };
}

export function validateCvv(raw: string): { ok: true } | { ok: false; key: string } {
  const d = digitsOnly(raw);
  if (d.length !== 3 && d.length !== 4) return { ok: false, key: 'validate.cvv' };
  return { ok: true };
}

export function validateCardHolder(raw: string): { ok: true } | { ok: false; key: string } {
  const t = raw.trim();
  if (t.length < 2) return { ok: false, key: 'validate.cardHolder' };
  return { ok: true };
}
