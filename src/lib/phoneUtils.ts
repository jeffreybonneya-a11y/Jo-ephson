/**
 * Ghanaian phone number normalization and validation utilities.
 * Supports local (0XXXXXXXXX) and international (+233XXXXXXXXX / 233XXXXXXXXX) formats.
 */

export function normalizeGhanaPhone(raw?: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  // Reject inputs with alphabetic characters
  if (/[a-zA-Z]/.test(trimmed)) return null;

  // Strip allowed punctuation & whitespace
  const stripped = trimmed.replace(/[\s\-().]/g, '');
  if (!/^\+?\d+$/.test(stripped)) return null;

  let digits = stripped.startsWith('+') ? stripped.slice(1) : stripped;

  if (digits.startsWith('2330') && digits.length === 13) {
    digits = '0' + digits.slice(4);
  } else if (digits.startsWith('233') && digits.length === 12) {
    digits = '0' + digits.slice(3);
  }

  // Must be canonical 10-digit Ghanaian number: 0[2-9]XXXXXXXX
  if (!/^0[2-9][0-9]{8}$/.test(digits)) {
    return null;
  }

  return digits;
}

export function isValidGhanaPhone(raw?: unknown): boolean {
  return normalizeGhanaPhone(raw) !== null;
}

/**
 * Generates equivalent phone variants for database lookups across legacy/canonical formats.
 */
export function getGhanaPhoneVariants(raw?: unknown): string[] {
  const canonical = normalizeGhanaPhone(raw);
  if (!canonical) return [];

  const withoutZero = canonical.slice(1); // 9 digits, e.g. 241234567
  return Array.from(
    new Set([
      canonical,               // 0241234567
      `233${withoutZero}`,     // 233241234567
      `+233${withoutZero}`,    // +233241234567
    ])
  );
}

export function phonesMatch(a?: unknown, b?: unknown): boolean {
  const normA = normalizeGhanaPhone(a);
  const normB = normalizeGhanaPhone(b);
  if (normA && normB) {
    return normA === normB;
  }
  return false;
}

export function formatGhanaPhoneDisplay(raw?: unknown): string {
  const canonical = normalizeGhanaPhone(raw);
  if (!canonical) return raw ? String(raw).trim() : '';
  return `${canonical.slice(0, 3)} ${canonical.slice(3, 6)} ${canonical.slice(6)}`;
}
