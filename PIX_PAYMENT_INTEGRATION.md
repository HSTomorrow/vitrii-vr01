# Pix Payment Integration Guide

## Overview

Vitrii now supports Pix payments for ad listings. Users can create ads and pay via Pix QR Code instantly. After 3 free ads, each additional ad costs R$ 9.90.

## Features

✅ **Instant Pix QR Code Generation** - Generate Pix codes with 30-minute expiration
✅ **Real-time Payment Confirmation** - Automatic ad activation upon payment
✅ **Payment Status Tracking** - Monitor payment status with live polling
✅ **Cancellation Support** - Users can cancel pending payments
✅ **Webhook Support** - Integration with payment provider webhooks
✅ **Copy-and-Paste Code** - Alternative to QR code scanning

## Database Schema

### Pagamento Table

```sql
CREATE TABLE pagamentos (
  id INT PRIMARY KEY,
  anuncioId INT UNIQUE NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  status VARCHAR(255) DEFAULT 'pendente',
  tipo VARCHAR(255) DEFAULT 'pix',
  provedor VARCHAR(255) DEFAULT 'mercado-pago',
  idExterno VARCHAR(255),
  qrCode TEXT,
  urlCopiaECola TEXT,
  pixId VARCHAR(255),
  erroMsg TEXT,
  dataExpiracao TIMESTAMP,
  dataPagamento TIMESTAMP,
  dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dataAtualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (anuncioId) REFERENCES anuncios(id) ON DELETE CASCADE
);
```

### Payment Statuses

- **pendente** - Waiting for payment
- **processando** - Payment is being processed
- **pago** - Payment confirmed, ad is active
- **cancelado** - Payment cancelled by user
- **expirado** - Pix code expired (30 minutes)

## Backend API Endpoints

### Create Payment

```
POST /api/pagamentos
Content-Type: application/json

{
  "anuncioId": 123,
  "valor": 9.90
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "anuncioId": 123,
    "valor": "9.90",
    "status": "pendente",
    "qrCode": "...",
    "urlCopiaECola": "...",
    "pixId": "PIX-1234567890",
    "dataExpiracao": "2024-01-07T19:15:00Z"
  }
}
```

### Get Payment Status

```
GET /api/pagamentos/:id/status

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "status": "pendente",
    ...
  }
}
```

### Get Payment by Anuncio ID

```
GET /api/pagamentos/anuncio/:anuncioId

Response:
{
  "success": true,
  "data": { ... }
}
```

### Update Payment Status

```
PATCH /api/pagamentos/:id/status
Content-Type: application/json

{
  "status": "pago",
  "pixId": "PIX-1234567890",
  "dataPagamento": "2024-01-07T18:45:00Z"
}
```

### Cancel Payment

```
DELETE /api/pagamentos/:id/cancel

Response:
{
  "success": true,
  "data": { ... }
}
```

### Webhook Handler

```
POST /api/webhooks/pagamentos
Content-Type: application/json

{
  "action": "payment.updated",
  "data": {
    "id": "ext-123456",
    "status": "approved",
    "transaction_id": "PIX-789"
  }
}
```

## Frontend Components

### 1. PaymentModal Component

Located in `client/components/PaymentModal.tsx`

- Displays Pix QR code
- Shows copy-paste code option
- Real-time payment status polling
- Timer showing code expiration
- Cancel payment option

**Usage:**

```tsx
<PaymentModal
  isOpen={isOpen}
  onClose={handleClose}
  anuncioId={anuncioId}
  onPaymentConfirmed={handleConfirmed}
/>
```

### 2. Checkout Page

Located in `client/pages/Checkout.tsx`

Complete checkout experience with:

- Ad summary
- Pix QR code display
- Copy-paste code
- Payment status monitoring
- Real-time confirmation

**Route:** `/checkout/:anuncioId`

## User Flow

1. **User creates ad** → Form validation ✓
2. **Submit form** → Ad saved to database with status "em_edicao"
3. **Redirect to checkout** → `/checkout/:anuncioId`
4. **Payment page loads** → Auto-creates Pix payment
5. **User scans QR code** → Transfers R$ 9.90 via Pix
6. **Real-time polling** → Checks payment status every 3 seconds
7. **Payment confirmed** → Ad status changes to "pago"
8. **Ad activated** → User redirected to `/sell`

## Setup Instructions

### 1. Database Setup

Run the migration script to create the Pagamento table:

```bash
node create-pagamento-table.mjs
```

Or manually run the SQL from `PIX_PAYMENT_INTEGRATION.md` (Database Schema section).

