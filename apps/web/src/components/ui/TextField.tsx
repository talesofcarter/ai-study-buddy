import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "../../lib/cn";

interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id"
> {
  label: string;
  hint?: string;
  error?: string | null;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, hint, error, className, ...props }, ref) {
    const id = useId();
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const describedBy =
      [hint ? hintId : null, error ? errorId : null]
        .filter(Boolean)
        .join(" ") || undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="font-bold">
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "min-h-12 rounded-ctl border bg-bg px-4 text-base text-ink placeholder:text-muted/70",
            error ? "border-hard" : "border-line/40",
            className,
          )}
          {...props}
        />
        {hint ? (
          <p id={hintId} className="text-sm text-muted">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p
            id={errorId}
            className="flex items-start gap-1.5 text-sm font-bold text-hard"
          >
            <CircleAlert
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
