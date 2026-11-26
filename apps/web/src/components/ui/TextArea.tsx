import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "../../lib/cn";

interface TextAreaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "id"
> {
  label: string;
  hint?: string;
  error?: string | null;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea({ label, hint, error, className, ...props }, ref) {
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
        <textarea
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "min-h-56 resize-y rounded-ctl border bg-bg px-4 py-3 text-base leading-7 text-ink placeholder:text-muted/70",
            error ? "border-hard" : "border-line/40",
            className,
          )}
          {...props}
        />
        {hint ? (
          <p id={hintId} className="text-sm tabular-nums text-muted">
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
