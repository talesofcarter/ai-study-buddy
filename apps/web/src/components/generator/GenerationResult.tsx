import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { subjectLabel } from "../../data/subjects";
import type { NewStudySet } from "../../types";
import { FlashcardStage } from "../flashcards/FlashcardStage";
import { Button, buttonStyles } from "../ui/Button";

interface GenerationResultProps {
  saved: NewStudySet;
  onAnother: () => void;
}

export function GenerationResult({ saved, onAnother }: GenerationResultProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { set, cards } = saved;

  // Move focus to the result so keyboard and screen-reader users land on it.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="highlight self-start text-sm font-bold leading-8">
          Saved to your archive
        </span>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-card text-2xl font-semibold leading-tight"
        >
          {set.title}
        </h2>
        <p className="text-muted">
          {cards.length} {cards.length === 1 ? "card" : "cards"}
          {set.subjects.length > 0
            ? ` · ${set.subjects.map(subjectLabel).join(" · ")}`
            : ""}
        </p>
      </div>

      <FlashcardStage cards={cards} />

      <div className="flex flex-wrap gap-3">
        <Button onClick={onAnother}>
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          Generate another set
        </Button>
        <Link to="/archive" className={buttonStyles("secondary")}>
          Open archive
        </Link>
      </div>
    </div>
  );
}
