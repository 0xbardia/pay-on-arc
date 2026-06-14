# Pay On Arc Job Worker

Pay On Arc uses a small Prisma-backed job queue for background work that must survive deploys, PM2 restarts, and multiple web instances.

## What Runs In The Worker

- `WEBHOOK_DELIVERY`: sends signed webhook delivery attempts and schedules durable retries.
- `TRANSACTION_CHECK`: verifies pending Arc Testnet USDC transactions using the same server-side ERC-20 verification logic as manual checks.

The Next.js web process creates database records and enqueues work. It does not run webhook retries or transaction monitoring in memory.

## Commands

```bash
pnpm exec prisma migrate deploy
pnpm build
pm2 start ecosystem.config.cjs
pm2 logs pay-on-arc-worker --lines 100
```

Restart both processes:

```bash
pm2 restart pay-on-arc-web
pm2 restart pay-on-arc-worker
```

## Health Check

`/api/health` includes queue counts:

```bash
curl https://payonarc.xyz/api/health
```

Look for:

- `jobs.pending`
- `jobs.running`
- `jobs.failed`
- `jobs.completed`

## Debugging Stuck Jobs

1. Check worker logs:

   ```bash
   pm2 logs pay-on-arc-worker --lines 200
   ```

2. Confirm the worker is online:

   ```bash
   pm2 status
   ```

3. Check `/api/health` for growing `pending`, `running`, or `failed` counts.

4. Restart the worker. Stale `RUNNING` jobs are released on worker startup:

   ```bash
   pm2 restart pay-on-arc-worker
   ```

## Safety Notes

- Job payloads only contain IDs, not secrets.
- Webhook signing secrets remain server-side.
- Transaction confirmation still requires verified Arc Testnet ERC-20 USDC transfer logs.
- Duplicate job execution is safe because transaction checks and webhook delivery rows are idempotent.
