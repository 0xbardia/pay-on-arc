"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, ClipboardList, CreditCard, Gauge, Menu, Settings, Users, WalletCards, Webhook, X } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

const sidebarIcons = {
  bot: Bot,
  clipboardList: ClipboardList,
  creditCard: CreditCard,
  gauge: Gauge,
  settings: Settings,
  users: Users,
  walletCards: WalletCards,
  webhook: Webhook,
} as const;

export type SidebarIconName = keyof typeof sidebarIcons;

type SidebarItem = {
  href: string;
  label: string;
  icon: SidebarIconName;
};

type SidebarProps = {
  title: string;
  subtitle: string;
  items: SidebarItem[];
  logoUrl?: string | null;
};

export function Sidebar({ title, subtitle, items, logoUrl }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile header */}
      <div className="sticky top-0 z-40 border-b border-border bg-[#0B0F19] px-4 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <SidebarLogo logoUrl={logoUrl} title={title} />
            <div>
              <p className="text-sm font-semibold text-starlight">{title}</p>
              <p className="text-xs text-silver">{subtitle}</p>
            </div>
          </Link>
          <button
            aria-label="Open navigation menu"
            className="rounded-lg border border-border bg-surface p-2 text-slate-200"
            onClick={() => setIsOpen(true)}
            type="button"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {isOpen ? (
        <div className="fixed inset-0 z-50 bg-black/60 md:hidden">
          <aside className="h-full w-80 max-w-[86vw] border-r border-border bg-[#0B0F19] p-4">
            <div className="mb-6 flex items-center justify-between">
              <p className="font-semibold text-starlight">{title}</p>
              <button
                aria-label="Close navigation menu"
                className="rounded-lg border border-border bg-surface p-2 text-slate-200"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <nav className="grid gap-1" role="navigation" aria-label="Main navigation">
              {items.map((item) => (
                <SidebarLink key={item.href} item={item} current={isActive(item.href)} onClick={() => setIsOpen(false)} />
              ))}
            </nav>
          </aside>
        </div>
      ) : null}

      {/* Desktop sidebar */}
      <aside className="hidden border-r border-border bg-[#0B0F19] md:fixed md:inset-y-0 md:left-0 md:block md:w-64">
        <Link href="/" className="mb-6 flex items-center gap-3 px-5 pt-5">
          <SidebarLogo logoUrl={logoUrl} title={title} />
          <div>
            <p className="text-sm font-semibold text-starlight">{title}</p>
            <p className="text-xs text-silver">{subtitle}</p>
          </div>
        </Link>
        <nav className="grid gap-1 px-3" role="navigation" aria-label="Main navigation">
          {items.map((item) => (
            <SidebarLink key={item.href} item={item} current={isActive(item.href)} />
          ))}
        </nav>
      </aside>
    </>
  );
}

function SidebarLogo({ logoUrl, title }: { logoUrl?: string | null; title: string }) {
  if (logoUrl) {
    return (
      <div
        aria-label={`${title} logo`}
        className="h-9 w-9 rounded-xl border border-border bg-cover bg-center bg-surface"
        role="img"
        style={{ backgroundImage: `url("${logoUrl}")` }}
      />
    );
  }
  return <BrandLogo alt="Pay On Arc logo" size="sm" />;
}

function SidebarLink({ item, onClick, current }: { item: SidebarItem; onClick?: () => void; current?: boolean }) {
  const Icon = sidebarIcons[item.icon];

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        current
          ? "bg-primary/10 text-primary font-medium"
          : "text-silver hover:bg-white/[0.06] hover:text-starlight",
      )}
      aria-current={current ? "page" : undefined}
    >
      <Icon className={cn("h-4 w-4 shrink-0", current ? "text-primary" : "text-silver")} aria-hidden="true" />
      {item.label}
    </Link>
  );
}