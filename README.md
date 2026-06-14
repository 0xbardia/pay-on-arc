# Pay On Arc

AI-powered stablecoin payment infrastructure built on Arc.

Pay On Arc is an open-source Web3 payments dashboard for merchants and builders who want to create branded USDC payment links, accept Arc Testnet ERC-20 USDC, verify transactions server-side, send signed webhooks, and analyze payment activity with AI.

Live demo: [https://payonarc.xyz](https://payonarc.xyz)

> Pay On Arc currently targets Arc Testnet. It is built for demos, ecosystem experimentation, and V1 merchant workflow validation.

## Features

- Wallet signed-message authentication with httpOnly sessions.
- Merchant dashboard for payment links, transactions, analytics, settings, and AI insights.
- Merchant analytics for revenue, growth, average payment size, top links, and activity trends.
- Branded public checkout pages and merchant profiles.
- Arc Testnet ERC-20 USDC payment links and QR checkout.
- Server-side transaction verification from real ERC-20 `Transfer` logs.
- One-time payment links that lock after verified payment.
- API key management with one-time reveal and hashed storage.
- Signed webhooks with delivery logs and durable retries.
- CSV transaction export for merchant operations.
- Prisma-backed durable worker for webhook delivery and transaction checks.
- AI Copilot powered by OpenRouter.
- Secret-path admin panel protected by wallet allowlist.
- Audit logs, rate limiting, health checks, and production deployment docs.

## Architecture Overview

```text
Wallet / Browser
      |
      v
Next.js Web App
  - public landing and checkout
  - authenticated merchant dashboard
  - secret admin panel
  - API routes
      |
      v
PostgreSQL + Prisma
  - users, wallets, payment links, transactions
  - API keys, webhooks, audit logs
  - durable background jobs
      ^
      |
Worker Process
  - webhook delivery jobs
  - transaction check jobs
      |
      v
Arc Testnet RPC / Merchant Webhook Endpoints
```

The web process handles user-facing requests and enqueues durable background work. The worker process claims jobs from PostgreSQL and performs webhook delivery and transaction checks outside the Next.js request lifecycle.

Read more in [docs/architecture.md](docs/architecture.md).

## Tech Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- wagmi, viem, RainbowKit
- Recharts
- OpenRouter
- PM2 for production process management

## Quick Start

Requirements:

- Node.js 20+
- pnpm
- PostgreSQL
- an EVM wallet for testing

```bash
git clone https://github.com/pay-on-arc/pay-on-arc.git
cd pay-on-arc
pnpm install
cp .env.example .env
pnpm exec prisma migrate dev
pnpm exec prisma generate
pnpm dev
```

In a second terminal, start the worker when testing webhooks or transaction checks:

```bash
pnpm worker
```

Open `http://localhost:3000`.

## Environment Variables

Start from `.env.example`.

Minimum local setup:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
SESSION_SECRET="replace-with-a-long-random-secret-at-least-32-chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=""
```

Production must set a real HTTPS `NEXT_PUBLIC_APP_URL`, for example:

```bash
NEXT_PUBLIC_APP_URL="https://your-domain.example"
```

Full environment reference: [docs/environment.md](docs/environment.md).

## Database Setup

Development:

```bash
pnpm exec prisma migrate dev
pnpm exec prisma generate
```

Production:

```bash
pnpm exec prisma migrate deploy
pnpm exec prisma generate
```

Prisma schema: [prisma/schema.prisma](prisma/schema.prisma)

## Development

Run the web app:

```bash
pnpm dev
```

Run the worker:

```bash
pnpm worker
```

Validate changes:

```bash
pnpm exec prisma generate
pnpm exec tsc --noEmit --pretty false
pnpm lint
pnpm build
```

## Production Deployment

Build and run with PM2:

```bash
pnpm install --frozen-lockfile
pnpm exec prisma migrate deploy
pnpm build
pm2 start ecosystem.config.cjs
pm2 restart pay-on-arc-web
pm2 restart pay-on-arc-worker
```

Check health:

```bash
curl https://payonarc.xyz/api/health
```

Nginx reverse proxy guide: [docs/production-nginx.md](docs/production-nginx.md)

Release process: [docs/releases.md](docs/releases.md)

## Worker Process

The worker processes durable background jobs from PostgreSQL:

- `WEBHOOK_DELIVERY`
- `TRANSACTION_CHECK`

It is intentionally separate from the Next.js app process so PM2 restarts, deployments, and multiple web instances do not lose background work.

```bash
pnpm worker
pm2 logs pay-on-arc-worker --lines 100
```

Worker operations guide: [docs/job-worker.md](docs/job-worker.md)

## API Overview

Pay On Arc exposes internal dashboard APIs and a small API-key-authenticated merchant API.

Example merchant API call:

```bash
curl -H "Authorization: Bearer arcpay_live_YOUR_KEY" \
  https://payonarc.xyz/api/v1/me
```

API documentation: [docs/api.md](docs/api.md)

## Analytics

Merchant analytics include:

- total revenue
- revenue last 7 and 30 days
- transaction count
- successful and failed payments
- active payment links
- average payment size
- revenue and transaction charts for 7, 30, and 90 day periods
- top performing payment links
- CSV transaction export

Internal dashboard APIs:

- `GET /api/dashboard/stats`
- `GET /api/dashboard/revenue?period=30`
- `GET /api/dashboard/top-links`

## Payment Flow

```text
Merchant creates payment link
      |
Customer opens /pay/[slug]
      |
Customer connects wallet and sends ERC-20 USDC
      |
Server receives txHash
      |
Server verifies Arc Testnet receipt and Transfer log
      |
Transaction becomes CONFIRMED
      |
Payment link becomes PAID
      |
Webhook delivery is queued
```

Verification requires:

- Arc Testnet receipt exists
- receipt status is success
- token contract is configured Arc Testnet USDC
- recipient is the merchant wallet
- amount is at least the payment link amount
- payer matches the connected wallet when available
- transaction hash has not already been used

## Webhook Flow

Webhook events create delivery records and enqueue durable jobs. The worker sends signed requests with:

```text
X-ArcPay-Event
X-ArcPay-Signature
X-ArcPay-Timestamp
```

Webhook delivery never blocks checkout or payment confirmation.

## AI Copilot

AI Copilot analyzes the authenticated merchant's own payment links and transactions. It does not send private keys, session data, API keys, webhook secrets, or admin secrets to the AI provider.

Set:

```bash
OPENROUTER_API_KEY="..."
AI_COPILOT_ENABLED="true"
```

## Security Notes

- Never commit `.env` files.
- Never expose private keys, API keys, webhook secrets, session cookies, or wallet signatures.
- API keys and webhook secrets are stored as hashes only.
- Admin routes are hidden behind `ADMIN_PANEL_PATH` and `ADMIN_WALLETS`.
- Payment confirmation is server-side and verifies ERC-20 transfer logs.
- Webhook URLs are validated to reduce SSRF risk.
- `NEXT_PUBLIC_*` variables are visible in the browser and must not contain secrets.

Security policy: [SECURITY.md](SECURITY.md)

## Contributing

Contributions are welcome. Start with:

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/api.md](docs/api.md)

Before opening a PR, run:

```bash
pnpm exec prisma generate
pnpm exec tsc --noEmit --pretty false
pnpm lint
pnpm build
```

## Roadmap

- Arc mainnet readiness.
- Production settlement controls.
- Hosted API documentation.
- Merchant invoices.
- Customer records.
- Team accounts and roles.
- Webhook signing examples for popular frameworks.

## License

MIT. See [LICENSE](LICENSE).

## Acknowledgements

Built for the Arc ecosystem using Next.js, Prisma, viem, wagmi, RainbowKit, Tailwind CSS, and OpenRouter.

Some legacy internal identifiers intentionally remain for compatibility, including the package name `arcpay-ai`, `arcpay_live_` API key prefix, and `X-ArcPay-*` webhook headers.
