import { cn } from "../../lib/cn";

const THUMB_PX = 12;

interface ProgressTrackProps {
  current: number;
  total: number;
  onSelect: (index: number) => void;
  className?: string;
}

const pad = (value: number): string => String(value).padStart(2, "0");

export function ProgressTrack({
  current,
  total,
  onSelect,
  className,
}: ProgressTrackProps) {
  const fraction = total > 1 ? current / (total - 1) : 1;

  const knobLeft = `calc((100% - ${THUMB_PX}px) * ${fraction})`;
  const fillWidth = `calc((100% - ${THUMB_PX}px) * ${fraction} + ${THUMB_PX / 2}px)`;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative flex min-h-11 min-w-0 flex-1 items-center">
        <input
          type="range"
          min={0}
          max={Math.max(total - 1, 0)}
          step={1}
          value={current}
          onChange={(event) => onSelect(Number(event.target.value))}
          aria-label="Card position"
          aria-valuetext={`Card ${current + 1} of ${total}`}
          className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        />

        <div
          aria-hidden="true"
          className="relative h-0.5 w-full rounded-full bg-line/15"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-ink transition-[width] duration-200 ease-out motion-reduce:transition-none"
            style={{ width: fillWidth }}
          />
        </div>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-[1.5px] border-edge bg-accent transition-[left,scale] duration-200 ease-out peer-hover:scale-125 peer-focus-visible:scale-125 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink motion-reduce:transition-none"
          style={{ left: knobLeft }}
        />
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
