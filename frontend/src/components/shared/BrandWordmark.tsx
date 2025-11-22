import { cn } from "@/lib/utils";

type BrandWordmarkProps = {
  className?: string;
  accentClassName?: string;
};

export function BrandWordmark({
  className,
  accentClassName,
}: BrandWordmarkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-semibold tracking-tight text-white",
        className,
      )}
    >
      <span>exch</span>
      <span className={cn("text-brand-green", accentClassName)}>ai</span>
      <span>nge</span>
    </span>
  );
}
