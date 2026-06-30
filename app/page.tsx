import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Link2,
  QrCode,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { AnimatedCounter } from "@/components/premium/animated-counter";
import { FadeIn } from "@/components/premium/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WalletConnectButton } from "@/components/wallet-connect-button";

/* ── Data ── */
const metrics = [
  { value: 125, prefix: "$", suffix: "K+", label: "Volume Processed" },
  { value: 2, suffix: "s", label: "Average Settlement" },
  { value: 99.9, suffix: "%", label: "Uptime", decimals: 1 },
  { value: 500, suffix: "+", label: "Payment Links" },
];

const features = [
  { icon: Link2, title: "Payment Links", desc: "Create branded checkout links in seconds. Set amounts, titles, and expiry — then share anywhere." },
  { icon: CreditCard, title: "USDC Transfers", desc: "Accept Arc Testnet ERC-20 USDC directly to your wallet. No intermediary." },
  { icon: QrCode, title: "QR Checkout", desc: "Every payment page includes a scannable QR code for instant mobile payment." },
  { icon: CheckCircle2, title: "Auto Confirmation", desc: "Pending transactions are verified in the background. Links lock automatically on payment." },
  { icon: Bot, title: "AI Copilot", desc: "Turn payment activity into operational insights and clear next actions." },
  { icon: BarChart3, title: "Analytics", desc: "Revenue trends, top links, growth rates, and transaction volumes at a glance." },
  { icon: ShieldCheck, title: "Admin Console", desc: "Secret-path admin access with allowlists, audit logs, and platform-wide visibility." },
  { icon: Wallet, title: "Wallet-Native Auth", desc: "Authenticate with a signed EVM session. No passwords. No email." },
];

const steps = [
  { step: "Connect", desc: "Sign in with your EVM wallet — no email, no password" },
  { step: "Create & Share", desc: "Set amount, title, and expiry. Share the link or QR code." },
  { step: "Get Paid", desc: "Customer sends USDC directly. Pay On Arc confirms and locks the link." },
];

const recentActivity = [
  { name: "Invoice #12", amount: "42.00 USDC", status: "confirmed" },
  { name: "Creator drop", amount: "18.50 USDC", status: "pending" },
  { name: "Consulting", amount: "120.00 USDC", status: "paid" },
];

const aiInsights = [
  { label: "Revenue trend", value: "+34% this week", type: "positive" },
  { label: "Pending attention", value: "2 unpaid invoices", type: "warning" },
  { label: "Top link", value: "Invoice #12 ($42)", type: "neutral" },
  { label: "Recommendation", value: "Disable expired links", type: "action" },
];

/* ── Helpers ── */
function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-silver">{children}</p>;
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-5 text-center text-4xl font-bold leading-tight text-starlight md:text-5xl md:leading-[1.15]">{children}</h2>;
}
function SectionSubtitle({ children }: { children: React.ReactNode }) {
  return <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-7 text-silver">{children}</p>;
}

