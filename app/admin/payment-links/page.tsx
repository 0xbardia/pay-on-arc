import Link from "next/link";
import { headers } from "next/headers";
import { PaymentLinkStatus } from "@prisma/client";
import { ExternalLink } from "lucide-react";
import { AdminDisablePaymentLinkButton } from "@/components/admin-disable-payment-link-button";
import { CopyLinkButton } from "@/components/copy-link-button";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminPanelPath } from "@/lib/admin";
import { getPaymentUrl, getRequestOrigin, isPaymentLinkExpired } from "@/lib/payment-links";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AdminPaymentLinksPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const filters = ["ALL", "ACTIVE", "PAID", "DISABLED", "EXPIRED"] as const;

export default async function AdminPaymentLinksPage({ searchParams }: AdminPaymentLinksPageProps) {
  const { status = "ALL" } = await searchParams;
  const normalizedStatus = status.toUpperCase();
  const adminPath = getAdminPanelPath();
  const statusFilter =
    normalizedStatus !== "ALL" && normalizedStatus !== "EXPIRED" && normalizedStatus in PaymentLinkStatus
      ? (normalizedStatus as PaymentLinkStatus)
      : undefined;
  const requestOrigin = getRequestOrigin(await headers());
  const links = await prisma.paymentLink.findMany({
    where: { status: statusFilter },
    include: {
      user: {
        include: {
          wallets: {
            orderBy: { lastConnectedAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const filteredLinks =
    normalizedStatus === "EXPIRED"
      ? links.filter(
          (link) =>
            link.status === PaymentLinkStatus.EXPIRED ||
            (link.status === PaymentLinkStatus.ACTIVE && isPaymentLinkExpired(link.expiresAt)),
        )
      : links;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-violet-300">Admin</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Payment Links</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Review and moderate merchant payment requests across Pay On Arc.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter}
            className={`rounded-md border px-3 py-2 text-sm ${
              normalizedStatus === filter
                ? "border-violet-400 bg-violet-500/15 text-white"
                : "border-slate-800 text-slate-400 hover:text-white"
            }`}
            href={filter === "ALL" ? `${adminPath}/payment-links` : `${adminPath}/payment-links?status=${filter}`}
          >
            {filter.toLowerCase()}
          </Link>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Merchant</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium">Public URL</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLinks.map((link) => {
                  const computedStatus =
                    link.status === PaymentLinkStatus.ACTIVE && isPaymentLinkExpired(link.expiresAt)
                      ? PaymentLinkStatus.EXPIRED
                      : link.status;
                  const publicUrl = getPaymentUrl(link.slug, requestOrigin);

                  return (
                    <tr key={link.id} className="border-b border-slate-900 last:border-0">
                      <td className="px-5 py-4 font-medium text-white">{link.title}</td>
                      <td className="px-5 py-4 text-slate-300">
                        {Number(link.amount.toFixed(6)).toFixed(2)} {link.currency}
                      </td>
                      <td className="px-5 py-4 text-slate-300">{computedStatus}</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-400">
                        {link.user.wallets[0]?.address ?? "No wallet"}
                      </td>
                      <td className="px-5 py-4 text-slate-400">{link.createdAt.toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <p className="max-w-xs break-all font-mono text-xs text-slate-300">{publicUrl}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <CopyLinkButton value={publicUrl} />
                          <Link
                            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-700 px-2 text-xs text-slate-200 hover:bg-slate-900"
                            href={publicUrl}
                            target="_blank"
                          >
                            Open
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                          {link.status === PaymentLinkStatus.ACTIVE ? (
                            <AdminDisablePaymentLinkButton paymentLinkId={link.id} />
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredLinks.length === 0 ? <p className="p-6 text-sm text-slate-400">No payment links found.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
