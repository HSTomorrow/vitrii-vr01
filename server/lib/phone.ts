// Normalizes a Brazilian phone/whatsapp/celular number to always carry the +55
// country code, so wa.me links built elsewhere (which just strip non-digits)
// resolve correctly. A number is treated as already carrying the country code
// when its digit count (12 or 13) matches DDI+DDD+number - a bare DDD+number
// is always 10 or 11 digits, even for DDD 55 (Santa Maria/RS), so this can't
// misfire on that DDD.
export function normalizeBRPhone(
  raw: string | null | undefined,
): string | null {
  if (raw === null || raw === undefined) return raw ?? null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const withDDI =
    digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
      ? digits
      : `55${digits}`;
  return `+${withDDI}`;
}
