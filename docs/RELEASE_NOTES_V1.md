# Pay On Arc V1 Release Notes

## Phase 1: Foundation

- Next.js App Router foundation.
- TypeScript, Tailwind CSS, and shadcn-style UI primitives.
- Prisma + PostgreSQL schema.
- Merchant and admin layouts.

## Phase 2: Wallet Authentication

- wagmi, viem, and RainbowKit wallet connection.
- Signed-message wallet login.
- httpOnly session cookie.
- Protected merchant routes.
- Arc Testnet network preference.

## Phase 3: Payment Links

- Merchant payment link creation.
- Public checkout pages.
- QR code sharing.
- Transaction records.
- Dashboard stats and transaction history.

## Phase 3.5: Real Arc Testnet USDC Payments

- Arc Testnet ERC-20 USDC transfers.
- Transaction hash recording.
- ArcScan links.
- Confirmation status checks.
- One-time paid/closed payment links.

## Phase 4: Admin Panel and AI Copilot

- Secret-path admin panel.
- Admin wallet allowlist.
- Platform metrics, users, payment links, transactions, settings, and AI usage.
- OpenRouter-powered AI Copilot.
- AI request logs.

## Phase 4.5: Production Hardening

- Improved nonce/session handling.
- Automatic transaction monitor.
- Audit log system.
- Session synchronization fixes.

## Phase 5: Premium SaaS UX

- Premium landing page and dashboard redesign.
- Responsive mobile layouts.
- Empty, loading, success, and error states.
- Toast notifications.
- AI insight card formatting.

## Phase 6.1: Merchant Branding

- Merchant profile fields.
- Branded checkout pages.
- Public merchant pages.
- Dynamic sidebar and dashboard identity.

## Phase 6.2: API Keys

- Secure API key generation.
- Hash-only storage.
- One-time key reveal.
- Revoke flow.
- `/api/v1/me` merchant API.

## Phase 6.3: Webhooks

- Webhook endpoint management.
- Signed asynchronous delivery.
- Delivery logs.
- Retry support.
- Test events.

## Phase 6.4: Docs, Analytics, Monitoring, and Security

- Professional README.
- Merchant analytics dashboard.
- Admin analytics.
- Health endpoint with database ping.
- Rate limiting.
- Security headers.
- Environment validation.
- QA checklist and release notes.

## V1 Status

Pay On Arc is ready for public demos, investor presentations, beta merchants, and V1 release candidate testing on Arc Testnet.
