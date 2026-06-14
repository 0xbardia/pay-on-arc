import { redirect } from "next/navigation";
import { AppWalletGuard } from "@/components/app-wallet-guard";
import { MerchantTopbar } from "@/components/merchant-topbar";
import { Sidebar, type SidebarIconName } from "@/components/sidebar";
import { getMerchantDisplayName } from "@/lib/merchant-profile";
import { prisma } from "@/lib/prisma";
import { getCurrentWalletSession } from "@/lib/session";

const items: Array<{ href: string; label: string; icon: SidebarIconName }> = [
  { href: "/app/dashboard", label: "Dashboard", icon: "gauge" },
  { href: "/app/payments", label: "Payments", icon: "creditCard" },
  { href: "/app/transactions", label: "Transactions", icon: "walletCards" },
  { href: "/app/ai", label: "AI Copilot", icon: "bot" },
  { href: "/app/webhooks", label: "Webhooks", icon: "webhook" },
  { href: "/app/settings", label: "Settings", icon: "settings" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentWalletSession();

  if (!session) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { merchantName: true, logoUrl: true },
  });

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        title={user?.merchantName ? getMerchantDisplayName(user) : "Pay On Arc"}
        subtitle={user?.merchantName ? "Merchant workspace" : "Merchant console"}
        items={items}
        logoUrl={user?.logoUrl}
      />
      <main className="px-5 py-6 md:ml-64 md:px-8 md:py-8">
        <AppWalletGuard>
          <MerchantTopbar />
          {children}
        </AppWalletGuard>
      </main>
    </div>
  );
}
