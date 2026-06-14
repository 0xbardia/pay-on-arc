import { appVersion } from "@/lib/env";

export function AppVersionFooter() {
  return (
    <footer className="border-t border-white/5 bg-[#0B0F19] px-5 py-4 text-center text-xs text-slate-600">
      Pay On Arc v{appVersion}
    </footer>
  );
}
