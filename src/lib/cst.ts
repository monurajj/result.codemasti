/**
 * CST ID format (matches codemasti-counsellor-admin/src/lib/cstnumber.ts):
 * cst-YYNNNNNN — 2-digit year + 6-digit sequence → 8 digits after the prefix.
 */
export const CST_DIGITS_LENGTH = 8;

export function extractCstDigits(raw: string): string {
  return raw.trim().toLowerCase().replace(/^cst-?/, "").replace(/\D/g, "");
}

export function isValidCstDigits(digits: string): boolean {
  return new RegExp(`^\\d{${CST_DIGITS_LENGTH}}$`).test(digits);
}

export function normalizeCstFromInput(raw: string): string {
  const digits = extractCstDigits(raw);
  if (!isValidCstDigits(digits)) return "";
  return `cst-${digits}`;
}
