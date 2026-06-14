# API Reference

This document covers the main internal and merchant-facing APIs. Examples use `https://payonarc.xyz`; for local development use your configured `NEXT_PUBLIC_APP_URL`.

## Response Format

Successful responses generally return a resource object:

```json
{
  "paymentLink": {
    "id": "clx..."
  }
}
```

Error responses use:

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message."
}
```

## Wallet Session APIs

### GET `/api/auth/me`

Returns the authenticated wallet session.

```bash
curl https://payonarc.xyz/api/auth/me
```

Unauthenticated responses return `401`.

## Payment Links

### POST `/api/payment-links`

Requires an authenticated merchant session.

```bash
curl -X POST https://payonarc.xyz/api/payment-links \
  -H "Content-Type: application/json" \
  -b "payonarc_session=..." \
  -d '{
    "title": "Consulting invoice",
    "amount": "25.00",
    "currency": "USDC",
    "description": "June advisory work"
  }'
```

### GET `/api/payment-links`

Lists the authenticated merchant's payment links.

```bash
curl https://payonarc.xyz/api/payment-links \
  -b "payonarc_session=..."
```

## Transaction Check

### POST `/api/transactions/[id]/check`

Requires merchant session ownership or admin access.

```bash
curl -X POST https://payonarc.xyz/api/transactions/TRANSACTION_ID/check \
  -b "payonarc_session=..."
```

The server verifies Arc Testnet ERC-20 USDC transfer logs before confirming a transaction.

## Dashboard Analytics

These endpoints require an authenticated merchant session.

### GET `/api/dashboard/stats`

Returns revenue, growth, transaction, payment link, and average payment size metrics.

```bash
curl https://payonarc.xyz/api/dashboard/stats \
  -b "payonarc_session=..."
```

### GET `/api/dashboard/revenue`

Returns revenue and transaction volume series. Supported periods: `7`, `30`, `90`.

```bash
curl "https://payonarc.xyz/api/dashboard/revenue?period=30" \
  -b "payonarc_session=..."
```

### GET `/api/dashboard/top-links`

Returns the merchant's top payment links sorted by successful revenue.

```bash
curl https://payonarc.xyz/api/dashboard/top-links \
  -b "payonarc_session=..."
```

## Transaction Export

### GET `/api/transactions/export`

Downloads the authenticated merchant's transaction history as CSV.

```bash
curl https://payonarc.xyz/api/transactions/export \
  -b "payonarc_session=..." \
  -o transactions.csv
```

## API Keys

### GET `/api/v1/me`

Requires a merchant API key.

```bash
curl -H "Authorization: Bearer arcpay_live_YOUR_KEY" \
  https://payonarc.xyz/api/v1/me
```

API keys are shown once at creation time. Only hashes are stored.

## Webhook APIs

The dashboard uses authenticated APIs to manage webhook endpoints:

- `GET /api/webhooks`
- `POST /api/webhooks`
- `PATCH /api/webhooks/[id]`
- `DELETE /api/webhooks/[id]`
- `POST /api/webhooks/[id]/test`
- `GET /api/webhooks/deliveries`
- `POST /api/webhooks/deliveries/[id]/retry`

Webhook endpoint URLs must be HTTPS in production.

## Webhook Payload

```json
{
  "id": "evt_123",
  "type": "payment.confirmed",
  "createdAt": "2026-06-14T12:00:00.000Z",
  "merchantId": "user_123",
  "data": {
    "id": "txn_123",
    "paymentLinkId": "link_123",
    "amount": "25.000000",
    "currency": "USDC",
    "status": "CONFIRMED"
  }
}
```

Headers:

```text
X-ArcPay-Event: evt_123
X-ArcPay-Signature: ...
X-ArcPay-Timestamp: 1781438400
```

## Signature Verification

```ts
import { verifyArcPaySignature } from "@/lib/webhooks/signature";

const valid = verifyArcPaySignature({
  secret: process.env.WEBHOOK_SECRET!,
  timestamp,
  signature,
  rawBody,
});
```

Always verify against the raw request body.
