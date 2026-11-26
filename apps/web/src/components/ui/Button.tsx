import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-ctl px-5 text-base font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40";

const VARIANTS: Record<Variant, string> = {
  primary:
    "border-[1.5px] border-edge bg-accent text-on-accent hover:brightness-95 active:brightness-90",
  secondary: "border border-line/40 bg-surface text-ink hover:bg-sunken",
  ghost: "text-ink hover:bg-sunken",
  danger: "border border-hard/70 bg-surface text-hard hover:bg-sunken",
};

export function buttonStyles(
  variant: Variant = "primary",
  className?: string,
): string {
  return cn(BASE, VARIANTS[variant], className);
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", type = "button", className, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonStyles(variant, className)}
        {...props}
      />
    );
  },
);
