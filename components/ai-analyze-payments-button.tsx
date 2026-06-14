"use client";

import { useState } from "react";
import { Bot, Loader2 } from "lucide-react";
import { StructuredInsight } from "@/components/premium/structured-insight";
import { useToast } from "@/components/premium/toast";
import { Button } from "@/components/ui/button";

type AiAnalyzePaymentsButtonProps = {
  disabled: boolean;
};

type AnalyzeResponse = {
  error?: string;
  message?: string;
  insight?: {
    summary: string;
  };
};

export function AiAnalyzePaymentsButton({ disabled }: AiAnalyzePaymentsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();

  async function handleAnalyze() {
    if (isLoading || disabled) {
      return;
    }

    setIsLoading(true);
    setError(null);
    notify({ type: "info", title: "Refreshing data", description: "Analyzing your payment activity." });

    try {
      const response = await fetch("/api/ai/analyze-payments", {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as AnalyzeResponse | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? payload?.error ?? "Could not analyze payments.");
      }

      setInsight(payload?.insight?.summary ?? "No insight returned.");
      notify({ type: "success", title: "AI analysis complete" });
    } catch (analyzeError) {
      const message = analyzeError instanceof Error ? analyzeError.message : "Could not analyze payments.";
      setError(message);
      notify({ type: "error", title: "AI analysis failed", description: message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button disabled={disabled || isLoading} onClick={handleAnalyze} type="button">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Bot className="h-4 w-4" aria-hidden="true" />}
        Analyze my payments
      </Button>
      {isLoading ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
          Analyzing payment links, transaction status, and recent volume...
        </div>
      ) : null}
      {insight ? (
        <StructuredInsight summary={insight} />
      ) : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
