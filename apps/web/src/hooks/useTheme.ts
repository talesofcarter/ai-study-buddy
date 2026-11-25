import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { THEME_SCHEMA } from "../lib/schemas";
import type { ThemeMode } from "../types";
import { useStoredState } from "./useStoredState";

const ANIMATION_WINDOW_MS = 400;

export function useTheme(): { theme: ThemeMode; toggleTheme: () => void } {
  const [theme, setTheme] = useStoredState(THEME_SCHEMA);
  const timer = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      document.documentElement.removeAttribute("data-theme-animating");
    },
    [],
  );

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme-animating", "");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(
      () => root.removeAttribute("data-theme-animating"),
      ANIMATION_WINDOW_MS,
    );
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, [setTheme]);

  return { theme, toggleTheme };
}
