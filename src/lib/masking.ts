/**
 * Client-safe Malaysian PII Masking Utilities
 * Compliant with Malaysian Personal Data Protection Act (PDPA 2010 / 2024 Amendments)
 */

/**
 * Mask Malaysian National ID (MyKad: 940812-10-5421 -> 940812-10-****)
 */
export function maskMyKad(icNumber?: string): string {
  if (!icNumber) return '940812-10-****';
  const clean = icNumber.trim().replace(/\s+/g, '');
  if (clean.length === 14 && clean[6] === '-' && clean[9] === '-') {
    return `${clean.slice(0, 10)}****`;
  }
  if (clean.length === 12) {
    return `${clean.slice(0, 6)}-${clean.slice(6, 8)}-****`;
  }
  return clean.length > 4 ? `${clean.slice(0, clean.length - 4)}****` : '****';
}

/**
 * Mask Bank Account Number (e.g. 514123456789 -> 5141********)
 */
export function maskBankAccount(accountNum?: string): string {
  if (!accountNum) return '5141********';
  const clean = accountNum.trim().replace(/\s+/g, '');
  if (clean.length <= 4) return '****';
  return `${clean.slice(0, 4)}${'*'.repeat(Math.max(4, clean.length - 4))}`;
}

/**
 * Mask Malaysian phone number (+6012-3456789 -> +6012-***-6789)
 */
export function maskPhoneNumber(phone?: string): string {
  if (!phone) return '+601*-***-****';
  const clean = phone.trim();
  if (clean.length >= 8) {
    return `${clean.slice(0, 5)}***${clean.slice(-3)}`;
  }
  return '+601*-***-****';
}
