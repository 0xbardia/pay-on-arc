"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ExternalLink, Loader2, Wallet } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { formatUnits, isAddress, parseUnits, type Address } from "viem";
import { useAccount, useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  arcChainId,
  arcExplorerUrl,
  arcUsdcDecimals,
  getArcUsdcAddress,
  getExplorerTxUrl,
} from "@/lib/arc-config";
import { arcTestnet } from "@/lib/chains/arc";
import { erc20Abi } from "@/lib/erc20";

type PaymentActionsProps = {
  slug: string;
  amount: string;
  merchantAddress: string | null;
  disabled: boolean;
  enableSimulatedPayments: boolean;
};

type TransactionResponse = {
  error?: string;
  message?: string;
  transaction?: {
    id: string;
    txHash?: string | null;
    status: string;
  };
};

const recordRetryDelayMs = 5_000;
const maxRecordAttempts = 12;
const transientRecordErrors = new Set(["RECEIPT_NOT_FOUND", "RPC_ERROR"]);

function shortHash(hash: string) {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function PaymentActions({
  slug,
  amount,
  merchantAddress,
  disabled,
  enableSimulatedPayments,
}: PaymentActionsProps) {
  const { address, chain, connector, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const submitInFlight = useRef(false);
  const simulateInFlight = useRef(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const usdcAddress = getArcUsdcAddress();
  const payerAddress = address?.toLowerCase();
  const isArc = chain?.id === arcChainId;
  const merchantIsValid = Boolean(merchantAddress && isAddress(merchantAddress));
  const parsedAmount = parseUnits(amount, arcUsdcDecimals);
  const hasSubmittedPayment = Boolean(txHash || transactionId);
  const { data: balance, isLoading: isBalanceLoading } = useReadContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: arcChainId,
    query: {
      enabled: Boolean(address && isArc),
      staleTime: 20_000,
    },
  });
  const hasEnoughBalance = typeof balance === "bigint" ? balance >= parsedAmount : undefined;

  async function switchToArc() {
    if (!connector) {
      setError("Wallet connector is not ready.");
      return;
    }

    setIsSwitching(true);
    setError(null);

    try {
      await switchChainAsync({ chainId: arcChainId });
    } catch {
      const provider = await connector.getProvider().catch(() => null);

      if (!provider || typeof provider !== "object" || !("request" in provider)) {
        setError("This wallet cannot add Arc Testnet automatically.");
        setIsSwitching(false);
        return;
      }

      const request = (provider as { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }).request;
      await request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${arcChainId.toString(16)}`,
            chainName: arcTestnet.name,
            nativeCurrency: arcTestnet.nativeCurrency,
            rpcUrls: [...arcTestnet.rpcUrls.default.http],
            blockExplorerUrls: [arcExplorerUrl],
          },
        ],
      });
      await switchChainAsync({ chainId: arcChainId }).catch(() => undefined);
    } finally {
      setIsSwitching(false);
    }
  }

  async function handlePay() {
    if (submitInFlight.current) {
      return;
    }

    if (hasSubmittedPayment) {
      setError("This payment has already been submitted.");
      return;
    }

    setError(null);
    setMessage(null);

    if (!payerAddress || !address) {
      setError("Connect a payer wallet first.");
      return;
    }

    if (!merchantAddress || !merchantIsValid) {
      setError("Merchant wallet is not configured.");
      return;
    }

    if (!isArc) {
      setError("Switch to Arc Testnet before paying.");
      return;
    }

    if (parsedAmount <= BigInt(0)) {
      setError("Payment amount must be greater than zero.");
      return;
    }

    if (hasEnoughBalance === false) {
      setError("Insufficient USDC balance.");
      return;
    }

    submitInFlight.current = true;
    setIsSubmitting(true);

    try {
      const hash = await writeContractAsync({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: "transfer",
        args: [merchantAddress as Address, parsedAmount],
        chainId: arcChainId,
      });

      setTxHash(hash);
      let payload: TransactionResponse | null = null;

      for (let attempt = 1; attempt <= maxRecordAttempts; attempt += 1) {
        const response = await fetch(`/api/payments/${slug}/record`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payerAddress,
            txHash: hash,
            chainId: arcChainId,
          }),
        });
        payload = (await response.json().catch(() => null)) as TransactionResponse | null;

        if (response.ok) {
          break;
        }

        const canRetry =
          response.status === 503 &&
          payload?.error &&
          transientRecordErrors.has(payload.error) &&
          attempt < maxRecordAttempts;

        if (!canRetry) {
          throw new Error(payload?.message ?? payload?.error ?? "Transaction was submitted, but could not be verified.");
        }

        setMessage("Transaction submitted. Waiting for Arc Testnet confirmation...");
        await wait(recordRetryDelayMs);
      }

      if (!payload?.transaction?.id) {
        throw new Error("Transaction was submitted, but could not be verified.");
      }

      setTransactionId(payload.transaction.id);
      setMessage(
        payload.transaction.status === "CONFIRMED"
          ? "Payment verified and recorded."
          : "Payment submitted. Transaction status is pending.",
      );
    } catch (payError) {
      setError(payError instanceof Error ? payError.message : "Could not submit USDC payment.");
    } finally {
      submitInFlight.current = false;
      setIsSubmitting(false);
    }
  }

  async function handleSimulate() {
    if (simulateInFlight.current) {
      return;
    }

    if (hasSubmittedPayment) {
      setError("This payment has already been submitted.");
      return;
    }

    if (!payerAddress) {
      setError("Connect a payer wallet first.");
      return;
    }

    simulateInFlight.current = true;
    setIsSimulating(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/payments/${slug}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payerAddress }),
      });
      const payload = (await response.json().catch(() => null)) as TransactionResponse | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? payload?.error ?? "Could not create simulated payment.");
      }

      setTransactionId(payload?.transaction?.id ?? null);
      setMessage("Simulated payment recorded.");
    } catch (simulateError) {
      setError(simulateError instanceof Error ? simulateError.message : "Could not create simulated payment.");
    } finally {
      simulateInFlight.current = false;
      setIsSimulating(false);
    }
  }

  if (!isConnected) {
    return (
      <ConnectButton.Custom>
        {({ mounted, openConnectModal }) => (
          <Button disabled={!mounted || disabled} onClick={openConnectModal} type="button">
            <Wallet className="h-4 w-4" aria-hidden="true" />
            Connect wallet
          </Button>
        )}
      </ConnectButton.Custom>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-md border border-slate-800 bg-slate-950/60 p-4 text-sm md:grid-cols-2">
        <div>
          <p className="text-slate-500">Payer wallet</p>
          <p className="break-all font-medium text-white">{payerAddress}</p>
        </div>
        <div>
          <p className="text-slate-500">Network</p>
          <p className={isArc ? "font-medium text-emerald-300" : "font-medium text-amber-300"}>
            {isArc ? "Arc Testnet" : chain?.name ?? "Unknown"}
          </p>
        </div>
        <div>
          <p className="text-slate-500">USDC balance</p>
          <p className="font-medium text-white">
            {isBalanceLoading ? "Loading..." : typeof balance === "bigint" ? `${formatUnits(balance, arcUsdcDecimals)} USDC` : "Unavailable"}
          </p>
        </div>
      </div>

      {!isArc ? (
        <Button disabled={isSwitching} onClick={switchToArc} type="button" variant="outline" className="w-full">
          {isSwitching ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Switch to Arc Testnet
        </Button>
      ) : null}

      <Button disabled={disabled || hasSubmittedPayment || isSubmitting || !isArc || !merchantIsValid} onClick={handlePay} type="button" className="w-full">
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        Pay with USDC
      </Button>

      {enableSimulatedPayments ? (
        <Button disabled={disabled || hasSubmittedPayment || isSimulating} onClick={handleSimulate} type="button" variant="outline" className="w-full">
          {isSimulating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Simulate payment
        </Button>
      ) : null}

      {message ? (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          <p>{message}</p>
          {txHash ? (
            <Link className="mt-2 inline-flex items-center gap-2 text-emerald-100 underline" href={getExplorerTxUrl(txHash)} target="_blank">
              {shortHash(txHash)}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          ) : null}
          {transactionId ? <p className="mt-1 text-xs text-emerald-300">Transaction ID: {transactionId}</p> : null}
        </div>
      ) : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
