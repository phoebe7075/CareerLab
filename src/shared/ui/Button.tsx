import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../lib/cn";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "softDanger";
type ButtonSize = "sm" | "md";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100",
  ghost: "bg-transparent text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
  softDanger:
    "border border-rose-300 bg-rose-100 text-rose-800 hover:bg-rose-200 hover:text-rose-900"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-8 px-3 text-sm",
  md: "min-h-10 px-4 text-sm"
};

export function Button({
  className,
  size = "md",
  type = "button",
  variant = "secondary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      type={type}
      {...props}
    />
  );
}
