import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../../lib/cn";

const SEGMENT_LIMIT = 12;

interface ProgressTrackProps {
  current: number;
  total: number;
  onSelect: (index: number) => void;
  className?: string;
}

interface TrackProps {
  current: number;
  total: number;
  onSelect: (index: number) => void;
}

const pad = (value: number): string => String(value).padStart(2, "0");

function Segments({ current, total, onSelect }: TrackProps) {
  return (
    <div
      role="group"
      aria-label="Card progress"
      className="flex items-center gap-1.5"
    >
      {Array.from({ length: total }, (_, position) => {
        const isCurrent = position === current;
        const isDone = position < current;
        return (
          <button
            key={`segment-${position}`}
            type="button"
            onClick={() => onSelect(position)}
            aria-label={`Go to card ${position + 1}`}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "group flex min-h-11 items-center transition-[flex-grow] duration-300 motion-reduce:transition-none",
              isCurrent ? "flex-3" : "flex-1",
            )}
          >
            <span
              className={cn(
                "block w-full rounded-full border transition-[height,background-color,border-color] duration-300 motion-reduce:transition-none",
                isCurrent
                  ? "h-2.5 border-edge bg-accent"
                  : isDone
                    ? "h-1.5 border-edge/70 bg-accent"
                    : "h-1.5 border-line/25 bg-sunken group-hover:border-line/50",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function Scrubber({ current, total, onSelect }: TrackProps) {
  const reduceMotion = useReducedMotion();
  const percent = total > 1 ? (current / (total - 1)) * 100 : 100;
  const spring = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 260, damping: 30 };

  return (
    <div className="relative flex min-h-11 items-center px-2">
      <input
        type="range"
        min={0}
        max={total - 1}
        step={1}
        value={current}
        onChange={(event) => onSelect(Number(event.target.value))}
        aria-label="Card position"
        aria-valuetext={`Card ${current + 1} of ${total}`}
        className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
      />
      <div
        aria-hidden="true"
        className="relative h-2 w-full rounded-full border border-line/25 bg-sunken peer-focus-visible:ring-[3px] peer-focus-visible:ring-ink peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg"
      >
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={spring}
        />
        <motion.span
          className="absolute top-1/2 -ml-2 -mt-2 h-4 w-4 rounded-full border-[1.5px] border-edge bg-accent shadow-card"
          initial={false}
          animate={{ left: `${percent}%` }}
          transition={spring}
        />
      </div>
    </div>
  );
}

export function ProgressTrack({
  current,
  total,
  onSelect,
  className,
}: ProgressTrackProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="min-w-0 flex-1">
        {total <= SEGMENT_LIMIT ? (
          <Segments current={current} total={total} onSelect={onSelect} />
        ) : (
          <Scrubber current={current} total={total} onSelect={onSelect} />
        )}
      </div>
      <p aria-live="polite" className="shrink-0 font-card text-sm tabular-nums">
        <span className="sr-only">
          Card {current + 1} of {total}
        </span>
        <span aria-hidden="true">
          <span className="font-bold">{pad(current + 1)}</span>
          <span className="text-muted"> / {pad(total)}</span>
        </span>
      </p>
    </div>
  );
}
