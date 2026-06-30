# Architecture

Pay On Arc is a Next.js App Router application with a separate durable worker process and a PostgreSQL database accessed through Prisma.

## High-Level Diagram

```text
Browser / Wallet
      |
      v
Next.js Web App
  - Landing page
  - Merchant dashboard
  - Public checkout
  - Admin panel
  - API routes
      |
      v
PostgreSQL via Prisma
  - Users / Wallets
  - PaymentLinks / Transactions
  - ApiKeys
  - WebhookEndpoints / WebhookDeliveries
  - BackgroundJobs
  - AuditLogs
      ^
      |
Worker Process
  - WEBHOOK_DELIVERY jobs
  - TRANSACTION_CHECK jobs
      |
      v
Arc Testnet RPC / Merchant Webhook URLs
```

## Web App

The web app is served by Next.js 15 App Router. It contains:

- public marketing and checkout pages
- authenticated merchant pages under `/app/*`
- secret-path admin pages
- API routes under `/api/*`

The web app should not run durable background work in memory. It enqueues work in PostgreSQL and returns user-facing responses.

## Worker

The worker is started with:

```bash
pnpm worker
```

It polls `BackgroundJob`, claims jobs atomically, and processes:

- `WEBHOOK_DELIVERY`
- `TRANSACTION_CHECK`

Run it separately from the web process in PM2.

## Prisma

Prisma models the core product:

- `User`
- `Wallet`
- `PaymentLink`
- `Transaction`
- `ApiKey`
- `WebhookEndpoint`
- `WebhookDelivery`
- `BackgroundJob`
- `AuditLog`
- `AiRequestLog`

Production deploys should use:

```bash
pnpm exec prisma migrate deploy
```

## Wallet Authentication

Authentication uses a signed-message flow:

1. client requests a nonce
2. wallet signs a deterministic login message
3. server verifies the signature using `viem`
4. server creates a wallet-bound httpOnly session cookie

Protected merchant routes rely on the server session.

## Payment Verification

Real payments use Arc Testnet ERC-20 USDC:

- token: `0x3600000000000000000000000000000000000000`
- decimals: `6`
- chain id: `5042002`

The server verifies:

- transaction receipt exists
- receipt status is success
- token contract matches Arc Testnet USDC
- recipient matches the merchant wallet
- payer matches the connected payer wallet when available
- transfer amount is at least the payment link amount
- transaction hash is unique

Payment links are one-time use.

## Webhook System

Webhook events create `WebhookDelivery` records and enqueue `WEBHOOK_DELIVERY` jobs. The worker sends signed HTTP requests with:

- `X-ArcPay-Event`
- `X-ArcPay-Signature`
- `X-ArcPay-Timestamp`

Webhook failures do not block checkout or transaction confirmation.

## Queue System

`BackgroundJob` is a lightweight database-backed queue. It supports:

- pending/running/completed/failed states
- atomic claiming with row locks
- retry with backoff
- stale running job release
- JSON payloads containing IDs only

This keeps the V1 architecture simple while making background work durable across deploys and PM2 restarts.
