import { headers } from "next/headers";
import { PaymentLinksManager } from "@/components/payment-links-manager";
import { getAuthenticatedUser } from "@/lib/auth";
import { logDevRequest } from "@/lib/dev-log";
import { getPaymentUrl, getRequestOrigin, isPaymentLinkExpired } from "@/lib/payment-links";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  logDevRequest("GET /app/payments");
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return null;
  }

  const requestHeaders = await headers();
  const requestOrigin = getRequestOrigin(requestHeaders);
  const paymentLinks = await prisma.paymentLink.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-silver">Merchant</p>
        <h1 className="mt-3 text-3xl font-bold text-starlight">Payments</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-silver">
          Create branded USDC payment links, share QR codes, and manage link status.
        </p>
      </div>
      <PaymentLinksManager
        paymentLinks={paymentLinks.map((link) => ({
          id: link.id,
          title: link.title,
          description: link.description,
          amount: link.amount.toFixed(6),
          currency: link.currency,
          status: link.status === "ACTIVE" && isPaymentLinkExpired(link.expiresAt) ? "EXPIRED" : link.status,
          createdAt: link.createdAt.toISOString(),
          expiresAt: link.expiresAt?.toISOString() ?? null,
          publicUrl: getPaymentUrl(link.slug, requestOrigin),
        }))}
      />
    </div>
  );
}
