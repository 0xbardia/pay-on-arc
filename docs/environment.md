# Environment Variables

Use `.env.example` as the starting point. Never commit `.env` files or production secrets.

| Variable | Required | Scope | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | Server | PostgreSQL connection string. |
| `SESSION_SECRET` | Yes in production | Server | At least 32 characters. Signs wallet sessions and nonces. |
| `NEXT_PUBLIC_APP_URL` | Yes | Client/server | Public app origin used for payment links, QR codes, metadata, and AI HTTP referer. |
| `APP_VERSION` | Optional | Server | Version shown in health responses and footer. |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | Optional | Client | Enables WalletConnect wallets. Injected wallets still work without it. |
| `ADMIN_PANEL_PATH` | Optional | Server | Secret admin base path. Defaults to `/secure-admin`. |
| `ADMIN_WALLETS` | Optional | Server | Comma-separated lowercase or mixed-case admin wallet allowlist. |
| `NEXT_PUBLIC_ARC_CHAIN_ID` | Optional | Client/server | Arc Testnet chain id. Defaults to `5042002`. |
| `NEXT_PUBLIC_ARC_RPC_URL` | Optional | Client/server | Arc Testnet RPC URL. |
| `NEXT_PUBLIC_ARC_EXPLORER_URL` | Optional | Client/server | ArcScan explorer URL. |
| `NEXT_PUBLIC_ARC_USDC_ADDRESS` | Optional | Client/server | Arc Testnet ERC-20 USDC interface address. |
| `NEXT_PUBLIC_ARC_USDC_DECIMALS` | Optional | Client/server | ERC-20 USDC decimals. Defaults to `6`. |
| `ENABLE_SIMULATED_PAYMENTS` | Optional | Server | Enables simulation fallback. Recommended `false` in production. |
| `OPENROUTER_API_KEY` | Optional | Server | Enables AI Copilot when paired with `AI_COPILOT_ENABLED=true`. |
| `OPENROUTER_MODEL` | Optional | Server | AI model id. Defaults to `openai/gpt-4o-mini`. |
| `AI_COPILOT_ENABLED` | Optional | Server | Set to `true` to enable AI analysis. |
| `PRISMA_QUERY_LOGGING` | Optional | Server | Set to `true` only when debugging Prisma queries. |
| `ARCPAY_DEBUG_REQUESTS` | Optional | Server | Development request logging flag. |
| `JOB_WORKER_POLL_INTERVAL_MS` | Optional | Worker | Queue polling interval. Defaults to `5000`. |
| `JOB_WORKER_SCAN_INTERVAL_MS` | Optional | Worker | Due delivery and transaction scan interval. Defaults to `30000`. |
| `JOB_WORKER_STALE_SECONDS` | Optional | Worker | Releases stale running jobs after this age. Defaults to `120`. |
| `JOB_WORKER_CLAIM_LIMIT` | Optional | Worker | Jobs claimed per loop. Defaults to `10`. |

## Production Minimum

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public"
SESSION_SECRET="replace-with-a-long-random-secret-at-least-32-chars"
NEXT_PUBLIC_APP_URL="https://your-domain.example"
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID="your-walletconnect-project-id"
ADMIN_PANEL_PATH="/secure-admin"
ADMIN_WALLETS="0xadminwallet"
ENABLE_SIMULATED_PAYMENTS="false"
AI_COPILOT_ENABLED="false"
```

## Public Variables

Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Do not put secrets in them.
