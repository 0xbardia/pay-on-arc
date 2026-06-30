import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-silver">{eyebrow}</p>
        ) : null}
        <h1 className="mt-3 text-3xl font-bold text-starlight">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-silver">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
