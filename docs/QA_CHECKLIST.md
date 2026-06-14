# Pay On Arc V1 QA Checklist

## Auth

- Connect injected wallet.
- Connect WalletConnect wallet.
- Sign login message.
- Refresh dashboard and confirm session persists.
- Disconnect wallet and confirm session clears.
- Switch wallet account and confirm a new signature is required.
- Confirm `/app/*` redirects unauthenticated users to `/`.

## Payments

- Create a USDC payment link.
- Confirm public URL uses `NEXT_PUBLIC_APP_URL`.
- Confirm QR code encodes the same URL.
- Open checkout page on desktop and mobile.
- Switch wallet to Arc Testnet.
- Submit Arc Testnet ERC-20 USDC payment.
- Confirm transaction hash is recorded.
- Confirm paid link cannot be paid again.

## Transactions

- Confirm new payment appears as pending.
- Run manual status check.
- Confirm successful receipt updates to confirmed.
- Confirm failed receipt updates to failed.
- Confirm ArcScan links open correctly.
- Confirm filters work for all statuses.

## API Keys

- Create API key.
- Copy one-time raw key.
- Confirm key is no longer visible after closing modal.
- Call `GET /api/v1/me` with bearer token.
- Confirm `lastUsedAt` updates.
- Revoke key.
- Confirm revoked key cannot authenticate.

## Webhooks

- Create webhook endpoint.
- Copy one-time signing secret.
- Send test event.
- Inspect delivery payload, headers, and response.
- Disable webhook and confirm test send is blocked.
- Re-enable webhook.
- Regenerate secret and confirm one-time reveal.
- Retry failed delivery.

## Admin

- Confirm no public admin link exists.
- Visit `/admin` and confirm it redirects away.
- Visit configured `ADMIN_PANEL_PATH`.
- Confirm non-admin wallet gets denied.
- Confirm allowlisted wallet can access dashboard.
- Review users, payment links, transactions, AI usage, settings, and audit logs.

## AI Copilot

- Confirm disabled state when OpenRouter is not configured.
- Run analysis when configured.
- Confirm structured insight cards render.
- Confirm previous insights list updates.
- Confirm rate limiting after repeated requests.

## Analytics

- Confirm merchant dashboard metrics load once.
- Confirm revenue and transaction charts are responsive.
- Confirm empty states render with no data.
- Confirm admin analytics show 24h, 7d, and 30d panels.

## Security

- Confirm security headers exist.
- Confirm `/api/health` returns database status.
- Confirm webhook URLs reject private network addresses in production.
- Confirm API keys and webhook secrets are never exposed after creation.
