# Pay On Arc Launch Checklist

## Responsive Audit

- Landing page verified at 320, 375, 390, 414, 768, 1024, 1280, and 1440px.
- Merchant sidebar collapses to mobile drawer navigation.
- Dashboard metrics collapse from 4 columns to 2 columns to 1 column.
- Tables render as mobile cards below tablet width.
- Checkout page remains thumb-friendly on mobile.

## Error Audit

- Global 404 page returns users to the dashboard.
- Global error page provides retry action.
- Wallet disconnect and session mismatch redirect safely.
- AI, payment, and copy actions surface toast feedback.

## Loading Audit

- Dashboard uses skeleton loading.
- Payments uses skeleton loading.
- Transactions uses skeleton loading.
- AI Copilot uses skeleton loading.
- Revenue chart is lazy-loaded.

## Accessibility Audit

- Icon-only buttons include labels.
- Focus rings are visible on interactive controls.
- Primary text contrast is white on dark surfaces.
- Status badges use color plus text.
- Mobile navigation remains keyboard reachable.

## SEO Audit

- Landing page has clear product positioning.
- Root metadata is present.
- User-protected app routes remain dynamic and private.

## Security Audit

- Admin path remains hidden behind `ADMIN_PANEL_PATH`.
- Admin access requires wallet session and `ADMIN_WALLETS`.
- Payment links remain one-time use.
- Session validation and logout cleanup remain active.
- Audit logs track auth, payment, transaction, AI, and admin events.
