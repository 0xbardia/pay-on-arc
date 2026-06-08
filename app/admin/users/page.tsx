import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AdminUsersPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

function formatDate(date: Date | null) {
  return date ? date.toLocaleString() : "Never";
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();
  const users = await prisma.user.findMany({
    where: query
      ? {
          wallets: {
            some: {
              address: { contains: query, mode: "insensitive" },
            },
          },
        }
      : undefined,
    include: {
      wallets: {
        orderBy: { lastConnectedAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          paymentLinks: true,
          transactions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-violet-300">Admin</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Users</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Review wallet-backed users and their payment activity.
        </p>
      </div>
      <form className="max-w-xl">
        <input
          className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-violet-400"
          defaultValue={q}
          name="q"
          placeholder="Search wallet address"
        />
      </form>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">User ID</th>
                  <th className="px-5 py-3 font-medium">Wallet</th>
                  <th className="px-5 py-3 font-medium">Last login</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium">Links</th>
                  <th className="px-5 py-3 font-medium">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-900 last:border-0">
                    <td className="px-5 py-4 font-mono text-xs text-slate-300">{user.id}</td>
                    <td className="px-5 py-4 font-mono text-xs text-white">
                      {user.wallets[0]?.address ?? "No wallet"}
                    </td>
                    <td className="px-5 py-4 text-slate-400">{formatDate(user.lastLoginAt)}</td>
                    <td className="px-5 py-4 text-slate-400">{user.createdAt.toLocaleString()}</td>
                    <td className="px-5 py-4 text-slate-300">{user._count.paymentLinks}</td>
                    <td className="px-5 py-4 text-slate-300">{user._count.transactions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 ? <p className="p-6 text-sm text-slate-400">No users found.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
