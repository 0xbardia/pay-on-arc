"use client";

import { Copy } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/premium/toast";
import { Button } from "@/components/ui/button";

export function CopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const { notify } = useToast();

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    notify({ type: "info", title: "Copied to clipboard" });
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button onClick={handleCopy} type="button" variant="outline">
      <Copy className="h-4 w-4" aria-hidden="true" />
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}
