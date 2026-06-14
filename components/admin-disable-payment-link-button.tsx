"use client";

import { useState } from "react";
import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type AdminDisablePaymentLinkButtonProps = {
  paymentLinkId: string;
};

export function AdminDisablePaymentLinkButton({ paymentLinkId }: AdminDisablePaymentLinkButtonProps) {
  const [isDisabling, setIsDisabling] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDisable() {
    if (isDisabling || isDisabled) {
      return;
    }

    setIsDisabling(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/payment-links/${paymentLinkId}/disable`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? payload?.error ?? "Could not disable payment link.");
      }

      setIsDisabled(true);
    } catch (disableError) {
      setError(disableError instanceof Error ? disableError.message : "Could not disable payment link.");
    } finally {
      setIsDisabling(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        className="h-8 px-2 text-xs"
        disabled={isDisabling || isDisabled}
        onClick={handleDisable}
        type="button"
        variant="outline"
      >
        {isDisabling ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {isDisabled ? "Disabled" : "Disable"}
      </Button>
      {error ? <p className="max-w-44 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
