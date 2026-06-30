import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export function ActionCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-border bg-elevated/60 p-5 transition hover:-translate-y-1 hover:border-primary/30"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-starlight">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-silver">{description}</p>
      <p className="mt-4 text-sm text-primary">Open →</p>
    </Link>
  );
}
