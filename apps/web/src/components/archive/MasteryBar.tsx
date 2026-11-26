import { cn } from "../../lib/cn";
import type { DifficultyCounts } from "../../types";

const SEGMENTS = [
  { id: "easy", className: "bg-easy" },
  { id: "medium", className: "bg-medium" },
  { id: "hard", className: "bg-hard" },
] as const;

interface MasteryBarProps {
  counts: DifficultyCounts;
  className?: string;
}

export function MasteryBar({ counts, className }: MasteryBarProps) {
  const total = counts.easy + counts.medium + counts.hard + counts.unrated;
  const label =
    total === 0
      ? "No cards"
      : `${counts.easy} easy, ${counts.medium} medium, ${counts.hard} hard, ${counts.unrated} unrated`;

  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "flex h-2 w-full overflow-hidden rounded-full border border-line/25 bg-sunken",
        className,
      )}
    >
      {SEGMENTS.map((segment) =>
        counts[segment.id] > 0 ? (
          <span
            key={segment.id}
            className={cn(
              "h-full transition-[width] duration-300 motion-reduce:transition-none",
              segment.className,
            )}
            style={{ width: `${(counts[segment.id] / total) * 100}%` }}
          />
        ) : null,
      )}
    </div>
  );
}
