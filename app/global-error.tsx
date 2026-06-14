"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en" className="dark">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-background px-6">
          <div className="w-full max-w-lg rounded-xl border border-border bg-elevated/70 p-8 text-center shadow-premium">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-rose-500/15 text-rose-200">
              <AlertTriangle className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="mt-6 text-3xl font-bold text-white">Something went wrong</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Pay On Arc hit an unexpected production error. Retry the request or contact the operator if it persists.
            </p>
            <Button className="mt-6" onClick={reset} type="button">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
