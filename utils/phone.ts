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
