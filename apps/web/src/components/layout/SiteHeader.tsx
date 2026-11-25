import type { ThemeMode } from "../../types";
import { BrandMark } from "../brand/BrandMark";
import { ThemeSwitch } from "../ui/ThemeSwitch";

interface SiteHeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export function SiteHeader({ theme, onToggleTheme }: SiteHeaderProps) {
  return (
    <header className="border-b border-line/15 bg-bg">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <BrandMark className="h-8 w-8 text-ink" />
          <span className="font-title text-xl font-semibold">
            AI Study Buddy
          </span>
        </div>
        <ThemeSwitch theme={theme} onToggle={onToggleTheme} />
      </div>
    </header>
  );
}
