import type { Variants } from "framer-motion";

export type Direction = 1 | -1;

/** Cards slide out the way they came and in from the other side. */
export const slideVariants = (shift: number): Variants => ({
  enter: (direction: Direction) => ({ opacity: 0, x: direction * shift }),
  center: { opacity: 1, x: 0 },
  exit: (direction: Direction) => ({ opacity: 0, x: direction * -shift }),
});
