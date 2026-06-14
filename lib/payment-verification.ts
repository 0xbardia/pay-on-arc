import {
  createPublicClient,
  formatUnits,
  http,
  isAddress,
  isHash,
  parseEventLogs,
  parseUnits,
  type Address,
  type Hex,
} from "viem";
import {
  arcChainId,
  arcRpcUrl,
  arcUsdcDecimals,
  getArcUsdcAddress,
} from "@/lib/arc-config";
import { arcTestnet } from "@/lib/chains/arc";
import { erc20Abi } from "@/lib/erc20";

export type PaymentVerificationReason =
  | "INVALID_TX_HASH"
  | "INVALID_RECIPIENT"
  | "INVALID_TOKEN"
  | "INVALID_PAYER"
  | "INVALID_AMOUNT"
  | "RPC_CHAIN_MISMATCH"
  | "RECEIPT_NOT_FOUND"
  | "TRANSACTION_REVERTED"
  | "TRANSFER_NOT_FOUND"
  | "WRONG_TOKEN"
  | "WRONG_RECIPIENT"
  | "WRONG_PAYER"
  | "INSUFFICIENT_AMOUNT"
  | "MALFORMED_LOGS"
  | "RPC_ERROR";

export type UsdcPaymentVerificationResult = {
  ok: boolean;
  reason?: PaymentVerificationReason;
  message?: string;
  normalizedAmount?: string;
  payer?: string;
  recipient?: string;
  token?: string;
  blockNumber?: string;
};

type VerifyUsdcPaymentTxInput = {
  txHash: string;
  expectedRecipient: string;
  expectedAmount: string;
  expectedToken?: string;
  expectedDecimals?: number;
  expectedPayer?: string | null;
};

type TransferArgs = {
  from?: Address;
  to?: Address;
  value?: bigint;
};

type ParsedTransferLog = {
  address: Address;
  args: TransferArgs;
};

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(arcRpcUrl, { timeout: 10_000 }),
});

const reasonMessages: Record<PaymentVerificationReason, string> = {
  INVALID_TX_HASH: "A valid transaction hash is required.",
  INVALID_RECIPIENT: "Merchant recipient wallet is invalid.",
  INVALID_TOKEN: "USDC contract address is invalid.",
  INVALID_PAYER: "Payer wallet address is invalid.",
  INVALID_AMOUNT: "Payment amount must be greater than zero.",
  RPC_CHAIN_MISMATCH: "Arc RPC is not connected to Arc Testnet.",
  RECEIPT_NOT_FOUND: "Transaction receipt was not found yet. Please retry shortly.",
  TRANSACTION_REVERTED: "Transaction reverted on-chain.",
  TRANSFER_NOT_FOUND: "No USDC Transfer event was found in this transaction.",
  WRONG_TOKEN: "Transaction did not transfer the Arc Testnet USDC token.",
  WRONG_RECIPIENT: "USDC was not transferred to the merchant wallet.",
  WRONG_PAYER: "USDC transfer sender does not match the connected payer wallet.",
  INSUFFICIENT_AMOUNT: "USDC transfer amount is lower than the payment link amount.",
  MALFORMED_LOGS: "Transaction logs could not be decoded safely.",
  RPC_ERROR: "Arc RPC could not verify this transaction. Please retry shortly.",
};

function fail(reason: PaymentVerificationReason): UsdcPaymentVerificationResult {
  return {
    ok: false,
    reason,
    message: reasonMessages[reason],
  };
}

export function getPaymentVerificationMessage(reason: PaymentVerificationReason) {
  return reasonMessages[reason];
}

export function isTransientPaymentVerificationReason(reason?: PaymentVerificationReason) {
  return reason === "RECEIPT_NOT_FOUND" || reason === "RPC_ERROR";
}

function isReceiptNotFound(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("not found") || message.includes("could not find");
}

export async function verifyUsdcPaymentTx({
  txHash,
  expectedRecipient,
  expectedAmount,
  expectedToken = getArcUsdcAddress(),
  expectedDecimals = arcUsdcDecimals,
  expectedPayer,
}: VerifyUsdcPaymentTxInput): Promise<UsdcPaymentVerificationResult> {
  if (!isHash(txHash)) {
    return fail("INVALID_TX_HASH");
  }

  if (!isAddress(expectedRecipient)) {
    return fail("INVALID_RECIPIENT");
  }

  if (!isAddress(expectedToken)) {
    return fail("INVALID_TOKEN");
  }

  if (expectedPayer && !isAddress(expectedPayer)) {
    return fail("INVALID_PAYER");
  }

  let expectedAmountBaseUnits: bigint;

  try {
    expectedAmountBaseUnits = parseUnits(expectedAmount, expectedDecimals);
  } catch {
    return fail("INVALID_AMOUNT");
  }

  if (expectedAmountBaseUnits <= BigInt(0)) {
    return fail("INVALID_AMOUNT");
  }

  try {
    const chainId = await publicClient.getChainId();

    if (chainId !== arcChainId) {
      return fail("RPC_CHAIN_MISMATCH");
    }

    const receipt = await publicClient
      .getTransactionReceipt({ hash: txHash as Hex })
      .catch((error: unknown) => {
        if (isReceiptNotFound(error)) {
          return null;
        }

        throw error;
      });

    if (!receipt) {
      return fail("RECEIPT_NOT_FOUND");
    }

    if (receipt.status !== "success") {
      return fail("TRANSACTION_REVERTED");
    }

    let transferLogs: ParsedTransferLog[];

    try {
      transferLogs = parseEventLogs({
        abi: erc20Abi,
        eventName: "Transfer",
        logs: receipt.logs,
        strict: false,
      }) as ParsedTransferLog[];
    } catch {
      return fail("MALFORMED_LOGS");
    }

    const tokenAddress = expectedToken.toLowerCase();
    const recipientAddress = expectedRecipient.toLowerCase();
    const payerAddress = expectedPayer?.toLowerCase();

    if (transferLogs.length === 0) {
      return fail("TRANSFER_NOT_FOUND");
    }

    const tokenTransfers = transferLogs.filter((log) => log.address.toLowerCase() === tokenAddress);

    if (tokenTransfers.length === 0) {
      return fail("WRONG_TOKEN");
    }

    const recipientTransfers = tokenTransfers.filter((log) => {
      return log.args.to?.toLowerCase() === recipientAddress;
    });

    if (recipientTransfers.length === 0) {
      return fail("WRONG_RECIPIENT");
    }

    const payerRecipientTransfers = payerAddress
      ? recipientTransfers.filter((log) => {
          return log.args.from?.toLowerCase() === payerAddress;
        })
      : recipientTransfers;

    if (payerRecipientTransfers.length === 0) {
      return fail("WRONG_PAYER");
    }

    const verifiedTransfer = payerRecipientTransfers.find((log) => {
      return typeof log.args.value === "bigint" && log.args.value >= expectedAmountBaseUnits;
    });

    if (!verifiedTransfer) {
      return fail("INSUFFICIENT_AMOUNT");
    }

    return {
      ok: true,
      normalizedAmount: formatUnits(verifiedTransfer.args.value ?? BigInt(0), expectedDecimals),
      payer: verifiedTransfer.args.from?.toLowerCase(),
      recipient: verifiedTransfer.args.to?.toLowerCase(),
      token: verifiedTransfer.address.toLowerCase(),
      blockNumber: receipt.blockNumber.toString(),
    };
  } catch {
    return fail("RPC_ERROR");
  }
}
