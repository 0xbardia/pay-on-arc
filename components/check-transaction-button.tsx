"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type CheckTransactionButtonProps = {
  transactionId: string;
  initialStatus: string;
};

type CheckResponse = {
  error?: string;
  transaction?: {
    status: string;
  };
};

export function CheckTransactionButton({
  transactionId,
  initialStatus,
}: CheckTransactionButtonProps) {
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  async function handleCheck() {
    if (isChecking) {
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const response = await fetch(`/api/transactions/${transactionId}/check`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as CheckResponse | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not check transaction status.");
      }

      if (payload?.transaction?.status) {
        setStatus(payload.transaction.status);
      }
    } catch (checkError) {
      setError(checkError instanceof Error ? checkError.message : "Could not check transaction status.");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="font-medium text-slate-200">{status}</p>
      <Button
        className="h-8 px-2 text-xs"
        disabled={isChecking}
        onClick={handleCheck}
        type="button"
        variant="outline"
      >
        {isChecking ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        Check status
      </Button>
      {error ? <p className="max-w-40 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
