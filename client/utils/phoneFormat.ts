// Client-side mirror of server/lib/phone.ts's normalizeBRPhone - kept in sync
// manually since client and server bundles can't share a module here. Strips a
// phone number down to the digits wa.me expects, guaranteeing the +55 country
// code is present exactly once regardless of whether the stored value already
// carries it (older rows may not, until backfilled).
export function whatsappDigits(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
    ? digits
    : `55${digits}`;
}
