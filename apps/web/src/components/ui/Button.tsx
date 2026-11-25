import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-ctl px-5 text-base font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40";

const VARIANTS: Record<Variant, string> = {
  // Spearmint is always a fill with navy content and an ink edge (see brief).
  primary:
    "border-[1.5px] border-edge bg-accent text-on-accent hover:brightness-95 active:brightness-90",
  secondary: "border border-line/40 bg-surface text-ink hover:bg-sunken",
  ghost: "text-ink hover:bg-sunken",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", type = "button", className, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(BASE, VARIANTS[variant], className)}
        {...props}
      />
    );
  },
);
