# Pay On Arc — Design System

> *Command center for stablecoin payments. Deep. Precise. Focused.*

---

## Design Philosophy

Pay On Arc is a merchant-finance command center — not a consumer app, not a white-label checkout, not a crypto toy. Every pixel serves a merchant operator who needs clarity, confidence, and speed.

**Guiding principles:**

- **One accent, purposefully placed.** A single vivid accent (#7C3AED) reserved strictly for primary CTAs, active states, and the current sidebar item. Everything else stays neutral or derives color from semantic meaning (green=success, amber=pending, red=failure).
- **Surface contrast over shadows.** Elevation is communicated through subtle lightness shifts in the dark palette (#0B0F19 → #111827 → #1A2235), not through drop shadows. This is inspired by Mercury's approach to elevation via light, not shadow.
- **Spacious, not dense.** The 4px base spacing scale ensures generous breathing room around every element. Merchants scan data quickly — whitespace guides the eye.
- **Pill buttons as signature shape.** Every button is a pill (32px corner radius). This single, consistent shape signals clickability without relying on shadow or saturation.
- **High contrast, always.** Primary text is pure white (#F8FAFC) on the deep background. Secondary text is #94A3B8. No low-contrast grays for readable copy.
- **Typography as hierarchy, not decoration.** Headings use lighter font weights for authority through restraint. Body text uses standard weights at 14px for dense data tables.
- **Reduce visual noise.** No decorative shadows, no gradients for backgrounds, no saturated accents outside the primary violet. Every visual element earns its place.

---

## Color System

### Palette

| Token | Value | Role |
|-------|-------|------|
| `--color-abyss` | `#0B0F19` | Outermost page background — deepest layer |
| `--color-surface` | `#111827` | Card / panel / section backgrounds |
| `--color-elevated` | `#1A2235` | Interactive surfaces, hover states, elevated panels |
| `--color-border` | `rgba(255,255,255,0.08)` | Subtle borders and dividers |
| `--color-primary` | `#7C3AED` | Primary CTAs, active indicators, accent |
| `--color-primary-hover` | `#8B5CF6` | Primary button hover state |
| `--color-primary-foreground` | `#F8FAFC` | Text on primary buttons |
| `--color-starlight` | `#F8FAFC` | Primary text — headlines, body, navigation |
| `--color-silver` | `#94A3B8` | Secondary text, descriptions, metadata |
| `--color-success` | `#22C55E` | Confirmed, paid, active states |
| `--color-warning` | `#F59E0B` | Pending, expiring states |
| `--color-danger` | `#EF4444` | Failed, error, revoked states |

### Usage rules

- **Primary violet (#7C3AED) is ONLY for:** primary buttons, active tab indicators, active sidebar item, focus rings, and the current navigation item. Do NOT use as text color, card background, or decorative element.
- **Success green (#22C55E)** — confirmed payments, paid links, connected states, "live" badges.
- **Warning amber (#F59E0B)** — pending transactions, expiring links, attention-needed signals.
- **Danger red (#EF4444)** — failed payments, revoked keys, error states.
- **Text hierarchy:** Starlight (#F8FAFC) for headings and data values. Silver (#94A3B8) for descriptions, labels, subtext.
- **No black (#000000) or pure white (#FFFFFF) as surface colors** — the palette stays within the #0B0F19–#1A2235 range.
- **Elevation is communicated by lightness, not shadow.** Lighter surfaces sit on top of darker ones. No box-shadow for layering — use color shifts only.

---

## Spacing Scale

Base unit: 4px. Density: spacious.

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-4` | 4px | Icon margins, tight inline gaps |
| `--spacing-8` | 8px | Small element gaps, badge padding |
| `--spacing-12` | 12px | Form field inner padding, small card gaps |
| `--spacing-16` | 16px | Button padding, card inner padding, element gap |
| `--spacing-20` | 20px | Section inner padding, form field groups |
| `--spacing-24` | 24px | Card to edge, section spacing, list gaps |
| `--spacing-32` | 32px | Component group separation |
| `--spacing-40` | 40px | Large section spacing |
| `--spacing-56` | 56px | Page section separation |
| `--spacing-72` | 72px | Major page sections |
| `--spacing-80` | 80px | Hero/large content spacing |
| `--spacing-128` | 128px | Full section break spacing |

### Layout rules

- **Page max-width:** 1280px (max-w-7xl)
- **Content padding:** px-6 (24px) on sides
- **Section gap in dashboards:** 32px (space-y-8)
- **Card padding:** 20px-24px (p-5 to p-6)
- **Element gap in grids:** 16px (gap-4)
- **Component group gap:** 8px (gap-2)

---

## Typography

### Font Stack

```css
--font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
  "Segoe UI", Roboto, sans-serif;
```

Inter is the project font. Monospace is used for addresses, tx hashes, and code.

### Type Scale

| Role | Size | Weight | Line Height | Letter Spacing |
|------|------|--------|-------------|----------------|
| caption | 11px | 500 | 1.4 | 0.05em |
| label/small | 12px | 500 | 1.4 | 0.04em |
| body-sm | 13px | 400 | 1.5 | — |
| body | 14px | 400 | 1.5 | — |
| body-lg | 15px | 400 | 1.5 | — |
| subheading | 16px | 600 | 1.4 | — |
| heading-sm | 18px | 700 | 1.35 | — |
| heading | 24px | 700 | 1.25 | — |
| heading-lg | 30px | 700 | 1.2 | — |
| display | 36-48px | 800 | 1.1 | -0.02em |

### Typography rules

- **Headings:** Bold (700) for emphasis. Use font-size to signal hierarchy — not uppercase, not excessive letter-spacing.
- **Body text:** 14px (text-sm) for dense dashboard content. 15px (text-base) for reading prose.
- **Labels and metadata:** 12px-13px, medium weight, silver (#94A3B8) color.
- **Eyebrow labels:** 11px, 500 weight, uppercase, 0.16em tracking (sparingly — only for page section headers).
- **Monospace:** Used for wallet addresses, tx hashes, API keys. 12-13px.
- **No font weight above 800.** No font weight below 400 for body text.
- **Line height is generous** — 1.5 for body text, 1.25-1.35 for headings ensures readability.

---

## Border Radii

| Element | Radius | Token |
|---------|--------|-------|
| Buttons | 32px | `--radius-button` |
| Cards | 12px | `--radius-card` |
| Inputs | 8px | `--radius-input` |
| Badges | 9999px | `--radius-badge` |
| Modals | 16px | `--radius-modal` |
| Icon containers | 8px | `--radius-icon` |
| Small containers | 6px | `--radius-sm` |

### Rules

- **All buttons are pills** (rounded-full or 32px). No exceptions.
- **Cards have consistent 12px radius** across the entire app.
- **Inputs have 8px radius** — sharp enough to look deliberate, soft enough to feel polished.
- **Badges are fully rounded** (pill shape) regardless of content.
- **No 0px radius** on interactive elements (except icon indicators).

---

## Component Library

### Button

**Structure:** Pill shape (rounded-full), 32px radius. Two-tier height: default (h-10) and large (h-11).

**Variants:**
- **Primary** — fill #7C3AED, text #F8FAFC. Hover to #8B5CF6. No shadow.
- **Outline** — 1px border rgba(255,255,255,0.08), transparent bg, text #E2E8F0. Hover bg rgba(255,255,255,0.06).
- **Secondary** — bg #1A2235, text #E2E8F0. Hover to brighter bg.
- **Ghost** — transparent, text #94A3B8. Hover to text #F8FAFC, bg rgba(255,255,255,0.06).
- **Danger** — same shape as outline but border/text in #EF4444 tones.

**States:**
- Disabled: opacity-50, pointer-events-none
- Focus: ring-2 ring-primary/40
- Loading: show spinner icon, disable interaction

### Card

**Structure:** border border-border bg-surface, rounded-xl (12px), no shadow.

**Sub-components:**
- **CardHeader** — p-5, space-y-1.5
- **CardTitle** — text-base (16px) font-semibold, text-starlight
- **CardDescription** — text-sm (14px) text-silver
- **CardContent** — p-5 pt-0

**Rules:**
- Cards never overlap. Each card is a self-contained panel.
- No box-shadow on cards — layering is done with bg color shifts (surface → elevated).
- Cards can have a dashed border variant for empty/drop states: border-dashed border-white/10.

### MetricCard

**Structure:** Card wrapper with value, icon, description, optional trend badge.

**Layout:**
- CardContent p-5
- Title: text-sm text-silver
- Value: text-3xl font-bold text-starlight (with AnimatedCounter)
- Icon container: rounded-lg border bg-white/[0.04] p-2, icon in primary tone
- Description: text-sm text-silver
- Trend badge: rounded-full bg-success/10 text-success text-xs

**Rules:**
- Trend badges only appear when trend data exists. Not a permanent fixture.
- Icons are always in icon container — never floating loose.
- MetricCards in a grid have consistent height (content-based, no min-height hack).

### StatusBadge

**Structure:** inline-flex rounded-full border px-2.5 py-1 text-xs font-medium.

**Color map:**
- ACTIVE / PAID / CONFIRMED → emerald-400/10 bg, emerald-300 text
- PENDING → amber-400/10 bg, amber-300 text
- SIMULATED → violet-400/10 bg, violet-300 text
- FAILED → rose-400/10 bg, rose-300 text
- DISABLED / EXPIRED → slate-500/10 bg, slate-300 text

**Rules:**
- Always lowercase display.
- Always pill shape (rounded-full).
- Always 11px-12px font size.
- Semantic color matches the real-world meaning — not decorative.

### Inputs

**Structure:** h-10 rounded-lg (8px) border border-border bg-[#0B0F19]/70 px-3 text-sm text-starlight.

**States:**
- Default: border-border, bg transparent/dark
- Focus: border-primary (violet), ring-2 ring-primary/20
- Disabled: opacity-50, cursor-not-allowed
- Placeholder: text-silver/60

**Rules:**
- All inputs have 8px radius (not pills — pills are for buttons only).
- Search inputs have a leading icon (Search icon at left, left-3).
- Input groups (form fields) use 12-16px gap.
- Label above input, not inline.
- Select elements styled identically to text inputs.

### Tables

**Structure:** full-width table within a CardContent p-0.

**Thead:** border-b border-border, text-silver text-12px-13px font-medium.
**Th:** px-5 py-3 text-left.
**Tbody tr:** border-b border-border/50, hover:bg-white/[0.03].
**Td:** px-5 py-4 text-sm text-starlight.

**Rules:**
- No alternating row colors — hover highlight is sufficient.
- No table-level border — the containing card provides the outer boundary.
- Responsive: on mobile, switch to card layout (each row becomes a stacked card).
- Last row has no bottom border (border-0 on last child).

### Sidebar

**Structure:** Fixed left column (w-64), bg-[#0B0F19]/90, border-r border-border.

**Layout:**
- Logo + title at top: mb-5, flex items-center gap-3
- Nav items: grid gap-1
- Each nav link: flex items-center gap-3 rounded-md px-3 py-2 text-sm text-silver hover:text-starlight hover:bg-white/[0.06]
- Icons: 16px (h-4 w-4), muted silver, active link gets primary color
- Active state: text-primary font-medium (link text and icon turn primary)

**Mobile:**
- Sticky top bar with hamburger menu
- Full-screen overlay drawer
- Same nav structure, close button at top

**Rules:**
- No shadow on sidebar — use bg + border for definition.
- Sidebar items never have pill background — just text + icon.
- Active item gets primary color on icon and text.

### Topbar

**Structure:** mb-8 flex rounded-xl border border-border bg-[#0B0F19]/70 px-4 py-3.

**Layout:**
- Left: search input (disabled state, placeholder only)
- Right: chain badge, wallet address, connection status, disconnect button

**Rules:**
- Search input is visual-only in V1 (disabled). Serves as a UX placeholder for future.
- Chain name badge, wallet display, and status indicator are all compact badges.
- Disconnect button is ghost variant, icon-only.
- Topbar is NOT sticky — it scrolls with content.

### Toast

**Structure:** Fixed right-4 top-4 z-50, max-w-sm w-[calc(100vw-2rem)].

**Types:**
- success: border-emerald-400/20 bg-emerald-400/10 text-emerald-100
- error: border-rose-400/20 bg-rose-400/10 text-rose-100
- info: border-primary/20 bg-primary/10 text-primary-100

**Layout:**
- Icon (left) + content + dismiss button (right)
- Icon color matches type tone
- Title: text-sm font-semibold text-white
- Description: text-sm opacity-80
- Dismiss: hover:bg-white/10

**Rules:**
- Max 4 toasts visible at once (FIFO).
- Auto-dismiss at 3600ms.
- backdrop-blur-xl for glass effect.
- No shadow — use border + bg for definition.

### CopyField

**Structure:** Flex row button, rounded-lg border border-border bg-[#0B0F19]/60 px-3 py-2.

**Layout:**
- Left: truncated value in font-mono text-xs
- Right: Copy icon + label in primary tone text-xs

**States:**
- Hover: border-primary/30 bg-white/[0.04]
- Copied: label changes to "Copied" for 1400ms

### PageHeader

**Structure:** flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between.

**Layout:**
- Eyebrow (optional): 11px uppercase 0.16em tracking text-primary
- Title: text-3xl font-bold text-starlight
- Description (optional): mt-2 max-w-2xl text-sm leading-6 text-silver
- Actions: right-aligned flex-wrap gap-2

**Rules:**
- Eyebrow is optional and reserved for page context ("Merchant", "Developer", "Admin").
- Actions slot takes buttons or links, right-aligned on desktop.
- Title is always large (30px) and bold.

### Empty States

**Structure:** rounded-xl border border-dashed border-white/10 bg-[#0B0F19]/40 p-8 text-center.

**Layout:**
- Centered icon in rounded container (h-12 w-12)
- Title: text-lg font-semibold text-starlight mt-4
- Description: mx-auto max-w-md text-sm leading-6 text-silver mt-2
- Optional action: button/link centered below description mt-5

**Rules:**
- Always uses dashed border to visually distinguish from data-filled states.
- Icon tone matches the page context (default: primary).
- Action is optional — not all empty states need a CTA.
- Never uses "No data" as title — be specific ("No transactions yet", "No payment links").

### Loading States

**Skeleton structure:** animate-pulse rounded-lg bg-white/[0.06].

**Pre-built skeletons:**
- **CardSkeleton** — 3 pulses (title, value, description)
- **TableSkeleton** — header pulse + N row pulses
- **ChartSkeleton** — full-height pulse for chart area
- **DashboardSkeleton** — combined heading + metric cards + chart/table
- **CopilotSkeleton** — AI page layout with 5 metric cards + chart
- **LoadingState** — inline spinner + label

### Error States

**Structure:** rounded-xl border border-rose-400/20 bg-rose-400/10 p-5.

**Layout:**
- Error icon (AlertCircle) in rose-300
- Title: text-base font-semibold text-starlight mt-3
- Description: text-sm leading-6 text-rose-100/80 mt-2

### Success States

**Structure:** rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-5.

**Layout:**
- Success icon (CheckCircle2) in emerald-300
- Title: text-lg font-semibold text-starlight mt-4
- Description: text-sm leading-6 text-emerald-100/80 mt-2
- Optional footer slot

---

## Chart Components

### RevenueChart

**Structure:** h-72 with ResponsiveContainer, recharts AreaChart.

**Styling:**
- Fill gradient: primary (revenue) or success (transactions) with opacity 0.35→0
- Stroke: 2px, matching the fill color
- Grid: subtle white/0.06 horizontal lines only
- Axes: 12px silver ticks, no axis lines, no tick lines
- Tooltip: dark bg, subtle border, white text
- Empty state: dashed border placeholder with descriptive text

**Rules:**
- Gradients use the same hue as the data series (violet for revenue, green for transactions).
- No chart-level box or frame — chart floats on the card background.
- Margins keep data away from edges.

---

## Motion

### Animation principles

- **Subtle, not flashy.** Animations are 400-600ms easeOut. No bounces. No elastic.
- **Fade + slide.** New content fades in and slides up 18px. Existing content stays put.
- **Hover cards.** Interactive cards lift 4px (y: -4) with slight scale (1.01) on hover. Spring animation, stiffness 260.
- **Loading skeletons** pulse at standard CSS animate-pulse rate.
- **Counters** animate numeric changes (AnimatedCounter component).
- **No entrance animations on dashboard content** — data should appear immediately. Animations are for landing page and transitions.

### Disabled motion

- Users with prefers-reduced-motion get no animations.
- Landing page entrance animations are the ONLY place framer-motion is used for entrance effects.

---

## Accessibility

### Contrast

- All primary text (#F8FAFC) on backgrounds (#0B0F19-#111827) exceeds WCAG AAA contrast ratio.
- Secondary text (#94A3B8) on dark backgrounds meets WCAG AA for 14px+ text.
- Status badges maintain 4.5:1 contrast ratio for their text.
- Links use underline + color to differentiate from body text.

### Interactive targets

- Buttons: minimum 40px height (h-10).
- Icon-only buttons: minimum 40x40px (h-10 w-10).
- Sidebar links: 36px+ row height with 8px vertical padding.
- Clickable cards: full-card click target with 12px+ padding.

### Focus

- All interactive elements visible focus ring: ring-2 ring-primary/40.
- Focus-visible only — no permanent focus rings on click.
- Sidebar links: visible focus indicator on tab navigation.

### Labels

- Icon buttons have aria-label.
- Form inputs have associated labels (wrapping or htmlFor).
- Status indicators (green dot, etc.) have text alternatives.

### Reduced Motion

- `prefers-reduced-motion` disables all framer-motion animations.
- Skeleton pulse still functions (it's a CSS animation the browser can override).
- Toast slide-in uses reduced-safe transform.

---

## Responsive Rules

### Breakpoints

| Breakpoint | Width | Layout Change |
|------------|-------|---------------|
| mobile | < 768px | Single column, sidebar becomes drawer |
| tablet | 768px-1024px | 2-column grids, sidebar visible |
| desktop | 1024px+ | Multi-column, full sidebar, max-width content |

### Mobile-specific

- MetricCards grid: 1 column (md:grid-cols-2, xl:grid-cols-4)
- Sidebar: sticky top bar + overlay drawer
- Tables: switch to card-per-row layout
- Topbar: column layout, stack elements
- PageHeader: column layout, actions below description

### Tablet-specific

- MetricCards: 2 columns
- Sidebar: visible but narrower (w-56 or w-64 based on content)
- Charts: full width, no side-by-side yet

### Desktop

- Full sidebar (w-64)
- MetricCards: 4 columns
- Side-by-side sections (xl:grid-cols-2)
- PageHeader: row layout, actions right-aligned

---

## Forms

### Layout

- Form fields stacked vertically (flex-col gap-4 to gap-6)
- Label above input (text-sm text-silver font-medium)
- Input below label with 6-8px gap
- Submit button at bottom, left-aligned or right-aligned based on context
- Inline validation error below input (text-xs text-danger)

### Input Field

- h-10 rounded-lg border border-border bg-[#0B0F19]/70
- px-3 text-sm text-starlight
- Focus: border-primary ring-2 ring-primary/20
- Disabled: opacity-50
- Placeholder: text-silver/60

### Select

- Same dimensions and styling as text input
- Chevron indicator on right
- Options follow system styling

### Button in forms

- Primary for submit
- Outline or ghost for cancel/reset
- Full-width on mobile if space constrained

---

## Developer Tools Rules

### Webhooks page

- Page header uses eyebrow "Developer" for context
- Webhook manager is a card with inline form for creating endpoints
- Delivery logs in separate card with table/card view
- Secret display uses masked value with CopyField
- Status indicator on each webhook (enabled/disabled)
- Empty state: "No webhooks configured" with create CTA

### API Keys

- Listed in Settings: name, prefix, status (active/revoked), last used
- Create form: name input only (key generated server-side)
- Key reveal: once on creation, then masked forever
- Revoke: confirmation dialog, one-way operation
- Empty state: "No API keys" with create CTA

---

## AI Panel Rules

### AI Copilot page

- Page header uses eyebrow "Merchant"
- Primary card is the intelligence panel (left: description + example queries, right: analyst interface)
- Metric cards: 5 across (total received, active links, paid links, pending txs, confirmed txs)
- Latest insight card + timeline card side by side
- Empty state: "Run your first analysis"
- Disabled state: amber banner explaining OpenRouter requirement

### StructuredInsight component

- Renders clean insight text without markdown artifacts
- Maximum 2-line summary for timeline items
- Full insight in the main card

---

## Merchant UX Principles

1. **Zero cognitive load.** A merchant should understand their payment status within 3 seconds of looking at a page.
2. **Progressive disclosure.** Show summary metrics first. Details (tx hashes, addresses) behind expand/copy.
3. **Action visibility.** The most important action on each page is a primary button. Secondary actions are outline buttons.
4. **Data density with breathing room.** Dense tables are acceptable — but each row has 16px padding, columns are well-spaced.
5. **Status at a glance.** Every payment, link, transaction has a visible status badge in the same semantic color scheme.
6. **No dead ends.** Every empty state has a recommended next action. Every error state has recovery guidance.
7. **Consistent navigation.** Sidebar is the primary navigation. Topbar shows session context. Breadcrumbs are not used (flat hierarchy).
8. **Transparency.** Merchants see their data unfiltered — no algorithmic hiding of failed payments or expired links.

---

## Component Hierarchy

```
PageShell / PageHeader
├── Eyebrow (Merchant | Developer | Admin)
├── Title (h1, bold, 30px)
├── Description (text-sm, max-w-2xl)
└── Actions (buttons, links)

Dashboard Page
├── PageHeader
├── MetricCard grid (4 columns)
├── Empty state (conditional, no payments)
├── Onboarding card (conditional, incomplete setup)
├── Chart section (2 columns: revenue + transactions)
├── Two-column section (quick actions + top links)
├── Two-column section (activity feed + merchant branding)
└── Insights section (3-column grid)

Settings Page
├── PageHeader
├── Merchant Profile card (form)
├── Webhooks card (link out)
├── API Keys card (manager)
├── Grid of SettingsCard (wallet, payment defaults, etc.)
└── Future integrations section

Transactions Page
├── PageHeader
├── Filter bar (search + status + range + apply)
├── Status filter chips
└── Table/card list

Payments Page
├── PageHeader
└── PaymentLinksManager (list + create)

Webhooks Page
├── PageHeader
├── WebhooksManager (endpoints + delivery logs)

AI Copilot Page
├── PageHeader
├── MetricCard grid (5 columns)
├── Intelligence panel (description + analyst card)
├── Latest insight + timeline

Admin Dashboard
├── PageHeader
├── MetricCard grid (5 columns)
├── Analytics period cards (3 columns)

Admin pages (users, payment-links, transactions, etc.)
├── PageHeader
└── Table/list view
```

---

## Tailwind Configuration

The Tailwind config defines the color palette and should not be modified except to add future palette colors. The globals.css sets the base body styling (background gradient, font, selection color).

```css
/* Current theme tokens — for reference only.
   Do NOT modify tailwind.config.ts colors without design review. */

colors: {
  background: "#0B0F19",
  card: "#111827",
  surface: "#111827",
  elevated: "#1A2235",
  border: "rgba(255,255,255,0.08)",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  primary: {
    DEFAULT: "#7C3AED",
    hover: "#8B5CF6",
    foreground: "#F8FAFC",
  },
}
```

---

## Migration & Consistency Checklist

When reviewing or updating any UI element, verify:

- [ ] Button is pill-shaped (rounded-full)
- [ ] Card uses rounded-xl (12px)
- [ ] Input uses rounded-lg (8px)
- [ ] Badge uses rounded-full
- [ ] No box-shadow on elevation — use bg color shift
- [ ] Primary violet (#7C3AED) only for CTAs and active states
- [ ] Body text is 14px (text-sm)
- [ ] Spacing uses 4px base increments
- [ ] Empty states use dashed border
- [ ] Tables switch to cards on mobile
- [ ] Metric cards use AnimatedCounter for values
- [ ] StatusBadge uses semantic color mapping
- [ ] CopyField uses truncated font-mono value
- [ ] Toast auto-dismisses at 3.6s