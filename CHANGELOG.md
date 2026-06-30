# Changelog

All notable changes to Pay On Arc are documented here.

## v1.2.0 (unreleased)

### Product Experience — Mercury Edition

- **Dashboard redirect fix.** Added try/catch error handling around session check and user lookup in app layout to prevent 307 redirect loops caused by stale build artifacts or transient `cookies()` API failures. If session check throws, user is redirected to home for re-authentication.
- **Design System.** Mercury-inspired design language with single accent (#5266eb), surface contrast, pill buttons, spacious spacing, and no decorative shadows or gradients.
- **Landing page redesign.** Complete rebuild with hero asymmetry, comparison table, trust section, SVG charts, 3-step how-it-works, and premium SaaS footer. Reduced from 810 to ~660 lines.
- **Dashboard Mission Control.** Revenue hero number, 4 primary metrics (down from 8), inline alerts near top, real recharts-based charts (no CSS bar mockups), activity feed, quick actions, and insights.
- **Transactions (Stripe-style).** 5-column focused table (Amount, Status, Payer, Date, Details), expandable rows for recipient/tx hash/explorer, compact mobile cards, no duplicate filters.
- **Payment Links (product cards).** Removed disabled "Duplicate" button, cleaner card layout with dominant amount and status, QR accessible via toggle.
- **AI Workspace.** Real-time data snapshot replaces decorative example prompts. Summary strip with warning highlight for pending items. Real analytics narrative driven by merchant data.
- **Checkout trust redesign.** Trust badges moved to top, smaller QR (100px), security footer, cleaner layout.
- **Settings Workspace.** Brand/Business/Developers/Security grouping instead of flat card list.
- **Sidebar active state.** Current route highlighting with `usePathname()`, removes glassmorphism, keyboard focus support.
- **Topbar cleanup.** Removed disabled search bar. Compact page-context display with wallet status.
- **Color system.** Primary accent changed from #7C3AED (violet) to #5266eb (Mercury Blue). Removed decorative background gradients.
- **Design system document.** Created `PAYONARC_DESIGN_SYSTEM.md` with full token reference, component specs, and usage rules.

## v1.0.0

- Initial release.
- Wallet signed-message authentication.
- Merchant dashboard and settings.
- Merchant profiles and checkout branding.
- Arc Testnet ERC-20 USDC payment links.
- One-time payment link locking.
- Server-side USDC transfer verification.
- Transaction records, status checks, and analytics.
- API key creation, revocation, and usage tracking.
- Signed webhooks and delivery logs.
- Durable background worker for webhook delivery and transaction checks.
- AI Copilot for merchant payment insights.
- Secret-path admin panel with wallet allowlist.
- Audit logs, security headers, rate limiting, and health endpoint.
- Production deployment documentation.