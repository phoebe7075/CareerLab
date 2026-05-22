import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../lib/cn";

type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-zinc-300 bg-zinc-100 text-zinc-800",
  accent: "border-blue-200 bg-blue-50 text-blue-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-rose-200 bg-rose-50 text-rose-700"
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-md border px-2 text-xs font-medium leading-none",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
