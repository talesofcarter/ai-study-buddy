import { useEffect, useRef } from "react";
import { RATINGS } from "../../data/difficulty";
import type { FocusCounts } from "../../hooks/useFocusSession";
import { cn } from "../../lib/cn";
import { plural } from "../../lib/format";
import { Button } from "../ui/Button";

interface FocusSummaryProps {
  total: number;
  counts: FocusCounts;
  onReviewHard: () => void;
  onRestart: () => void;
  onDone: () => void;
}

export function FocusSummary({
  total,
  counts,
  onReviewHard,
  onRestart,
  onDone,
}: FocusSummaryProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section
      aria-labelledby="focus-summary-title"
      className="flex flex-col gap-6 rounded-card border border-line/25 bg-surface p-6 shadow-card sm:p-8"
    >
      <div className="flex flex-col gap-1">
        <span className="highlight self-start text-sm font-bold leading-8">
          Session complete
        </span>
        <h2
          ref={headingRef}
          id="focus-summary-title"
          tabIndex={-1}
          className="font-card text-2xl font-semibold leading-tight"
        >
          You went through {plural(total, "card")}
        </h2>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {RATINGS.map((rating) => (
          <div
            key={rating.id}
            className="rounded-ctl border border-line/25 bg-bg p-3"
          >
            <dt
              className={cn(
                "flex items-center gap-2 text-sm font-bold",
                rating.text,
              )}
            >
              <span
                aria-hidden="true"
                className={cn("h-2.5 w-2.5 rounded-full", rating.dot)}
              />
              {rating.label}
            </dt>
            <dd className="font-card text-2xl font-semibold tabular-nums">
              {counts[rating.id]}
            </dd>
          </div>
        ))}
        <div className="rounded-ctl border border-line/25 bg-bg p-3">
          <dt className="text-sm font-bold text-muted">Skipped</dt>
          <dd className="font-card text-2xl font-semibold tabular-nums">
            {counts.skipped}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-3">
        {counts.hard > 0 ? (
          <Button onClick={onReviewHard}>
            Review {plural(counts.hard, "hard card")}
          </Button>
        ) : null}
        <Button
          variant={counts.hard > 0 ? "secondary" : "primary"}
          onClick={onRestart}
        >
          Study all again
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Done
        </Button>
      </div>
    </section>
  );
}
