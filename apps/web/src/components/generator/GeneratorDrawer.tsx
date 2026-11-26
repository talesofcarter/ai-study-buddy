import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type SyntheticEvent,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CircleAlert, Sparkles, X } from "lucide-react";
import { NOTES_MAX, NOTES_MIN, validateNotes } from "../../lib/validation";
import type { SubjectId } from "../../types";
import { Button } from "../ui/Button";
import { TextArea } from "../ui/TextArea";
import { TextField } from "../ui/TextField";
import { SubjectPicker } from "./SubjectPicker";

export interface GeneratorValues {
  readonly title: string;
  readonly notes: string;
  readonly subjects: readonly SubjectId[];
}

interface GeneratorDrawerProps {
  values: GeneratorValues;
  error: string | null;
  onChange: (values: GeneratorValues) => void;
  /** Called only with valid input (notes are trimmed). */
  onSubmit: (values: GeneratorValues) => void;
  onClose: () => void;
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-ctl border border-hard/60 bg-bg p-4"
    >
      <CircleAlert
        className="mt-0.5 h-5 w-5 shrink-0 text-hard"
        aria-hidden="true"
      />
      <div className="flex flex-col gap-0.5">
        <p className="font-bold text-hard">Couldn't generate your cards</p>
        <p>{message}</p>
      </div>
    </div>
  );
}

// Opening decelerates gently into place; closing accelerates away.
const ENTER_EASE = [0.22, 0.8, 0.2, 1] as const;
const EXIT_EASE = [0.4, 0, 0.6, 1] as const;
const ENTER_S = 0.45;
const EXIT_S = 0.3;

/**
 * Render inside <AnimatePresence>. A native modal <dialog> gives the focus
 * trap, the inert page behind it and Escape. The dialog itself is invisible
 * and never animates: the scrim fades on its own layer and the panel only
 * slides, so the two never fight each other.
 */
export function GeneratorDrawer({
  values,
  error,
  onChange,
  onSubmit,
  onClose,
}: GeneratorDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const [notesTouched, setNotesTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    if (!dialog.open) dialog.showModal();
    // With a mouse, start in the notes. On touch screens, skip it so the
    // keyboard doesn't cover the form the moment it opens. preventScroll
    // stops the browser jumping to the still-off-screen panel.
    if (window.matchMedia("(pointer: fine)").matches) {
      notesRef.current?.focus({ preventScroll: true });
    }
    return () => {
      if (dialog.open) dialog.close(); // hands focus back to the opener
    };
  }, []);

  const notesResult = validateNotes(values.notes);
  const notesError =
    (notesTouched || submitted) && !notesResult.valid
      ? notesResult.message
      : null;
  const subjectsError =
    submitted && values.subjects.length === 0
      ? "Choose at least one subject."
      : null;
  const length = values.notes.trim().length;

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>): void => {
    event.preventDefault(); // close through React so the exit animation plays
    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setSubmitted(true);

    if (!notesResult.valid) {
      notesRef.current?.focus();
      return;
    }
    if (values.subjects.length === 0) return;
    onSubmit({ ...values, notes: notesResult.value });
  };

  // Reduced motion: crossfade instead of sliding.
  const panelHidden = reduceMotion ? { opacity: 0 } : { x: "100%" };
  const panelShown = reduceMotion ? { opacity: 1 } : { x: "0%" };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-ink backdrop:bg-transparent open:flex open:justify-end"
    >
      <motion.div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          transition: { duration: ENTER_S, ease: "easeOut" },
        }}
        exit={{
          opacity: 0,
          transition: { duration: EXIT_S, ease: "easeIn" },
        }}
      />

      <motion.div
        className="relative flex h-full w-full flex-col border-l border-line/25 bg-surface shadow-card will-change-transform md:w-[min(48vw,60rem)] md:min-w-120"
        initial={panelHidden}
        animate={{
          ...panelShown,
          transition: { duration: ENTER_S, ease: ENTER_EASE },
        }}
        exit={{
          ...panelHidden,
          transition: { duration: EXIT_S, ease: EXIT_EASE },
        }}
      >
        <header className="flex items-center justify-between gap-3 border-b border-line/15 px-5 py-3 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="font-card text-xl font-semibold">
              New set
            </h2>
            <p className="text-sm text-muted">
              Paste your notes and pick subjects.
            </p>
          </div>
          <Button
            variant="ghost"
            aria-label="Close"
            onClick={onClose}
            className="-mr-2 px-3"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </header>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* The notes field is the flexible part: it takes whatever height
              the other fields leave. Only a very short screen scrolls here. */}
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 sm:px-6">
            {error ? <ErrorNotice message={error} /> : null}

            <TextField
              label="Title (optional)"
              name="title"
              maxLength={80}
              autoComplete="off"
              placeholder="Defaults to the first line of your notes"
              value={values.title}
              onChange={(event) =>
                onChange({ ...values, title: event.target.value })
              }
            />

            <TextArea
              ref={notesRef}
              containerClassName="flex-1"
              label="Notes"
              name="notes"
              placeholder="Paste your study notes here…"
              hint={`${length.toLocaleString("en-US")} / ${NOTES_MAX.toLocaleString("en-US")} characters. At least ${NOTES_MIN} needed.`}
              value={values.notes}
              error={notesError}
              onChange={(event) =>
                onChange({ ...values, notes: event.target.value })
              }
              onBlur={() => setNotesTouched(true)}
            />

            <SubjectPicker
              value={values.subjects}
              onChange={(subjects) => onChange({ ...values, subjects })}
              error={subjectsError}
            />
          </div>

          <div className="border-t border-line/15 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
            <Button type="submit" className="w-full">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
              Generate cards
            </Button>
          </div>
        </form>
      </motion.div>
    </dialog>
  );
}
