/**
 * Normalize user input to Rwanda mobile format required by payment APIs:
 * /^(078|079|072|073)\d{7}$/
 */
export function toLocalRwandaPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10 && /^0(78|79|72|73)/.test(digits)) {
    return digits;
  }
  if (digits.length === 12 && digits.startsWith('250')) {
    const rest = digits.slice(3);
    if (/^(78|79|72|73)\d{7}$/.test(rest)) {
      return `0${rest}`;
    }
  }
  if (digits.length === 9 && /^(78|79|72|73)\d{7}$/.test(digits)) {
    return `0${digits}`;
  }
  return null;
}

/**
 * Convert a Rwanda mobile number into international MSISDN form `2507XXXXXXXX`.
 * Returns `null` when the number is not a supported Rwanda mobile number.
 */
export function toIntlRwandaPhone(input: string): string | null {
  const local = toLocalRwandaPhone(input);
  if (local) {
    return `250${local.slice(1)}`;
  }
  const digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('250') && /^2507\d{8}$/.test(digits)) {
    return digits;
  }
  return null;
}

/** Rwanda mobile: 250 + 7 + 8 digits (matches validation / backend). */
const RW_INTL = /^2507\d{8}$/;
const RW_LOCAL = /^07\d{8}$/;

/** Login/signup account field: digits only, often 250… or 07… */
export function normalizeAccountPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('250') && digits.length >= 12) {
    return digits.slice(0, 12);
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `250${digits.slice(1)}`;
  }
  if (digits.length === 9 && /^[67]/.test(digits)) {
    return `250${digits}`;
  }
  return digits;
}

/**
 * Some keyboards drop the leading `0` (e.g. `782171969` instead of `0782171969`).
 */
export function normalizeLoginPhoneInput(raw: string): string {
  const t = raw.trim();
  const d = t.replace(/\D/g, '');
  if (d.length === 9 && /^7\d{8}$/.test(d)) {
    return `0${d}`;
  }
  return t;
}

/**
 * Values for `POST /api/user/login` { account }.
 * Live API behavior: the same MSISDN can be stored as `079…`/`078…` (website) or `2507…` (often after app signup).
 * We must try every canonical form; order is not reliable across accounts.
 */
export function loginAccountVariants(intl: string): string[] {
  const out: string[] = [];
  const add = (s: string) => {
    if (s && !out.includes(s)) out.push(s);
  };
  if (RW_INTL.test(intl)) {
    add(`0${intl.slice(3)}`);
    add(intl);
  } else if (RW_LOCAL.test(intl)) {
    add(intl);
    add(`250${intl.slice(1)}`);
  } else {
    add(intl);
  }
  return out;
}

/**
 * Signup `phone`: use international `2507…` so new accounts match the shape the API often persists
 * (same as accounts that already login with `250…` on the website).
 */
export function phoneForSignupApi(input: string): string {
  const intl = normalizeAccountPhone(normalizeLoginPhoneInput(input));
  if (RW_INTL.test(intl)) {
    return intl;
  }
  if (RW_LOCAL.test(intl)) {
    return `250${intl.slice(1)}`;
  }
  return intl;
}
