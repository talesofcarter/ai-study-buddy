import { ChevronDown } from "lucide-react";

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: readonly { readonly value: T; readonly label: string }[];
  onChange: (value: T) => void;
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: SelectFieldProps<T>) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">{label}</span>
      <span className="relative">
        <select
          value={value}
          onChange={(event) => {
            const next = options.find(
              (option) => option.value === event.target.value,
            );
            if (next) onChange(next.value);
          }}
          className="min-h-11 appearance-none rounded-ctl border border-line/40 bg-surface pl-3 pr-9 text-base font-bold text-ink"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2"
          aria-hidden="true"
        />
      </span>
    </label>
  );
}