/* A simple SVG area chart for the hero preview */
function SvgAreaChart() {
  const points = [
    { x: 0, y: 35 }, { x: 1, y: 48 }, { x: 2, y: 42 }, { x: 3, y: 62 },
    { x: 4, y: 55 }, { x: 5, y: 78 }, { x: 6, y: 68 }, { x: 7, y: 82 },
    { x: 8, y: 74 }, { x: 9, y: 90 }, { x: 10, y: 80 }, { x: 11, y: 88 },
  ];
  const w = 240, h = 60;
  const maxY = 100;
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${(p.x / (points.length - 1)) * w},${h - (p.y / maxY) * h}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="heroChartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5266eb" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#5266eb" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#heroChartGrad)" />
      <path d={line} fill="none" stroke="#5266eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Dashboard preview card */
function DashboardPreview() {
  return (
    <div className="rounded-2xl border border-border bg-elevated/60 p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="text-sm font-semibold text-starlight">Revenue overview</p>
          <p className="text-xs text-silver">Last 7 days</p>
        </div>
        <span className="rounded-full bg-success/10 px-3 py-1 text-[11px] font-medium text-success">● Live</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: "Revenue", value: "$12,480" },
          { label: "Pending", value: "$420" },
          { label: "Links", value: "86" },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-border bg-[#0B0F19]/60 p-3">
            <p className="text-[11px] text-silver">{m.label}</p>
            <p className="mt-1 text-lg font-bold text-starlight">{m.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 h-16 rounded-lg border border-border bg-[#0B0F19]/60 p-2">
        <SvgAreaChart />
      </div>
      <div className="mt-4 space-y-2">
        {recentActivity.map((tx) => (
          <div key={tx.name} className="flex items-center justify-between rounded-lg bg-[#0B0F19]/60 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-starlight">{tx.name}</p>
              <p className="text-[11px] text-silver">Arc USDC</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-starlight">{tx.amount}</p>
              <p className={`text-[11px] ${tx.status === "confirmed" || tx.status === "paid" ? "text-success" : "text-warning"}`}>{tx.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Merchant Dashboard Preview */
function MerchantDashboardPreview() {
  return (
    <div className="rounded-2xl border border-border bg-elevated/60 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-silver">Today at a glance</p>
          <h3 className="mt-2 text-2xl font-bold text-starlight">Acme Merchants</h3>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-silver">7D</span>
          <span className="inline-flex items-center rounded-full border border-primary bg-primary px-3 py-1.5 text-xs text-white">30D</span>
          <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-silver">90D</span>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Revenue", value: "$12,480.00" },
          { label: "Revenue (7d)", value: "$3,240.00", trend: "+12.5%" },
          { label: "Transactions", value: "128" },
          { label: "Active Links", value: "14" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs text-silver">{m.label}</p>
            <p className="mt-2 text-2xl font-bold text-starlight">{m.value}</p>
            {m.trend ? <span className="mt-2 inline-flex rounded-full bg-success/10 px-2 py-0.5 text-[11px] text-success">{m.trend}</span> : null}
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm font-semibold text-starlight">Revenue over time</p>
          <div className="mt-4 h-20"><SvgAreaChart /></div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm font-semibold text-starlight">Top Links</p>
          <div className="mt-4 space-y-3">
            {[
              { title: "Invoice #12", rev: "$42.00", status: "paid" },
              { title: "Consulting", rev: "$120.00", status: "paid" },
              { title: "SaaS sub", rev: "$25.00", status: "confirmed" },
            ].map((l) => (
              <div key={l.title} className="flex items-center justify-between rounded-lg bg-[#0B0F19]/60 px-3 py-2">
                <p className="text-sm font-medium text-starlight">{l.title}</p>
                <span className="rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-[11px] text-success">{l.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* AI Showcase */
function AiShowcase() {
  return (
    <div className="rounded-2xl border border-border bg-elevated/60 p-5 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Bot className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <h3 className="mt-5 text-2xl font-bold text-starlight">Payment intelligence</h3>
          <p className="mt-3 text-base leading-7 text-silver">
            Your AI copilot analyzes payment links, revenue trends, pending transactions, and performance to deliver actionable recommendations.
          </p>
          <div className="mt-5 space-y-2">
            {aiInsights.map((insight) => (
              <div key={insight.label} className={`rounded-lg border px-3 py-2.5 text-sm ${
                insight.type === "positive" ? "border-success/20 bg-success/10 text-success" :
                insight.type === "warning" ? "border-warning/20 bg-warning/10 text-warning" :
                insight.type === "action" ? "border-primary/20 bg-primary/10 text-starlight" :
                "border-border bg-surface text-starlight"
              }`}>
                <span className="text-[11px] uppercase tracking-wider opacity-70">{insight.label}</span>
                <p className="mt-0.5 font-medium">{insight.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-[#0B0F19] p-5">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <div className="h-2.5 w-2.5 rounded-full bg-success" />
            <p className="text-sm font-semibold text-starlight">Pay On Arc analyst</p>
          </div>
          <div className="mt-4 space-y-4 text-sm text-silver">
            <p>Your workspace has processed <span className="font-semibold text-starlight">$12,480</span> across 14 active payment links.</p>
            <p>Revenue this week is up <span className="font-semibold text-success">34%</span> compared to the previous 7 days.</p>
            <div className="rounded-lg bg-primary/10 p-3 text-starlight">
              <span className="text-[11px] uppercase tracking-wider opacity-70">Recommended action</span>
              <p className="mt-1 font-medium">Disable 3 expired links and follow up on 2 pending payments.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#0B0F19]">
      {/* Navigation */}
      <header className="relative z-50 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-3">
          <BrandLogo size="md" />
          <span className="text-sm font-semibold text-starlight">Pay On Arc</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="https://docs.payonarc.xyz" className="text-sm text-silver transition hover:text-starlight" target="_blank">Docs</Link>
          <Link href="https://github.com/pay-on-arc" className="text-sm text-silver transition hover:text-starlight" target="_blank">GitHub</Link>
          <Link href="#preview" className="text-sm text-silver transition hover:text-starlight">Demo</Link>
          <Link href="/app/dashboard" className="text-sm text-silver transition hover:text-starlight">Dashboard</Link>
        </nav>
        <WalletConnectButton redirectOnAuth="/app/connected" />
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pb-16 pt-8 md:pt-16">
        <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <FadeIn>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.04] px-4 py-1.5 text-xs font-medium text-starlight">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                No banks. No cards. Just USDC on Arc.
              </div>
              <h1 className="mt-8 text-5xl font-bold leading-[1.08] tracking-tight text-starlight md:text-7xl">
                Accept USDC payments in 30 seconds.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-silver">
                Create branded payment links, verify Arc Testnet USDC transfers, track every transaction, and understand your merchant activity from one command center.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <WalletConnectButton
                  authenticatedHref="/app/dashboard"
                  authenticatedLabel="Go to dashboard"
                  connectLabel="Start accepting payments"
                  redirectOnAuth="/app/connected"
                  signLabel="Start accepting payments"
                />
                <Button asChild size="lg" variant="outline">
                  <Link href="#preview">View live demo <ChevronRight className="h-4 w-4" aria-hidden="true" /></Link>
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-6 text-xs text-silver">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />No credit card</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />No bank account</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />Wallet-secured</span>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.15}>
            <DashboardPreview />
          </FadeIn>
        </div>
      </section>

      {/* Trust Section */}
      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-elevated/40 p-3 sm:grid-cols-3 md:grid-cols-6">
          {[
            { icon: Zap, label: "Open Source" },
            { icon: ShieldCheck, label: "Arc Testnet" },
            { icon: Wallet, label: "Wallet Native" },
            { icon: CheckCircle2, label: "USDC Verification" },
            { icon: Link2, label: "Webhooks" },
            { icon: Zap, label: "API Keys" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-center gap-2 rounded-lg bg-surface px-3 py-3 text-sm text-silver">
              <item.icon className="h-4 w-4 text-primary" aria-hidden="true" />
              {item.label}
            </div>
          ))}
        </div>
      </section>

      {/* Merchant Problems (3+3) */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <FadeIn>
            <div className="space-y-6">
              <SectionEyebrow>Before Pay On Arc</SectionEyebrow>
              <h3 className="text-3xl font-bold text-starlight">The old way was broken</h3>
              <div className="space-y-4">
                {[
                  "Request a wallet address via email or chat. Wait for a screenshot to confirm.",
                  "Manually check the explorer. Stitch together spreadsheets and browser tabs.",
                  "Hope nothing went wrong — because there's no confirmation system.",
                ].map((pain, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-danger/10 text-xs text-danger">{i + 1}</span>
                    <p className="text-sm leading-6 text-silver">{pain}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="space-y-6">
              <SectionEyebrow>With Pay On Arc</SectionEyebrow>
              <h3 className="text-3xl font-bold text-starlight">A single command center</h3>
              <div className="space-y-4">
                {[
                  "Create a branded payment link in 30 seconds. Share the link or QR code.",
                  "Pay On Arc automatically detects the transaction and confirms it — no manual checking.",
                  "The link locks after payment. No double-spend. View revenue and trends from one dashboard.",
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-success/20 bg-success/[0.03] p-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10"><CheckCircle2 className="h-3.5 w-3.5 text-success" /></span>
                    <p className="text-sm leading-6 text-starlight">{benefit}</p>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <Button asChild><Link href="/app/payments">Create your first payment link <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <FadeIn>
          <SectionEyebrow>Why Pay On Arc</SectionEyebrow>
          <SectionTitle>Better than the alternatives</SectionTitle>
        </FadeIn>
        <div className="mt-12 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-5 py-4 font-medium text-starlight">Capability</th>
                <th className="px-5 py-4 font-medium text-starlight">Pay On Arc</th>
                <th className="px-5 py-4 font-medium text-silver">Manual Wallet</th>
                <th className="px-5 py-4 font-medium text-silver">Traditional Processor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["Setup time", "30 seconds", "Minutes", "Days to weeks"],
                ["Bank account required", "No", "No", "Yes"],
                ["Payment confirmation", "Automatic", "Manual checking", "Automatic"],
                ["Link locking", "Automatic", "None", "Depends on processor"],
                ["QR checkout", "Built-in", "Manual", "Requires integration"],
                ["Analytics", "Built-in", "None", "Available"],
                ["AI insights", "Included", "None", "Extra cost"],
                ["Open source", "Yes (MIT)", "N/A", "No"],
                ["Fees", "None", "None", "2-3% + $0.30"],
              ].map((row, i) => (
                <tr key={i} className="transition hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 font-medium text-starlight">{row[0]}</td>
                  <td className="px-5 py-3.5"><span className="inline-flex items-center gap-1.5 text-success"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />{row[1]}</span></td>
                  <td className="px-5 py-3.5 text-silver">{row[2]}</td>
                  <td className="px-5 py-3.5 text-silver">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Product Experience (Apple-style) */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <FadeIn>
          <SectionEyebrow>Product Experience</SectionEyebrow>
          <SectionTitle>Everything you need to get paid</SectionTitle>
          <SectionSubtitle>Pay On Arc combines payment links, QR checkout, wallet-native auth, AI analysis, and merchant operations into one workspace.</SectionSubtitle>
        </FadeIn>
        <div className="mt-16 space-y-24">
          <FadeIn>
            <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"><LayoutDashboard className="h-6 w-6 text-primary" aria-hidden="true" /></div>
                <h3 className="mt-6 text-2xl font-bold text-starlight">Merchant Dashboard</h3>
                <p className="mt-3 text-base leading-7 text-silver">Track revenue, top-performing payment links, transaction volume, and growth trends — all from a single command center.</p>
              </div>
              <div className="rounded-2xl border border-border bg-elevated/60 p-4 sm:p-5">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                  {[{label:"Revenue", value:"$12,480"},{label:"Pending", value:"$420"},{label:"Links", value:"86"},{label:"Growth", value:"+12.5%"}].map((m) => (
                    <div key={m.label} className="rounded-lg border border-border bg-[#0B0F19]/60 p-2 sm:p-3">
                      <p className="text-[10px] text-silver sm:text-[11px]">{m.label}</p>
                      <p className="mt-1 text-sm font-bold text-starlight sm:text-base">{m.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 h-12"><SvgAreaChart /></div>
              </div>
            </div>
          </FadeIn>
          <FadeIn>
            <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"><CreditCard className="h-6 w-6 text-primary" aria-hidden="true" /></div>
                <h3 className="mt-6 text-2xl font-bold text-starlight">Checkout Page</h3>
                <p className="mt-3 text-base leading-7 text-silver">Every payment link generates a branded checkout page. Customers see the merchant name, amount, QR code, and wallet connection.</p>
              </div>
              <div className="rounded-2xl border border-border bg-elevated/60 p-4 sm:p-5">
                <div className="rounded-xl border border-border bg-[#0B0F19] p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <BrandLogo alt="Merchant" size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-starlight">Acme Merchants</p>
                      <p className="font-mono text-[11px] text-silver">0x1234...5678</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg border border-primary/20 bg-primary/10 p-3">
                    <p className="text-[11px] text-silver">Amount due</p>
                    <p className="text-2xl font-bold text-starlight">42.00</p>
                    <p className="text-xs text-silver">USDC · Arc Testnet</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Everything Included */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <FadeIn>
          <SectionEyebrow>Everything Included</SectionEyebrow>
          <SectionTitle>One platform. Every tool you need.</SectionTitle>
          <SectionSubtitle>From payment links to AI analysis, admin consoles to webhooks — Pay On Arc gives merchants everything to operate stablecoin checkout professionally.</SectionSubtitle>
        </FadeIn>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <FadeIn key={feature.title} delay={i * 0.03}>
              <Card className="h-full bg-elevated/60 transition-colors hover:border-primary/30">
                <CardContent className="p-5 sm:p-6">
                  <feature.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="mt-5 text-lg font-semibold text-starlight">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-silver">{feature.desc}</p>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* How It Works (3 steps) */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <FadeIn>
          <SectionEyebrow>How it works</SectionEyebrow>
          <SectionTitle>From zero to paid in minutes</SectionTitle>
          <SectionSubtitle>No onboarding calls. No paperwork. No bank integration. Just connect your wallet, create a link, and get paid.</SectionSubtitle>
        </FadeIn>
        <div className="relative mt-16">
          <div className="absolute left-0 right-0 top-9 hidden h-px bg-border md:block" />
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((item, i) => (
              <FadeIn key={item.step} delay={i * 0.08}>
                <div className="relative flex flex-col items-center text-center">
                  <span className="relative z-10 flex items-center justify-center rounded-full bg-primary text-xl font-bold text-white" style={{ width: 56, height: 56 }}>{i + 1}</span>
                  <h3 className="mt-5 text-base font-semibold text-starlight">{item.step}</h3>
                  <p className="mt-2 text-xs leading-5 text-silver">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <FadeIn>
          <SectionEyebrow>Dashboard Preview</SectionEyebrow>
          <SectionTitle>Your merchant command center</SectionTitle>
          <SectionSubtitle>Everything you need to run your stablecoin payment operation — revenue, trends, top links, and activity — in one glance.</SectionSubtitle>
        </FadeIn>
        <div className="mt-12"><FadeIn delay={0.1}><MerchantDashboardPreview /></FadeIn></div>
      </section>

      {/* AI Copilot */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <FadeIn>
          <SectionEyebrow>AI Copilot</SectionEyebrow>
          <SectionTitle>The intelligence layer</SectionTitle>
          <SectionSubtitle>Your payment data generates real-time insights, revenue trends, risk alerts, and actionable recommendations — automatically.</SectionSubtitle>
        </FadeIn>
        <div className="mt-12"><FadeIn delay={0.1}><AiShowcase /></FadeIn></div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-6 py-32">
        <FadeIn>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold leading-tight text-starlight md:text-5xl">Start with your wallet.</h2>
            <p className="mt-5 text-base leading-7 text-silver">No card processor. No bank account. No paperwork. Just connect your wallet and start accepting USDC payments in under a minute.</p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <WalletConnectButton
                authenticatedHref="/app/dashboard"
                authenticatedLabel="Go to dashboard"
                connectLabel="Start accepting payments"
                redirectOnAuth="/app/connected"
                signLabel="Start accepting payments"
              />
              <Button asChild variant="outline"><Link href="/app/dashboard"><LayoutDashboard className="h-4 w-4" aria-hidden="true" />Explore the dashboard</Link></Button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-silver">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />No hidden fees</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />Open source</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />Self-custodial</span>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <span className="text-sm text-silver">Pay On Arc</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="https://docs.payonarc.xyz" className="text-silver transition hover:text-starlight" target="_blank">Docs</Link>
            <Link href="https://github.com/pay-on-arc" className="text-silver transition hover:text-starlight" target="_blank">GitHub</Link>
            <Link href="/api/v1/me" className="text-silver transition hover:text-starlight">API</Link>
            <Link href="/privacy" className="text-silver transition hover:text-starlight">Privacy</Link>
            <Link href="https://status.payonarc.xyz" className="text-silver transition hover:text-starlight" target="_blank">Status</Link>
          </nav>
          <p className="text-xs text-silver">&copy; {new Date().getFullYear()} Pay On Arc. MIT License.</p>
        </div>
      </footer>
    </main>
  );
}