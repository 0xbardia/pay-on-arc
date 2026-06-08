# Pay On Arc

AI-powered stablecoin payment infrastructure built on Arc.

Pay On Arc is a production-shaped Web3 SaaS platform for merchants that want to accept Arc Testnet USDC through branded payment links, track transactions, manage API credentials, send signed webhooks, and use AI-powered payment insights from one dashboard.

Live production demo: [https://payonarc.xyz](https://payonarc.xyz)

## Overview

Pay On Arc combines a Stripe-style merchant dashboard with wallet-native authentication and Arc Testnet USDC checkout. Merchants connect an EVM wallet, create one-time payment links, receive real USDC testnet transfers, inspect transactions, manage developer credentials, and monitor webhook deliveries.

The product is designed for public demos, investor presentations, beta merchants, and V1 Arc review.

## Features

- Wallet authentication with signed-message sessions.
- Merchant profiles and checkout branding.
- Arc Testnet ERC-20 USDC payment links.
- QR checkout pages.
- One-time paid/closed links.
- Transaction recording and confirmation checks.
- Merchant analytics dashboard.
- API key management with hashed secrets.
- Signed webhooks and delivery logs.
- AI Copilot powered by OpenRouter.
- Secret-path admin panel with wallet allowlist.
- Audit logs for auth, payments, webhooks, API keys, AI, and admin actions.
- Health check, security headers, rate limiting, and production deployment docs.

## Screenshots

Place launch screenshots here:

- Landing page
- Merchant dashboard
- Payment links
- Checkout page
- Transactions
- AI Copilot
- API keys
- Webhooks
- Admin analytics

## Architecture

```text
Next.js App Router
  ├─ Merchant UI (/app/*)
  ├─ Public checkout (/pay/[slug])
  ├─ Public merchant profiles (/m/[slug])
  ├─ Secret admin panel (${ADMIN_PANEL_PATH})
  └─ API routes

Prisma + PostgreSQL
  ├─ Users, Wallets, PaymentLinks, Transactions
  ├─ ApiKeys
  ├─ WebhookEndpoints, WebhookDeliveries
  ├─ AiRequestLogs
  └─ AuditLogs

Web3
  ├─ wagmi / viem / RainbowKit
  ├─ Arc Testnet
  └─ ERC-20 USDC interface
```

## Authentication

Merchant sessions use wallet signed-message authentication:

1. `GET /api/auth/nonce`
2. Wallet signs the exact login message.
3. `POST /api/auth/wallet`
4. Server verifies via `viem.verifyMessage`.
5. Server sets an httpOnly session cookie.

Protected merchant routes under `/app/*` require a valid server session.

## Payments

Pay On Arc uses the Arc Testnet ERC-20 USDC interface:

```text
USDC address: 0x3600000000000000000000000000000000000000
USDC decimals: 6
Explorer: https://testnet.arcscan.app
```

Payment links are one-time by default. After a transaction hash is recorded, the link is marked paid/closed and cannot be paid again.

## API Keys

Merchants can create, view, and revoke API keys from Settings.

API keys are shown once and never stored raw. Pay On Arc stores only:

- visible prefix
- SHA-256 hash
- creation/revocation timestamps
- last used timestamp

Example:

```bash
curl -H "Authorization: Bearer arcpay_live_YOUR_KEY" \
  https://payonarc.xyz/api/v1/me
```

## Webhooks

Merchants can configure signed webhook endpoints for payment, link, API key, and merchant events.

Supported events:

- `payment.created`
- `payment.pending`
- `payment.confirmed`
- `payment.failed`
- `link.created`
- `link.disabled`
- `link.expired`
- `apikey.created`
- `apikey.revoked`
- `merchant.updated`
- `webhook.test`

Example payload:

```json
{
  "id": "evt_123",
  "type": "payment.confirmed",
  "createdAt": "2026-06-08T12:00:00.000Z",
  "merchantId": "user_123",
  "data": {
    "id": "txn_123",
    "amount": "42.000000",
    "currency": "USDC",
    "status": "CONFIRMED"
  }
}
```

Delivery headers:

```text
X-ArcPay-Event
X-ArcPay-Signature
X-ArcPay-Timestamp
```

Signature verification:

```ts
import { verifyArcPaySignature } from "@/lib/webhooks/signature";

const valid = verifyArcPaySignature({
  secret: "arcsec_your_one_time_secret",
  timestamp: request.headers.get("X-ArcPay-Timestamp")!,
  signature: request.headers.get("X-ArcPay-Signature")!,
  rawBody,
});
```

Webhook delivery is asynchronous and never blocks checkout or transaction confirmation.

## AI Copilot

The AI Copilot summarizes authenticated merchant payment activity only. It does not send private keys, session data, or secrets. If OpenRouter is disabled or unconfigured, the UI shows a safe disabled state.

## Admin Panel

Admin access is hidden behind `ADMIN_PANEL_PATH` and protected by:

- authenticated wallet session
- `ADMIN_WALLETS` allowlist

No admin link is exposed in the public or merchant UI.

## Audit Logs

Audit logs cover:

- auth login/logout
- payment link creation/disable/paid
- transaction created/confirmed/failed
- API key created/revoked/used
- webhook created/updated/deleted/test/delivery
- AI requests
- admin actions

## Merchant Branding

Merchants can configure:

- merchant name
- merchant slug
- merchant email
- support email
- website URL
- logo URL

Branding appears in the sidebar, dashboard, checkout pages, and `/m/[slug]` public merchant profiles.

## Analytics

Merchant analytics include:

- total revenue
- revenue today
- revenue 7d
- revenue 30d
- total transactions
- success rate
- failed transactions
- active payment links
- expired payment links
- revenue and transaction charts

Admin analytics include:

- total merchants
- total revenue
- total transactions
- API calls
- webhook deliveries
- AI requests
- 24h / 7d / 30d breakdowns

## Environment Variables

```bash
DATABASE_URL="postgresql://..."
SESSION_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_APP_URL="https://payonarc.xyz"
APP_VERSION="1.0.0"

NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID="..."
ADMIN_PANEL_PATH="/secure-admin"
ADMIN_WALLETS="0xabc...,0xdef..."

NEXT_PUBLIC_ARC_CHAIN_ID="5042002"
NEXT_PUBLIC_ARC_RPC_URL="https://rpc.testnet.arc.network"
NEXT_PUBLIC_ARC_EXPLORER_URL="https://testnet.arcscan.app"
NEXT_PUBLIC_ARC_USDC_ADDRESS="0x3600000000000000000000000000000000000000"
NEXT_PUBLIC_ARC_USDC_DECIMALS="6"
ENABLE_SIMULATED_PAYMENTS="true"

OPENROUTER_API_KEY="..."
OPENROUTER_MODEL="openai/gpt-4o-mini"
AI_COPILOT_ENABLED="true"

PRISMA_QUERY_LOGGING="false"
ARCPAY_DEBUG_REQUESTS="0"
```

## Local Development

```bash
pnpm install
cp .env.example .env
pnpm exec prisma generate
pnpm exec prisma migrate dev
pnpm dev
```

Open `http://localhost:3000`.

## Production Deployment

Do not use `pnpm dev` on a VPS for stability testing. Use the production runtime.

```bash
pnpm install --frozen-lockfile
pnpm exec prisma migrate deploy
pnpm build
pnpm start
```

PM2:

```bash
pm2 start ecosystem.config.cjs
pm2 restart arcpay-ai
pm2 logs arcpay-ai
```

PM2 should use `ecosystem.config.cjs`, which runs `pnpm start` against the built Next.js app.

Some legacy internal identifiers intentionally remain unchanged for production compatibility, including the `arcpay-ai` package/process name, `arcpay_live_` API key prefix, `arcpay_*` cookie names, and `X-ArcPay-*` webhook headers.

Nginx and SSL:

- proxy HTTPS traffic to `127.0.0.1:3000`
- configure Let’s Encrypt SSL
- forward `x-forwarded-proto` and `x-forwarded-host`
- set `NEXT_PUBLIC_APP_URL` to the public HTTPS origin

### Production Domain Setup

If `https://payonarc.xyz` shows the default Nginx welcome page while Pay On Arc works on `http://SERVER_IP:3000`, Nginx is not proxying the domain to the Next.js production server.

Use [docs/production-nginx.md](docs/production-nginx.md) to configure `payonarc.xyz` and `www.payonarc.xyz` as reverse proxies to `http://127.0.0.1:3000`. Disable or remove the default Nginx site, then set:

```bash
NEXT_PUBLIC_APP_URL="https://payonarc.xyz"
```

## Production Testing Checklist

- Connect wallet, sign in, reject once, retry, refresh, logout, switch account.
- Confirm `/admin` redirects away and the secret admin path requires an allowlisted authenticated wallet.
- Create a payment link and confirm the copied URL and QR code use `https://payonarc.xyz/pay/...`.
- Open checkout on desktop and mobile, pay once with Arc Testnet ERC-20 USDC, and confirm the link is locked.
- Confirm disabled, expired, paid, and pending links cannot start another payment attempt.
- Create an API key, copy the one-time raw key, call `/api/v1/me`, revoke it, and confirm it fails.
- Create a webhook, send a test event, verify the delivery log, retry failed deliveries, and confirm disabled endpoints receive nothing.
- Run AI analysis and confirm previous insights, admin AI usage, and audit logs update.
- Check dashboard analytics, transactions filters, empty states, and mobile layouts.
- Review browser console and server logs for hydration errors, Server Action mismatch, failed assets, CORS, or mixed content.

## V1 Status

Pay On Arc V1.1 is feature-complete for public demo and Arc review on Arc Testnet. Real payments use the Arc Testnet ERC-20 USDC interface and are intended for testnet validation, not mainnet settlement.

Database:

- run PostgreSQL with daily backups
- use `prisma migrate deploy` for releases
- keep `PRISMA_QUERY_LOGGING=false` in production unless debugging

## Security

- httpOnly wallet session cookies.
- Signed nonce wallet login.
- Server-side signature verification.
- API keys stored as hashes only.
- Webhook secrets stored as hashes only.
- Signed webhook deliveries.
- SSRF checks for webhook URLs.
- Security headers in middleware.
- Rate limiting for auth, AI, API keys, and webhooks.
- Secret admin path and admin wallet allowlist.
- Production env validation for required config.

## Roadmap

V2 roadmap:

- Arc mainnet readiness.
- Production USDC settlement controls.
- Durable webhook worker and retry queue.
- Merchant invoices.
- Customer records.
- Team accounts and roles.
- Webhook signing docs portal.
- Hosted API documentation.

## License

Private V1 release candidate. Add a production license before public open-source distribution.
