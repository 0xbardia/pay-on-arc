# Release Process

Pay On Arc releases should be small, reviewed, and migration-aware.

## Versioning

Use semantic versioning:

- patch: bug fixes and docs
- minor: backward-compatible product improvements
- major: breaking API, schema, or deployment changes

Set `APP_VERSION` in production to the release version.

## Release Checklist

1. Confirm `.env.example` and docs are current.
2. Run locally:

   ```bash
   pnpm exec prisma generate
   pnpm exec tsc --noEmit --pretty false
   pnpm lint
   pnpm build
   pnpm worker --help
   ```

3. Review migrations:

   ```bash
   ls prisma/migrations
   ```

4. Create release notes in `CHANGELOG.md`.
5. Tag the release after validation.

## Production Deployment

```bash
pnpm install --frozen-lockfile
pnpm exec prisma migrate deploy
pnpm build
pm2 start ecosystem.config.cjs
pm2 restart pay-on-arc-web
pm2 restart pay-on-arc-worker
```

## Rollback

1. Identify whether the release included migrations.
2. If no migration was included, redeploy the previous commit and restart PM2.
3. If a migration was included, prefer rollback-forward with a corrective migration.
4. Do not manually edit production data unless a maintainer has reviewed the plan.

## Post-Deploy Checks

```bash
curl https://payonarc.xyz/api/health
pm2 status
pm2 logs pay-on-arc-web --lines 100
pm2 logs pay-on-arc-worker --lines 100
```

Smoke test:

- wallet login
- dashboard load
- create payment link
- checkout page opens
- transaction check
- webhook test delivery
- AI disabled/enabled state