### 2. Environment Variables

Update `.env` with Mercado Pago credentials:

```env
# Mercado Pago Configuration
MERCADO_PAGO_ACCESS_TOKEN="your_access_token_here"
MERCADO_PAGO_PUBLIC_KEY="your_public_key_here"

# Payment Configuration
PAYMENT_PROVIDER="mercado-pago"
PAYMENT_WEBHOOK_SECRET="your_webhook_secret_here"

# Ad Pricing
FREE_ADS_LIMIT=3
AD_COST=9.90
```

### 3. Get Mercado Pago Credentials

1. Create account at https://www.mercadopago.com.br
2. Go to **Developers** → **Credentials**
3. Copy **Access Token** and **Public Key**
4. Store in `.env` file

### 4. Setup Webhook (Optional)

1. In Mercado Pago dashboard: **Developers** → **Webhooks**
2. Add webhook URL: `https://your-domain.com/api/webhooks/pagamentos`
3. Subscribe to: `payment.created` and `payment.updated` events
4. Store webhook secret in `.env`

## Configuration

### Free vs Paid Ads

Users get `FREE_ADS_LIMIT` (default 3) free ads. After that:

- Check ad count in `/api/anuncios?lojaId=X`
- If count >= FREE_ADS_LIMIT, require payment
- Set amount to `AD_COST` (default R$ 9.90)

### Custom Pricing

To change ad cost:

1. Update `.env`:

   ```env
   AD_COST=19.90
   ```

2. Update AnuncioForm if needed:
   ```tsx
   const adCost = process.env.AD_COST || 9.9;
   ```

## Integration with Mercado Pago (Future)

Current implementation uses mock QR codes. To integrate with real Mercado Pago:

1. Install Mercado Pago SDK:

   ```bash
   npm install mercadopago
   ```

2. Update `server/routes/pagamentos.ts`:

   ```typescript
   import { MercadoPagoConfig, Payment } from "mercadopago";

   const client = new MercadoPagoConfig({
     accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
   });

   // In createPagamento function:
   const paymentData = {
     transaction_amount: validatedData.valor,
     payment_method_id: "pix",
     payer: { email: "user@example.com" },
   };

   const payment = new Payment(client);
   const result = await payment.create({ body: paymentData });
   ```

## Testing

### Test Payment Flow

1. Create a new ad at `/anuncio/criar`
2. Fill form and submit
3. Redirect to `/checkout/:anuncioId`
4. Payment modal shows with test Pix code
5. Check database for payment record:
   ```sql
   SELECT * FROM pagamentos WHERE anuncioId = 123;
   ```

### Manual Status Update (for testing)

```bash
curl -X PATCH http://localhost:5000/api/pagamentos/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "pago",
    "pixId": "PIX-test-123",
    "dataPagamento": "2024-01-07T18:45:00Z"
  }'
```

## Error Handling

### Common Errors

| Error                                      | Cause                   | Solution                           |
| ------------------------------------------ | ----------------------- | ---------------------------------- |
| "Pagamento não encontrado"                 | Payment doesn't exist   | Ad may not be created yet          |
| "Já existe um pagamento para este anúncio" | Payment already created | User refreshed page multiple times |
| "Código Pix expirado"                      | 30 minutes passed       | Create new payment                 |
| "Anúncio não encontrado"                   | Invalid ad ID           | Check ad creation first            |

## Security Considerations

1. **Webhook Verification** - Always verify webhook signatures from Mercado Pago
2. **CORS** - Restrict API calls to your domain
3. **PII Protection** - Never log full card/Pix data
4. **HTTPS** - Always use HTTPS for payment endpoints
5. **Rate Limiting** - Implement rate limiting on payment endpoints

## Future Enhancements

- [ ] Multiple payment methods (credit card, debit card)
- [ ] Subscription plans for unlimited ads
- [ ] Payment history and invoices
- [ ] Refund handling
- [ ] Payment retry logic
- [ ] Invoice generation
- [ ] Payment analytics dashboard
- [ ] Multi-currency support

## Support

For issues or questions:

1. Check Mercado Pago documentation: https://developer.mercadopago.com.br
2. Review this guide's troubleshooting section
3. Check database logs: `SELECT * FROM pagamentos`
4. Enable debug logging in payment routes

## References

- [Mercado Pago API Documentation](https://developer.mercadopago.com.br/reference)
- [Pix Payment Method](https://developer.mercadopago.com.br/en/docs/checkout-pro/reference)
- [Webhook Events](https://developer.mercadopago.com.br/en/docs/checkout-pro/webhooks)
