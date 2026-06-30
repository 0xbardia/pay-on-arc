import { redirect } from "next/navigation";
import { Sidebar, type SidebarIconName } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminPanelPath, getAdminUser } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { auth, isAdmin } = await getAdminUser();
  const adminPath = getAdminPanelPath();
  const items: Array<{ href: string; label: string; icon: SidebarIconName }> = [
    { href: adminPath, label: "Admin Dashboard", icon: "gauge" },
    { href: `${adminPath}/users`, label: "Users", icon: "users" },
    { href: `${adminPath}/payment-links`, label: "Payment Links", icon: "creditCard" },
    { href: `${adminPath}/transactions`, label: "Transactions", icon: "walletCards" },
    { href: `${adminPath}/ai-usage`, label: "AI Usage", icon: "bot" },
    { href: `${adminPath}/audit-logs`, label: "Audit Logs", icon: "clipboardList" },
    { href: `${adminPath}/settings`, label: "Settings", icon: "settings" },
  ];

  if (!auth) {
    redirect("/");
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background px-5 py-10">
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <CardTitle>403: Admin access denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-slate-400">
              Your authenticated wallet is not included in the Pay On Arc admin allowlist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar title="Pay On Arc Admin" subtitle="Platform console" items={items} />
      <main className="px-5 py-6 md:ml-64 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
