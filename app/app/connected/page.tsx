import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, CreditCard, Gauge, Settings, Webhook } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentWalletSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const nextSteps = [
  { icon: CreditCard, label: "Create your first payment link", desc: "Set amount, title, and share a hosted checkout page.", href: "/app/payments" },
  { icon: Gauge, label: "Explore the dashboard", desc: "Track revenue, top links, and transaction activity.", href: "/app/dashboard" },
  { icon: Webhook, label: "Configure webhooks", desc: "Send payment events to your backend automatically.", href: "/app/webhooks" },
];

export default async function WalletConnectedPage() {
  const session = await getCurrentWalletSession();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Card className="w-full max-w-lg bg-elevated/70 text-center">
        <CardContent className="p-10">
          <BrandLogo className="mx-auto" size="md" />
          <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-9 w-9 text-success" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-starlight">Wallet Connected</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-silver">
            Your merchant workspace is ready. Here&apos;s what you can do next.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/app/payments">
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                Create Payment Link
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/app/dashboard">
                <Gauge className="h-4 w-4" aria-hidden="true" />
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-10 w-full max-w-2xl">
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.16em] text-silver">Next steps</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {nextSteps.map((step) => (
            <Link
              key={step.label}
              href={step.href}
              className="group rounded-xl border border-border bg-surface p-5 text-center transition hover:border-primary/30"
            >
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <step.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-starlight">{step.label}</h3>
              <p className="mt-2 text-xs leading-5 text-silver">{step.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}