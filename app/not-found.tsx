import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <Card className="max-w-lg bg-elevated/70 text-center">
        <CardContent className="p-8">
          <BrandLogo className="mx-auto" size="xl" />
          <h1 className="mt-6 text-3xl font-bold text-white">Page not found</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            The page you are looking for does not exist or has moved.
          </p>
          <Button asChild className="mt-6">
            <Link href="/app/dashboard">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Return to dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
