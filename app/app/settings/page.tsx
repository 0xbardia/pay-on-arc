import Link from "next/link";
import { BadgeCheck, Bell, Globe, Key, Lock, ShieldCheck, Wallet, Webhook } from "lucide-react";
import { ApiKeysManager, type ApiKeyListItem } from "@/components/api-keys-manager";
import { CopyLinkButton } from "@/components/copy-link-button";
import { MerchantProfileForm } from "@/components/merchant-profile-form";
import { PageHeader } from "@/components/premium/page-header";
import { StatusBadge } from "@/components/premium/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { arcChainId } from "@/lib/arc-config";
import { getAuthenticatedUser } from "@/lib/auth";
import { serializeMerchantProfile } from "@/lib/merchant-profile";
import { getAppUrl } from "@/lib/payment-links";
import { maskApiKey } from "@/lib/api-keys";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function SettingRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/5 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-slate-400">{label}</dt>
      <dd className="break-all text-sm font-medium text-white">{value}</dd>
    </div>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Wallet;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-elevated/60">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15 text-violet-200">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <dl>{children}</dl>
      </CardContent>
    </Card>
  );
}

function serializeApiKey(key: {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
}): ApiKeyListItem {
  return {
    id: key.id,
    name: key.name,
    prefix: maskApiKey(key.keyPrefix),
    keyPrefix: key.keyPrefix,
    lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
    createdAt: key.createdAt.toISOString(),
    revokedAt: key.revokedAt?.toISOString() ?? null,
    status: key.revokedAt ? "revoked" : "active",
  };
}

export default async function SettingsPage() {
  const auth = await getAuthenticatedUser();
  const wallet = auth?.wallet ?? null;
  const session = auth?.session ?? null;
  const appUrl = getAppUrl();
  const profile = auth ? serializeMerchantProfile(auth.user) : serializeMerchantProfile({
    merchantName: null,
    merchantSlug: null,
    merchantEmail: null,
    supportEmail: null,
    websiteUrl: null,
    logoUrl: null,
  });
  const apiKeys = auth
    ? await prisma.apiKey.findMany({
        where: { userId: auth.user.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Merchant"
        title="Settings"
        description="Operational configuration for your Pay On Arc merchant workspace. Current V1 settings are read-only unless wired to a live control."
      />

      <Card className="bg-elevated/60">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15 text-violet-200">
              <Wallet className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Merchant Profile</CardTitle>
              <CardDescription>Brand checkout pages and your public merchant profile.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <MerchantProfileForm initialProfile={profile} />
        </CardContent>
      </Card>

      <Card className="bg-elevated/60">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15 text-violet-200">
              <Webhook className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>Send signed payment and platform events to your backend.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-slate-400">
            Manage endpoints, regenerate signing secrets, send test events, and inspect delivery history.
          </p>
          <Button asChild>
            <Link href="/app/webhooks">Manage Webhooks</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-elevated/60">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15 text-violet-200">
              <Key className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Production credentials for server-side merchant API access.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ApiKeysManager initialApiKeys={apiKeys.map(serializeApiKey)} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <SettingsCard icon={Wallet} title="Wallet Identity" description="Wallet-backed merchant session.">
          <SettingRow label="Connected wallet" value={wallet?.address ?? session?.address ?? "No active session"} />
          <SettingRow label="Chain" value={wallet?.chainId ?? arcChainId} />
          <SettingRow label="Connector" value={wallet?.connectorName ?? "Unknown"} />
        </SettingsCard>

        <SettingsCard icon={BadgeCheck} title="Payment Defaults" description="Default checkout behavior for payment links.">
          <SettingRow label="Default currency" value="USDC" />
          <SettingRow label="Default network" value="Arc Testnet" />
          <SettingRow label="One-time links" value={<StatusBadge status="ACTIVE" className="text-xs" />} />
          <SettingRow label="Auto-confirmation" value="Enabled" />
        </SettingsCard>

        <SettingsCard icon={Globe} title="Checkout Preferences" description="Public payment page presentation and sharing.">
          <SettingRow
            label="Public Checkout URL"
            value={
              <span className="flex flex-wrap items-center gap-2">
                <span>{appUrl ? "Configured Domain" : "Derived from request headers"}</span>
                {appUrl ? <CopyLinkButton value={appUrl} /> : null}
              </span>
            }
          />
          <SettingRow label="QR payments" value="Enabled" />
          <SettingRow label="Expiry behavior" value="Expired links stop accepting payment" />
        </SettingsCard>

        <SettingsCard icon={ShieldCheck} title="Security" description="Authentication and audit controls.">
          <SettingRow label="Wallet authentication" value="Enabled" />
          <SettingRow label="Session status" value={session ? "Active" : "No active session"} />
          <SettingRow label="Admin route" value="Hidden by environment path" />
          <SettingRow label="Audit logging" value="Enabled" />
        </SettingsCard>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white">Future integrations</h2>
        <p className="mt-2 text-sm text-slate-400">Planned merchant controls for production payment operations.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          {[
            { icon: Bell, title: "Invoices" },
            { icon: Lock, title: "Customer Management" },
          ].map((item) => (
            <Card key={item.title} className="bg-elevated/40 opacity-80">
              <CardContent className="p-5">
                <item.icon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                <h3 className="mt-4 font-semibold text-white">{item.title}</h3>
                <span className="mt-3 inline-flex rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-400">
                  Coming soon
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
