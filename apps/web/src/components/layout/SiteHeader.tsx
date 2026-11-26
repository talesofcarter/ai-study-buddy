import { Link } from "react-router-dom";
import type { ThemeMode } from "../../types";
import { BrandMark } from "../brand/BrandMark";
import { ThemeSwitch } from "../ui/ThemeSwitch";
import { SiteMenu } from "./SiteMenu";

interface SiteHeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  showMenu: boolean;
}

export function SiteHeader({
  theme,
  onToggleTheme,
  showMenu,
}: SiteHeaderProps) {
  return (
    <header className="relative z-30">
      <div className="border-b border-line/15 bg-bg">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 rounded-ctl">
            <BrandMark className="h-8 w-8 text-ink" />
            <span className="font-title text-xl font-semibold">
              AI Study Buddy
            </span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeSwitch theme={theme} onToggle={onToggleTheme} />
            {showMenu ? <SiteMenu /> : null}
          </div>
        </div>
      </div>
    </header>
  );
}
