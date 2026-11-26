import { useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CircleAlert, Sparkles } from "lucide-react";
import { BackendStatusBadge } from "../generator/BackendStatusBadge";
import { GenerationProgress } from "../generator/GenerationProgress";
import { GenerationResult } from "../generator/GenerationResult";
import { SubjectPicker } from "../generator/SubjectPicker";
import { Button } from "../ui/Button";
import { TextArea } from "../ui/TextArea";
import { TextField } from "../ui/TextField";
import { useArchive } from "../../hooks/useArchive";
import { useGenerator } from "../../hooks/useGenerator";
import { buildStudySet } from "../../lib/archive";
import { NOTES_MAX, NOTES_MIN, validateNotes } from "../../lib/validation";
import type { NewStudySet, SubjectId } from "../../types";

type View = "form" | "progress" | "result";

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

export function GeneratorScreen() {
  const { addSet } = useArchive();
  const generator = useGenerator();
  const reduceMotion = useReducedMotion();

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [subjects, setSubjects] = useState<readonly SubjectId[]>([]);
  const [notesTouched, setNotesTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState<NewStudySet | null>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const notesResult = validateNotes(notes);
  const notesError =
    (notesTouched || submitted) && !notesResult.valid
      ? notesResult.message
      : null;
  const subjectsError =
    submitted && subjects.length === 0 ? "Choose at least one subject." : null;
  const length = notes.trim().length;

  let view: View = "form";
  if (saved) view = "result";
  else if (generator.phase !== "idle") view = "progress";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    if (!notesResult.valid) {
      notesRef.current?.focus();
      return;
    }
    if (subjects.length === 0) return;

    const drafts = await generator.generate({
      notes: notesResult.value,
      subjects,
    });
    if (!drafts) return;

    const built = buildStudySet(
      { title, notes: notesResult.value, subjects },
      drafts,
    );
    addSet(built.set, built.cards);
    setSaved(built);
  };

  const handleAnother = (): void => {
    setSaved(null);
    setTitle("");
    setNotes("");
    setSubjects([]);
    setNotesTouched(false);
    setSubmitted(false);
    generator.clearError();
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-14 lg:py-14">
      <section
        aria-labelledby="generate-title"
        className="flex flex-col items-start gap-4"
      >
        <span className="highlight text-sm font-bold leading-8">Generator</span>
        <h1
          id="generate-title"
          className="font-card text-3xl font-semibold leading-tight"
        >
          Notes in, cards out
        </h1>
        <p>
          Paste what you're studying. It becomes question-and-answer cards,
          saved to this profile's archive.
        </p>
        <BackendStatusBadge
          status={generator.backend}
          onRetry={generator.retryWake}
        />
      </section>

      <section
        aria-label="Generator workspace"
        className="mx-auto w-full max-w-2xl lg:mx-0"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {view === "result" && saved ? (
              <GenerationResult saved={saved} onAnother={handleAnother} />
            ) : null}

            {view === "progress" &&
            (generator.phase === "waking" ||
              generator.phase === "generating") ? (
              <GenerationProgress
                phase={generator.phase}
                onCancel={generator.cancel}
              />
            ) : null}

            {view === "form" ? (
              <form
                noValidate
                onSubmit={(event) => void handleSubmit(event)}
                className="flex flex-col gap-6 rounded-card border border-line/25 bg-surface p-6 shadow-card sm:p-8"
              >
                {generator.error ? (
                  <ErrorNotice message={generator.error.message} />
                ) : null}

                <TextField
                  label="Title (optional)"
                  name="title"
                  maxLength={80}
                  autoComplete="off"
                  hint="Left blank, the first line of your notes is used."
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />

                <TextArea
                  ref={notesRef}
                  label="Notes"
                  name="notes"
                  placeholder="Paste your study notes here…"
                  hint={`${length.toLocaleString("en-US")} / ${NOTES_MAX.toLocaleString("en-US")} characters. At least ${NOTES_MIN} needed.`}
                  value={notes}
                  error={notesError}
                  onChange={(event) => setNotes(event.target.value)}
                  onBlur={() => setNotesTouched(true)}
                />

                <SubjectPicker
                  value={subjects}
                  onChange={setSubjects}
                  error={subjectsError}
                />

                <Button
                  type="submit"
                  className="w-full sm:w-auto sm:self-start"
                >
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                  Generate cards
                </Button>
              </form>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  );
}
