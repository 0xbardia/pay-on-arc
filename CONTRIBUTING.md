# Contributing to Pay On Arc

Thanks for your interest in contributing. Pay On Arc is a Next.js, Prisma, and Web3 payment platform for Arc Testnet USDC.

## Local Setup

1. Fork and clone the repository.
2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

4. Configure `DATABASE_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_APP_URL`, and wallet settings.
5. Apply migrations and generate Prisma Client:

   ```bash
   pnpm exec prisma migrate dev
   pnpm exec prisma generate
   ```

6. Start the web app:

   ```bash
   pnpm dev
   ```

7. Start the worker in a second terminal when testing background jobs:

   ```bash
   pnpm worker
   ```

## Coding Standards

- Use TypeScript.
- Keep business logic server-side when it affects auth, payments, webhooks, or admin access.
- Never trust client-provided `userId`, recipient wallet, amount, or transaction status.
- Keep wallet/payment/security changes small and well-reviewed.
- Prefer existing components, helpers, and styling patterns.
- Avoid adding dependencies unless they remove clear operational risk or complexity.

## Pull Request Workflow

1. Create a focused branch.
2. Keep PRs small enough to review.
3. Add or update documentation when behavior changes.
4. Run:

   ```bash
   pnpm exec prisma generate
   pnpm exec tsc --noEmit --pretty false
   pnpm lint
   pnpm build
   ```

5. Fill out the pull request template.

## Security-Sensitive Areas

Extra review is required for:

- wallet authentication
- nonce/session handling
- payment verification
- API key handling
- webhook signing and delivery
- admin authorization
- rate limiting
- environment variable handling

## Reporting Vulnerabilities

Do not open a public issue for vulnerabilities. Follow [SECURITY.md](SECURITY.md).
