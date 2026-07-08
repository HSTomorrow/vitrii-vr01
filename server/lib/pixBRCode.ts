// Generates a real, scannable "Pix Copia e Cola" payload following the Banco Central's
// BR Code spec (EMV QR Code for Payment Systems, Pix profile). No payment gateway/PSP
// account is involved — the payload just points a paying bank app straight at the
// recebedor's own registered chave Pix, exactly like a merchant's printed Pix QR sticker.
// The client already renders whatever string this returns as a real QR code via
// <QRCodeSVG value={...} /> (client/pages/Financeiro.tsx), so no image generation is
// needed here — just the correctly-formatted payload string.
//
// Reference: https://www.bcb.gov.br/content/estabilidadefinanceira/spb_docs/ManualBRCode.pdf

function tlv(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

// CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) — the checksum algorithm the BR Code
// spec mandates for the trailing "63" field.
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Merchant name/city fields must be plain ASCII, uppercase, no accents/punctuation beyond
// spaces — banking apps reject payloads that don't follow this.
function sanitizeText(value: string, maxLen: number, fallback: string): string {
  const cleaned = value
    .normalize("NFD")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .toUpperCase()
    .slice(0, maxLen);
  return cleaned || fallback;
}

// txid (Additional Data Field "05") must be alphanumeric only, max 25 chars.
function sanitizeTxid(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 25);
  return cleaned || "***";
}

export interface PixBRCodeParams {
  chavePix: string;
  valor: number;
  nomeRecebedor: string;
  cidadeRecebedor: string;
  txid: string;
}

export function generatePixBRCode({
  chavePix,
  valor,
  nomeRecebedor,
  cidadeRecebedor,
  txid,
}: PixBRCodeParams): string {
  const merchantAccountInfo = tlv("00", "br.gov.bcb.pix") + tlv("01", chavePix.trim());
  const additionalData = tlv("05", sanitizeTxid(txid));

  const payloadWithoutCrc =
    tlv("00", "01") + // Payload Format Indicator
    tlv("01", "11") + // Point of Initiation Method: 11 = static (reusable) code
    tlv("26", merchantAccountInfo) + // Merchant Account Info (Pix)
    tlv("52", "0000") + // Merchant Category Code
    tlv("53", "986") + // Transaction Currency: 986 = BRL
    tlv("54", valor.toFixed(2)) + // Transaction Amount
    tlv("58", "BR") + // Country Code
    tlv("59", sanitizeText(nomeRecebedor, 25, "VITRII")) + // Merchant Name
    tlv("60", sanitizeText(cidadeRecebedor, 15, "SAO PAULO")) + // Merchant City
    tlv("62", additionalData) + // Additional Data Field Template (txid)
    "6304"; // CRC id + length, value appended below

  return payloadWithoutCrc + crc16(payloadWithoutCrc);
}
