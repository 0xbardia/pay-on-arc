"use client";

import Link from "next/link";
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

  return (
    <>
      <div className="sticky top-0 z-40 border-b border-border bg-[#0B0F19]/95 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <SidebarLogo logoUrl={logoUrl} title={title} />
            <div>
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </Link>
          <button
            aria-label="Open navigation menu"
            className="rounded-lg border border-border bg-white/[0.03] p-2 text-slate-200"
            onClick={() => setIsOpen(true)}
            type="button"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden">
          <aside className="h-full w-80 max-w-[86vw] border-r border-border bg-[#0B0F19] p-4 shadow-premium">
            <div className="mb-6 flex items-center justify-between">
              <p className="font-semibold text-white">{title}</p>
              <button
                aria-label="Close navigation menu"
                className="rounded-lg border border-border bg-white/[0.03] p-2 text-slate-200"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <nav className="grid gap-1">
              {items.map((item) => (
                <SidebarLink key={item.href} item={item} onClick={() => setIsOpen(false)} />
              ))}
            </nav>
          </aside>
        </div>
      ) : null}

      <aside className="hidden border-b border-border bg-[#0B0F19]/90 px-4 py-4 backdrop-blur-xl md:fixed md:inset-y-0 md:left-0 md:block md:w-64 md:border-b-0 md:border-r md:px-5">
        <Link href="/" className="mb-5 flex items-center gap-3">
          <SidebarLogo logoUrl={logoUrl} title={title} />
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </Link>
        <nav className="grid gap-1">
          {items.map((item) => (
            <SidebarLink key={item.href} item={item} />
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
        className="h-9 w-9 rounded-xl border border-white/10 bg-cover bg-center bg-white/[0.04] shadow-glow"
        role="img"
        style={{ backgroundImage: `url("${logoUrl}")` }}
      />
    );
  }

  return (
    <BrandLogo alt="Pay On Arc logo" size="sm" />
  );
}

function SidebarLink({ item, onClick }: { item: SidebarItem; onClick?: () => void }) {
  const Icon = sidebarIcons[item.icon];

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-300 transition-colors hover:text-white",
        "hover:bg-white/[0.06]",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {item.label}
    </Link>
  );
}
