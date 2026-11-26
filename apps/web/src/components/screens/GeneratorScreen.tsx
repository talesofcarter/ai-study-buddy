import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { BackendStatusBadge } from "../generator/BackendStatusBadge";
import { GenerationProgress } from "../generator/GenerationProgress";
import { GenerationResult } from "../generator/GenerationResult";
import {
  GeneratorDrawer,
  type GeneratorValues,
} from "../generator/GeneratorDrawer";
import { GeneratorIdle } from "../generator/GeneratorIdle";
import { Button } from "../ui/Button";
import { useArchive } from "../../hooks/useArchive";
import { useGenerator } from "../../hooks/useGenerator";
import { buildStudySet } from "../../lib/archive";
import type { NewStudySet } from "../../types";

type View = "idle" | "progress" | "result";

const EMPTY_VALUES: GeneratorValues = { title: "", notes: "", subjects: [] };

export function GeneratorScreen() {
  const { addSet } = useArchive();
  const generator = useGenerator();
  const reduceMotion = useReducedMotion();
  const [values, setValues] = useState<GeneratorValues>(EMPTY_VALUES);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saved, setSaved] = useState<NewStudySet | null>(null);

  let view: View = "idle";
  if (generator.phase !== "idle") view = "progress";
  else if (saved) view = "result";

  const handleSubmit = async (input: GeneratorValues): Promise<void> => {
    setValues(input);
    setDrawerOpen(false);
    setSaved(null);

    const drafts = await generator.generate({
      notes: input.notes,
      subjects: input.subjects,
    });

    if (!drafts) {
      // Failed or cancelled: bring the form back with the notes intact
      // (and the error message, if there is one).
      setDrawerOpen(true);
      return;
    }

    const built = buildStudySet(input, drafts);
    addSet(built.set, built.cards);
    setSaved(built);
    setValues(EMPTY_VALUES);
  };

  return (
    // 4.0625rem = the header: min-h-16 (4rem) plus its 1px border.
    <div className="mx-auto grid h-[calc(100dvh-4.0625rem)] w-full max-w-6xl grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:grid-rows-1 lg:gap-14 lg:py-8">
      <section
        aria-labelledby="generate-title"
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 lg:flex-col lg:items-start lg:justify-start lg:gap-4"
      >
        <span className="highlight hidden text-sm font-bold leading-8 lg:inline-block">
          Generator
        </span>
        <h1
          id="generate-title"
          className="font-card text-2xl font-semibold leading-tight lg:text-3xl"
        >
          Notes in, cards out
        </h1>
        <p className="hidden lg:block">
          Paste what you're studying. It becomes question-and-answer cards,
          saved to this profile's archive.
        </p>
        <Button
          onClick={() => setDrawerOpen(true)}
          disabled={view === "progress"}
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
        >
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          New set
        </Button>

        <div className="w-full lg:w-auto">
          <BackendStatusBadge
            status={generator.backend}
            onRetry={generator.retryWake}
          />
        </div>
      </section>

      <section
        aria-label="Generator workspace"
        className="mx-auto flex min-h-0 w-full max-w-2xl flex-col lg:mx-0"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            className="flex min-h-0 flex-1 flex-col justify-center"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {view === "idle" ? <GeneratorIdle /> : null}

            {view === "progress" &&
            (generator.phase === "waking" ||
              generator.phase === "generating") ? (
              <GenerationProgress
                phase={generator.phase}
                onCancel={generator.cancel}
              />
            ) : null}

            {view === "result" && saved ? (
              <GenerationResult saved={saved} />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {drawerOpen ? (
          <GeneratorDrawer
            key="drawer"
            values={values}
            error={generator.error?.message ?? null}
            onChange={setValues}
            onSubmit={(input) => void handleSubmit(input)}
            onClose={() => setDrawerOpen(false)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
