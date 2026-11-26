import { RATINGS } from "../../data/difficulty";
import { cn } from "../../lib/cn";
import type { Difficulty } from "../../types";

interface RatingControlProps {
  value: Difficulty;
  onChange: (next: Difficulty) => void;
}

/** Easy / Medium / Hard. Pressing the active rating clears it back to unrated. */
export function RatingControl({ value, onChange }: RatingControlProps) {
  return (
    <div
      role="group"
      aria-label="Difficulty"
      className="flex flex-wrap gap-1.5"
    >
      {RATINGS.map((rating) => {
        const pressed = value === rating.id;
        return (
          <button
            key={rating.id}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(pressed ? "unrated" : rating.id)}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-bold transition-colors",
              pressed
                ? "border-[1.5px] border-edge bg-sunken"
                : "border-line/40 bg-surface hover:bg-sunken",
              rating.text,
            )}
          >
            <span
              aria-hidden="true"
              className={cn("h-2.5 w-2.5 rounded-full", rating.dot)}
            />
            {rating.label}
          </button>
        );
      })}
    </div>
  );
}
