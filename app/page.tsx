import Link from "next/link";
import {
  BarChart3,
  Bot,
  CheckCircle2,
  CreditCard,
  Link2,
  QrCode,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { AnimatedCounter } from "@/components/premium/animated-counter";
import { FadeIn, HoverCard } from "@/components/premium/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WalletConnectButton } from "@/components/wallet-connect-button";

const metrics = [
  { value: 125, prefix: "$", suffix: "K+", label: "Volume Processed" },
  { value: 2, suffix: "s", label: "Average Settlement" },
  { value: 99.9, suffix: "%", label: "Uptime", decimals: 1 },
  { value: 500, suffix: "+", label: "Payment Links" },
];

const features = [
  { icon: Link2, title: "Payment Links", description: "Create hosted checkout links in seconds." },
  { icon: CreditCard, title: "Real USDC Transfers", description: "Accept Arc Testnet ERC-20 USDC from payer wallets." },
  { icon: QrCode, title: "QR Checkout", description: "Every payment page includes a scannable QR." },
  { icon: CheckCircle2, title: "Auto Confirmation", description: "Pending transactions are checked in the background." },
  { icon: Bot, title: "AI Copilot", description: "Turn payment activity into operational insights." },
  { icon: ShieldCheck, title: "Admin Console", description: "Operate with secret-path admin access and allowlists." },
  { icon: BarChart3, title: "Audit Logs", description: "Track auth, payment, admin, and AI actions." },
  { icon: Zap, title: "ArcScan Tracking", description: "Link directly to explorer transaction records." },
];

const transactions = [
  ["Invoice #12", "42.00 USDC", "confirmed"],
  ["Creator drop", "18.50 USDC", "pending"],
  ["Consulting", "120.00 USDC", "paid"],
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <BrandLogo size="md" />
          <span className="text-sm font-semibold text-white">Pay On Arc</span>
        </Link>
        <WalletConnectButton redirectOnAuth="/app/connected" />
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-12 px-6 pb-20 pt-10 lg:grid-cols-[0.9fr_1.1fr]">
        <FadeIn>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-violet-200">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Stripe for USDC payments on Arc
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-bold leading-tight text-white md:text-6xl">
              Stripe-grade USDC payments on Arc
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Create payment links, accept Arc Testnet USDC, track transactions, and get AI-powered merchant insights from one dashboard.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <WalletConnectButton
                authenticatedHref="/app/dashboard"
                authenticatedLabel="Go to dashboard"
                connectLabel="Start accepting payments"
                redirectOnAuth="/app/connected"
                signLabel="Start accepting payments"
              />
              <Button asChild size="lg" variant="outline">
                <Link href="#preview">View live demo</Link>
              </Button>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-violet-600/20 blur-3xl" />
            <div className="relative rounded-2xl border border-white/10 bg-elevated/80 p-4 shadow-premium backdrop-blur">
              <div className="rounded-xl border border-white/10 bg-[#0B0F19] p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Revenue overview</p>
                    <p className="text-xs text-slate-400">Pay On Arc dashboard</p>
                  </div>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                    Live
                  </span>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  {[
                    ["Revenue", "$12,480"],
                    ["Pending", "$420"],
                    ["Paid links", "86"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 space-y-3">
                  {transactions.map(([name, amount, status]) => (
                    <div key={name} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-white">{name}</p>
                        <p className="text-xs text-slate-500">Arc USDC payment</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{amount}</p>
                        <p className="text-xs text-emerald-300">{status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300 md:grid-cols-4">
          {["Built for Arc", "USDC-native", "Wallet-secured", "AI-assisted"].map((item) => (
            <div key={item} className="flex items-center justify-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-6 py-16 md:grid-cols-2">
        <FadeIn>
          <Card className="h-full bg-elevated/60">
            <CardContent className="p-6">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-rose-300">Problem</p>
              <h2 className="mt-4 text-3xl font-bold text-white">Stablecoin payments are powerful, but hard to manage.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Merchants still stitch together wallet requests, screenshots, explorer tabs, and manual follow-up just to accept USDC.
              </p>
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.08}>
          <Card className="h-full bg-elevated/60">
            <CardContent className="p-6">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-300">Solution</p>
              <h2 className="mt-4 text-3xl font-bold text-white">Pay On Arc gives merchants a clean payment layer.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Create payment links, confirm Arc transactions, lock paid links, and summarize operations with AI.
              </p>
            </CardContent>
          </Card>
        </FadeIn>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-4 md:grid-cols-4">
          {metrics.map((metric, index) => (
            <FadeIn key={metric.label} delay={index * 0.06}>
              <Card className="bg-white/[0.03]">
                <CardContent className="p-6">
                  <p className="text-3xl font-bold text-white">
                    <AnimatedCounter
                      value={metric.value}
                      prefix={metric.prefix}
                      suffix={metric.suffix}
                      decimals={metric.decimals ?? 0}
                    />
                  </p>
                  <p className="mt-2 text-sm text-slate-400">{metric.label}</p>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <FadeIn>
          <h2 className="text-3xl font-bold text-white">Everything for stablecoin checkout</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Pay On Arc combines payment links, wallet-native authentication, QR checkout, and operator-grade visibility.
          </p>
        </FadeIn>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <FadeIn key={feature.title} delay={index * 0.04}>
              <HoverCard>
                <Card className="h-full bg-elevated/60">
                  <CardContent className="p-5">
                    <feature.icon className="h-5 w-5 text-violet-300" aria-hidden="true" />
                    <h3 className="mt-5 text-lg font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{feature.description}</p>
                  </CardContent>
                </Card>
              </HoverCard>
            </FadeIn>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <FadeIn>
          <h2 className="text-3xl font-bold text-white">How it works</h2>
        </FadeIn>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {["Connect wallet", "Create payment link", "Customer pays USDC", "Pay On Arc confirms and locks the link"].map((step, index) => (
            <FadeIn key={step} delay={index * 0.08}>
              <div className="relative rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-lg font-semibold text-white">{step}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {index === 0
                    ? "Authenticate with a signed EVM wallet session."
                    : index === 1
                      ? "Set amount, title, expiry, and share a hosted link."
                      : index === 2
                        ? "Payers send ERC-20 USDC directly to your wallet."
                    : "Pay On Arc confirms the transaction and closes the one-time link."}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <section id="preview" className="mx-auto max-w-7xl px-6 py-16">
        <FadeIn>
          <h2 className="text-3xl font-bold text-white">Live product preview</h2>
        </FadeIn>
        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <Card className="bg-elevated/60">
            <CardContent className="p-6">
              <div className="grid gap-4 sm:grid-cols-4">
                {["Revenue", "Pending", "Paid Links", "Recent Transactions"].map((label, index) => (
                  <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="mt-2 text-xl font-bold text-white">{["$9,840", "$340", "54", "128"][index]}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 h-40 rounded-lg border border-white/10 bg-gradient-to-t from-violet-500/20 to-transparent" />
            </CardContent>
          </Card>
          <Card className="bg-elevated/60">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white">Recent activity</h3>
              <div className="mt-4 space-y-3">
                {["Payment received", "Transaction confirmed", "AI analysis generated"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg bg-white/[0.03] p-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                    <p className="text-sm text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <FadeIn>
          <Card className="overflow-hidden bg-elevated/70">
            <CardContent className="grid gap-8 p-8 lg:grid-cols-[0.8fr_1fr]">
              <div>
                <Bot className="h-8 w-8 text-violet-300" aria-hidden="true" />
                <h2 className="mt-5 text-3xl font-bold text-white">AI Copilot</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Turn payment activity into clear recommendations for your next operational move.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0B0F19] p-5">
                <p className="text-sm font-semibold text-white">This week</p>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <p>42 USDC received</p>
                  <p>Most active payment link: Invoice #12</p>
                  <p className="rounded-lg bg-violet-500/10 p-3 text-violet-100">
                    Recommendation: Disable expired links and follow up on pending transactions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <FadeIn>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-premium">
            <h2 className="text-3xl font-bold text-white">Start with your wallet.</h2>
            <p className="mt-3 text-sm text-slate-400">
              No card processor. No bank account. Just USDC on Arc.
            </p>
            <div className="mt-6 flex justify-center">
              <WalletConnectButton
                authenticatedHref="/app/dashboard"
                authenticatedLabel="Go to dashboard"
                connectLabel="Start accepting payments"
                redirectOnAuth="/app/connected"
                signLabel="Start accepting payments"
              />
            </div>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}
