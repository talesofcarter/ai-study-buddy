import { memo, useId, useState } from "react";
import { Bookmark, ChevronDown, Trash2 } from "lucide-react";
import { cn } from "../../lib/cn";
import type { Difficulty, Flashcard } from "../../types";
import { Button } from "../ui/Button";
import { Highlight } from "../ui/Highlight";
import { RatingControl } from "./RatingControl";

interface CardRowProps {
  card: Flashcard;
  query: string;
  onRate: (cardId: string, difficulty: Difficulty) => void;
  onToggleBookmark: (cardId: string) => void;
  onDelete: (cardId: string) => void;
}

export const CardRow = memo(function CardRow({
  card,
  query,
  onRate,
  onToggleBookmark,
  onDelete,
}: CardRowProps) {
  const [open, setOpen] = useState(false);
  const answerId = useId();

  return (
    <li>
      <article className="flex flex-col gap-4 rounded-card border border-line/25 bg-surface p-5 shadow-card">
        <div className="flex items-start gap-3">
          <p className="min-w-0 flex-1 pt-2 font-card text-lg leading-7">
            <Highlight text={card.question} query={query} />
          </p>
          <button
            type="button"
            aria-pressed={card.bookmarked}
            aria-label={card.bookmarked ? "Remove bookmark" : "Bookmark card"}
            onClick={() => onToggleBookmark(card.id)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-ctl hover:bg-sunken"
          >
            <Bookmark
              className={cn("h-5 w-5", card.bookmarked && "fill-accent")}
              aria-hidden="true"
            />
          </button>
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls={answerId}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-ctl pr-2 text-sm font-bold"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform motion-reduce:transition-none",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
          {open ? "Hide answer" : "Show answer"}
        </button>

        <div
          id={answerId}
          hidden={!open}
          className="flex flex-col gap-2 border-l-2 border-edge pl-4"
        >
          <p className="font-card leading-7">
            <Highlight text={card.answer} query={query} />
          </p>
          {card.explanation ? (
            <p className="text-muted">
              <Highlight text={card.explanation} query={query} />
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/15 pt-4">
          <RatingControl
            value={card.difficulty}
            onChange={(next) => onRate(card.id, next)}
          />
          <Button
            variant="ghost"
            aria-label="Delete card"
            onClick={() => onDelete(card.id)}
            className="px-3"
          >
            <Trash2 className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </article>
    </li>
  );
});
