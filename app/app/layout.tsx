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
  let session;

  try {
    session = await getCurrentWalletSession();
  } catch {
    redirect("/");
  }

  if (!session) {
    redirect("/");
  }

  let user;
  let merchantDisplayName = "Pay On Arc";
  let merchantSubtitle = "Merchant console";
  let logoUrl: string | null = null;

  try {
    user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { merchantName: true, logoUrl: true },
    });
    if (user) {
      merchantDisplayName = getMerchantDisplayName(user);
      merchantSubtitle = user.merchantName ? "Merchant workspace" : "Merchant console";
      logoUrl = user.logoUrl;
    }
  } catch {
    // Silent failure — use defaults
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        title={merchantDisplayName}
        subtitle={merchantSubtitle}
        items={items}
        logoUrl={logoUrl}
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
