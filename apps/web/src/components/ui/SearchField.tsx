import { useId } from "react";
import { Search, X } from "lucide-react";
import { cn } from "../../lib/cn";

interface SearchFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchField({
  label,
  value,
  onChange,
  placeholder,
  className,
}: SearchFieldProps) {
  const id = useId();

  return (
    <div role="search" className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-ctl border border-line/40 bg-bg pl-11 pr-12 text-base text-ink placeholder:text-muted/70 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value.length > 0 ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-ctl text-muted hover:text-ink"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
