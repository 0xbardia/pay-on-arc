import { Card, CardContent } from "@/components/ui/card";
import {
  arcChainId,
  arcExplorerUrl,
  arcRpcUrl,
  arcUsdcAddress,
  enableSimulatedPayments,
} from "@/lib/arc-config";

export const dynamic = "force-dynamic";

const settings = [
  { label: "Arc chain id", value: String(arcChainId) },
  { label: "Arc RPC URL", value: arcRpcUrl },
  { label: "Arc explorer URL", value: arcExplorerUrl },
  { label: "USDC contract address", value: arcUsdcAddress },
  { label: "Simulated payments", value: enableSimulatedPayments ? "enabled" : "disabled" },
  { label: "OpenRouter model", value: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini" },
  { label: "OpenRouter API key", value: process.env.OPENROUTER_API_KEY ? "configured" : "not configured" },
  { label: "AI Copilot", value: process.env.AI_COPILOT_ENABLED === "true" ? "enabled" : "disabled" },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-violet-300">Admin</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Safe platform configuration view. Secrets are never displayed.
        </p>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-900">
            {settings.map((setting) => (
              <div key={setting.label} className="grid gap-2 px-5 py-4 text-sm md:grid-cols-[220px_1fr]">
                <p className="text-slate-500">{setting.label}</p>
                <p className="break-all font-medium text-white">{setting.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
