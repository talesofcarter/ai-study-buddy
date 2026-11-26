import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";
import { NAV_ITEMS } from "../../data/navigation";
import { cn } from "../../lib/cn";

/** Three bars that fold into a cross. */
function MenuIcon({ open }: { open: boolean }) {
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 520, damping: 34 };
  const bar = "absolute left-0 h-0.5 w-5 rounded-full bg-ink";

  return (
    <span aria-hidden="true" className="relative block h-3.5 w-5">
      <motion.span
        className={cn(bar, "top-0")}
        animate={open ? { y: 6, rotate: 45 } : { y: 0, rotate: 0 }}
        transition={transition}
      />
      <motion.span
        className={cn(bar, "top-1.5")}
        animate={open ? { opacity: 0, scaleX: 0.4 } : { opacity: 1, scaleX: 1 }}
        transition={transition}
      />
      <motion.span
        className={cn(bar, "top-3")}
        animate={open ? { y: -6, rotate: -45 } : { y: 0, rotate: 0 }}
        transition={transition}
      />
    </span>
  );
}

export function SiteMenu() {
  const { pathname } = useLocation();
  // Remember where the menu was opened: navigating elsewhere closes it.
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const reduceMotion = useReducedMotion();

  const close = useCallback(() => setOpenPath(null), []);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      close();
      buttonRef.current?.focus();
    };
    const handleFocusIn = (event: FocusEvent): void => {
      const root = rootRef.current;
      if (
        root &&
        event.target instanceof Node &&
        !root.contains(event.target)
      ) {
        close();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpenPath(open ? null : pathname)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-ctl border border-line/40 bg-surface transition-colors hover:bg-sunken"
      >
        <MenuIcon open={open} />
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              key="scrim"
              aria-hidden="true"
              onClick={close}
              className="fixed inset-0 -z-10 bg-ink/25"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            />
            <motion.nav
              key="panel"
              id={panelId}
              aria-label="Primary"
              style={{ transformOrigin: "top right" }}
              className="absolute right-0 top-full z-10 mt-2 w-[min(21rem,calc(100vw-2rem))] rounded-card border border-line/25 bg-surface p-2 shadow-card"
              initial={{
                opacity: 0,
                y: reduceMotion ? 0 : -8,
                scale: reduceMotion ? 1 : 0.97,
              }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <ul className="flex flex-col gap-1">
                {NAV_ITEMS.map((item, position) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === "/"}
                      onClick={close}
                      className={({ isActive }) =>
                        cn(
                          "flex min-h-14 items-start gap-4 rounded-ctl px-3 py-3 transition-colors",
                          isActive ? "bg-sunken" : "hover:bg-sunken/70",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            aria-hidden="true"
                            className="pt-0.5 font-card text-sm font-semibold tabular-nums text-muted"
                          >
                            {String(position + 1).padStart(2, "0")}
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "font-bold",
                                  isActive && "highlight",
                                )}
                              >
                                {item.label}
                              </span>
                              {item.status === "soon" ? (
                                <span className="rounded-full border border-line/30 px-2 text-xs text-muted">
                                  Soon
                                </span>
                              ) : null}
                            </span>
                            <span className="text-sm text-muted">
                              {item.description}
                            </span>
                          </span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </motion.nav>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
