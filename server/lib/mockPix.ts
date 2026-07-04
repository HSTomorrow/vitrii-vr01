// Mock Pix code generator - there is no real payment gateway integration anywhere in
// this project yet (no Mercado Pago/Stripe wiring despite the env vars existing).
// Shared by server/routes/pagamentos.ts (ad-listing payments) and
// server/routes/financeiro.ts (anunciante-to-client billing) so both produce
// consistent-looking codes instead of duplicating the string-building logic.
export function generateMockQRCode(valor: number, pixId: string, chavePix?: string | null) {
  const chave = chavePix || "123e4567-e12b-12d1-a456-426655440000";
  const qrCode = `00020126580014br.gov.bcb.brcode0136${chave}520400005303986540510.005802BR5913Vitrii6009Sao Paulo62410503***63041D3D`;
  const urlCopiaECola = `00020126580014br.gov.bcb.brcode0136${pixId}520400005303986540510.005802BR5913Vitrii6009SaoPaulo62410503***63041D3D`;

  return {
    qrCode,
    urlCopiaECola,
  };
}
