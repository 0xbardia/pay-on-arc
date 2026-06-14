import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminAiUsagePage() {
  const [totalRequests, latestLogs] = await Promise.all([
    prisma.aiRequestLog.count(),
    prisma.aiRequestLog.findMany({
      include: { user: { include: { wallets: { take: 1, orderBy: { lastConnectedAt: "desc" } } } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-violet-300">Admin</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">AI Usage</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Monitor OpenRouter request logs and Copilot usage.
        </p>
      </div>
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-slate-500">Total AI requests</p>
          <p className="mt-1 text-3xl font-semibold text-white">{totalRequests}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">User wallet</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Model</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Summary</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {latestLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-900 last:border-0">
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">
                      {log.user?.wallets[0]?.address ?? "No wallet"}
                    </td>
                    <td className="px-5 py-4 text-slate-300">{log.type}</td>
                    <td className="px-5 py-4 text-slate-300">{log.model ?? "Unknown"}</td>
                    <td className="px-5 py-4 text-slate-300">{log.status}</td>
                    <td className="max-w-xl px-5 py-4 text-slate-400">{log.responseSummary ?? "No summary"}</td>
                    <td className="px-5 py-4 text-slate-400">{log.createdAt.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {latestLogs.length === 0 ? <p className="p-6 text-sm text-slate-400">No AI usage yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
