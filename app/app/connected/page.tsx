import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, CreditCard, Gauge } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentWalletSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function WalletConnectedPage() {
  const session = await getCurrentWalletSession();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-xl bg-elevated/70 text-center">
        <CardContent className="p-8">
          <BrandLogo className="mx-auto" size="xl" />
          <div className="mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
            <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-white">Wallet Connected</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
            Your Pay On Arc merchant workspace is ready.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/app/payments">
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                Create Payment Link
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/app/dashboard">
                <Gauge className="h-4 w-4" aria-hidden="true" />
                Go To Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
