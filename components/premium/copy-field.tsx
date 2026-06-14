"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

export function CopyField({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button
      aria-label={label}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-slate-950/60 px-3 py-2 text-left text-sm text-slate-300 transition hover:border-violet-400/30 hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-violet-400"
      onClick={handleCopy}
      type="button"
    >
      <span className="min-w-0 truncate font-mono text-xs">{value}</span>
      <span className="inline-flex items-center gap-1 text-xs text-violet-300">
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}
