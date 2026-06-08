import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  alt?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizes = {
  sm: "h-9 w-9",
  md: "h-10 w-10",
  lg: "h-11 w-11",
  xl: "h-14 w-14",
};

export function BrandLogo({ alt = "Pay On Arc logo", className, size = "md" }: BrandLogoProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] shadow-glow",
        sizes[size],
        className,
      )}
    >
      <Image alt={alt} className="h-full w-full object-contain" height={56} src="/brand/pay-on-arc-logo.png" width={56} />
    </span>
  );
}
