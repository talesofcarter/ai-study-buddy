import { cn } from "../../lib/cn";

export interface ChipOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly count?: number;
}

/** Shared by FilterChips and one-off toggle chips. */
export function chipStyles(selected: boolean): string {
  return cn(
    "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-bold transition-colors",
    selected
      ? "border-[1.5px] border-edge bg-accent text-on-accent"
      : "border-line/40 bg-surface text-ink hover:bg-sunken",
  );
}

interface FilterChipsProps<T extends string> {
  label: string;
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Single-select filter. Each chip is a toggle button, so it works on touch and keyboard. */
export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: FilterChipsProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={chipStyles(selected)}
          >
            {option.label}
            {option.count !== undefined ? (
              <span
                className={cn(
                  "font-normal tabular-nums",
                  selected ? null : "text-muted",
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
