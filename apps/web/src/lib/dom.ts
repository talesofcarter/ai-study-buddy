const INTERACTIVE_SELECTOR =
  "input, textarea, select, button, a[href], [contenteditable='true'], [role='switch']";

/** True when a key event came from something that should keep its own keys. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null
  );
}
