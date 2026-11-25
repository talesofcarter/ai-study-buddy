import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../../lib/cn";
import type { ThemeMode } from "../../types";

interface ThemeSwitchProps {
  theme: ThemeMode;
  onToggle: () => void;
}

/** A switch whose knob is a tiny index card. Left = light, right = dark. */
export function ThemeSwitch({ theme, onToggle }: ThemeSwitchProps) {
  const isDark = theme === "dark";
  const reduceMotion = useReducedMotion();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Dark mode"
      onClick={onToggle}
      className="inline-flex min-h-11 items-center gap-3 rounded-ctl px-2"
    >
      <span aria-hidden="true" className="hidden text-sm text-muted sm:inline">
        Dark mode
      </span>
      <span
        className={cn(
          "flex h-8 w-14 items-center rounded-ctl border border-line/40 bg-sunken p-[3px]",
          isDark ? "justify-end" : "justify-start",
        )}
      >
        <motion.span
          layout="position"
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 520, damping: 34 }
          }
          className="flex h-6 w-6 flex-col items-center justify-center gap-[5px] rounded-lg border-[1.5px] border-edge bg-accent"
        >
          <span className="block h-px w-3 bg-on-accent/50" />
          <span className="block h-px w-3 bg-on-accent/50" />
        </motion.span>
      </span>
    </button>
  );
}
