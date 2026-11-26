import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Focus } from "lucide-react";
import { subjectLabel } from "../../data/subjects";
import { useArchive } from "../../hooks/useArchive";
import type { NewStudySet } from "../../types";
import { FlashcardStage } from "../flashcards/FlashcardStage";
import { FocusMode } from "../focus/FocusMode";
import { Button, buttonStyles } from "../ui/Button";

interface GenerationResultProps {
  saved: NewStudySet;
}

export function GenerationResult({ saved }: GenerationResultProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { rateCard } = useArchive();
  const [focusing, setFocusing] = useState(false);
  const { set, cards } = saved;

  // Move focus to the result so keyboard and screen-reader users land on it.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
      <div className="flex flex-col">
        <span className="highlight hidden self-start text-sm font-bold leading-8 sm:inline-block">
          Saved to your archive
        </span>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="line-clamp-2 wrap-break-word font-card text-xl font-semibold leading-tight sm:text-2xl"
        >
          {set.title}
        </h2>
        <p className="text-sm text-muted sm:text-base">
          {cards.length} {cards.length === 1 ? "card" : "cards"}
          {set.subjects.length > 0
            ? ` · ${set.subjects.map(subjectLabel).join(" · ")}`
            : ""}
        </p>
      </div>

      <FlashcardStage cards={cards} fill />

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => setFocusing(true)}
          className="flex-1 sm:flex-none"
        >
          <Focus className="h-5 w-5" aria-hidden="true" />
          Focus mode
        </Button>
        <Link
          to="/archive"
          className={buttonStyles("secondary", "flex-1 sm:flex-none")}
        >
          Open archive
        </Link>
      </div>

      <AnimatePresence>
        {focusing ? (
          <FocusMode
            cards={cards}
            title={set.title}
            onRate={rateCard}
            onExit={() => setFocusing(false)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
