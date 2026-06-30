import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AdminAuditLogsPageProps = {
  searchParams: Promise<{
    q?: string;
    action?: string;
    wallet?: string;
    from?: string;
    to?: string;
  }>;
};

function formatMetadata(value: unknown) {
  if (!value) {
    return "{}";
  }

  return JSON.stringify(value);
}

export default async function AdminAuditLogsPage({ searchParams }: AdminAuditLogsPageProps) {
  const { q = "", action = "", wallet = "", from = "", to = "" } = await searchParams;
  const where = {
    ...(q
      ? {
          OR: [
            { action: { contains: q, mode: "insensitive" as const } },
            { entityType: { contains: q, mode: "insensitive" as const } },
            { entityId: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(action ? { action } : {}),
    ...(wallet ? { walletAddress: { contains: wallet.toLowerCase(), mode: "insensitive" as const } } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };
  const [logs, actions] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.auditLog.findMany({
      distinct: ["action"],
      orderBy: { action: "asc" },
      select: { action: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-violet-300">Admin</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Audit Logs</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Review authentication, payment, transaction, AI, and admin events.
        </p>
      </div>
      <form className="grid gap-3 md:grid-cols-5">
        <input className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white" defaultValue={q} name="q" placeholder="Search" />
        <select className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white" defaultValue={action} name="action">
          <option value="">All actions</option>
          {actions.map((item) => (
            <option key={item.action} value={item.action}>
              {item.action}
            </option>
          ))}
        </select>
        <input className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white" defaultValue={wallet} name="wallet" placeholder="Wallet" />
        <input className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white" defaultValue={from} name="from" type="date" />
        <input className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white" defaultValue={to} name="to" type="date" />
        <button className="h-10 rounded-md bg-violet-600 px-4 text-sm font-medium text-white md:col-span-5" type="submit">
          Apply filters
        </button>
      </form>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Timestamp</th>
                  <th className="px-5 py-3 font-medium">Wallet</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                  <th className="px-5 py-3 font-medium">Entity</th>
                  <th className="px-5 py-3 font-medium">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-900 last:border-0">
                    <td className="px-5 py-4 text-slate-400">{log.createdAt.toLocaleString()}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-300">{log.walletAddress ?? "System"}</td>
                    <td className="px-5 py-4 text-slate-200">{log.action}</td>
                    <td className="px-5 py-4 text-slate-400">
                      {log.entityType ?? "Unknown"} {log.entityId ? `/${log.entityId}` : ""}
                    </td>
                    <td className="max-w-xl break-all px-5 py-4 font-mono text-xs text-slate-400">
                      {formatMetadata(log.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 ? <p className="p-6 text-sm text-slate-400">No audit logs found.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
