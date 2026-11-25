import { useId } from "react";
import { Check, CircleAlert } from "lucide-react";
import { SUBJECTS } from "../../data/subjects";
import { cn } from "../../lib/cn";
import type { SubjectId } from "../../types";

interface SubjectPickerProps {
  value: readonly SubjectId[];
  onChange: (next: readonly SubjectId[]) => void;
  error?: string | null;
}

export function SubjectPicker({ value, onChange, error }: SubjectPickerProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const toggle = (subject: SubjectId): void =>
    onChange(
      value.includes(subject)
        ? value.filter((current) => current !== subject)
        : [...value, subject],
    );

  return (
    <fieldset
      aria-describedby={error ? `${hintId} ${errorId}` : hintId}
      className="flex min-w-0 flex-col gap-2"
    >
      <legend className="mb-1.5 font-bold">Subjects</legend>
      <p id={hintId} className="text-sm text-muted">
        Pick what the notes cover. It guides the generator and tags your cards.
      </p>
      <div className="flex flex-wrap gap-2">
        {SUBJECTS.map((subject) => {
          const selected = value.includes(subject.id);
          return (
            <button
              key={subject.id}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(subject.id)}
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-bold transition-colors",
                selected
                  ? "border-[1.5px] border-edge bg-accent text-on-accent"
                  : "border-line/40 bg-surface text-ink hover:bg-sunken",
              )}
            >
              {selected ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : null}
              {subject.label}
            </button>
          );
        })}
      </div>
      {error ? (
        <p
          id={errorId}
          className="flex items-start gap-1.5 text-sm font-bold text-hard"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
