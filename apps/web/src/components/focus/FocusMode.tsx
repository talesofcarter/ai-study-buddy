import {
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type SyntheticEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCw, X } from "lucide-react";
import { RATINGS } from "../../data/difficulty";
import { useFocusSession } from "../../hooks/useFocusSession";
import { cn } from "../../lib/cn";
import { slideVariants } from "../../lib/motion";
import type { Flashcard, Rating } from "../../types";
import { FlashcardView } from "../flashcards/FlashcardView";
import { Button } from "../ui/Button";
import { FocusSummary } from "./FocusSummary";

interface FocusModeProps {
  cards: readonly Flashcard[];
  title: string;
  onRate?: (cardId: string, difficulty: Rating) => void;
  onExit: () => void;
}

const pad = (value: number): string => String(value).padStart(2, "0");

export function FocusMode({ cards, title, onRate, onExit }: FocusModeProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const flipRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const session = useFocusSession(cards, onRate);
  const { queue, index, card, flipped, direction, ratings, counts, finished } =
    session;
  const total = queue.length;

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    if (!dialog.open) dialog.showModal();
    flipRef.current?.focus();

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    return () => {
      root.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, []);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>): void => {
    event.preventDefault();
    onExit();
  };

  const handleRate = (rating: Rating): void => {
    session.rate(rating);
    flipRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>): void => {
    if (finished || event.altKey || event.ctrlKey || event.metaKey) return;

    if (event.key === " ") {
      // A focused button keeps its own Space behaviour.
      const onButton =
        event.target instanceof Element &&
        event.target.closest("button") !== null;
      if (onButton) return;
      event.preventDefault();
      session.flip();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      session.move(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      session.move(-1);
    } else if (flipped) {
      const match = RATINGS.find((rating) => rating.shortcut === event.key);
      if (match) {
        event.preventDefault();
        handleRate(match.id);
      }
    }
  };

  const stackDepth = Math.min(2, Math.max(0, total - index - 1)) as 0 | 1 | 2;
  const progress = total === 0 ? 0 : finished ? 1 : index / total;

  return (
    <motion.dialog
      ref={dialogRef}
      aria-label={`Focus mode: ${title}`}
      onCancel={handleCancel}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto overscroll-contain border-0 bg-bg p-0 text-ink"
      initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.99 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-4 px-4 pb-6 pt-3 sm:px-6">
        <header className="flex items-center gap-3">
          <Button variant="ghost" onClick={onExit} className="-ml-3 px-3">
            <X className="h-5 w-5" aria-hidden="true" />
            Exit
          </Button>
          <p className="min-w-0 flex-1 truncate text-center text-sm text-muted">
            {title}
          </p>
          <p
            aria-live="polite"
            className="shrink-0 font-card text-sm tabular-nums"
          >
            {finished ? (
              "Done"
            ) : (
              <>
                <span className="sr-only">
                  Card {index + 1} of {total}
                </span>
                <span aria-hidden="true">
                  <span className="font-bold">{pad(index + 1)}</span>
                  <span className="text-muted"> / {pad(total)}</span>
                </span>
              </>
            )}
          </p>
        </header>

        <div
          aria-hidden="true"
          className="h-1 overflow-hidden rounded-full bg-sunken"
        >
          <motion.div
            className="h-full origin-left rounded-full bg-accent"
            initial={false}
            animate={{ scaleX: progress }}
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
          />
        </div>

        <main className="flex flex-1 flex-col justify-center gap-6">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={finished ? "summary" : (card?.id ?? "empty")}
              custom={direction}
              variants={slideVariants(reduceMotion ? 0 : 32)}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {finished ? (
                <FocusSummary
                  total={total}
                  counts={counts}
                  onReviewHard={session.reviewHard}
                  onRestart={session.restart}
                  onDone={onExit}
                />
              ) : card ? (
                <FlashcardView
                  card={card}
                  flipped={flipped}
                  onFlip={session.flip}
                  stackDepth={stackDepth}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>

          {!finished && card ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() => session.move(-1)}
                  disabled={index === 0}
                  aria-label="Previous card"
                  className="px-3 sm:px-5"
                >
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <Button ref={flipRef} onClick={session.flip} className="flex-1">
                  <RotateCw className="h-5 w-5" aria-hidden="true" />
                  {flipped ? "Show question" : "Show answer"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => session.move(1)}
                  aria-label={
                    index === total - 1 ? "Skip and finish" : "Skip card"
                  }
                  className="px-3 sm:px-5"
                >
                  <span className="hidden sm:inline">Skip</span>
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>

              <div
                role="group"
                aria-label="Rate this card"
                className="flex flex-col gap-2"
              >
                <p className="text-center text-sm text-muted">
                  {flipped
                    ? "How well did you know it?"
                    : "Flip the card to rate it."}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {RATINGS.map((rating) => {
                    const pressed = ratings[card.id] === rating.id;
                    return (
                      <button
                        key={rating.id}
                        type="button"
                        disabled={!flipped}
                        aria-pressed={pressed}
                        onClick={() => handleRate(rating.id)}
                        className={cn(
                          "flex min-h-12 flex-col items-center justify-center rounded-ctl border bg-surface px-2 text-base font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-sunken",
                          pressed
                            ? "border-[1.5px] border-edge bg-sunken"
                            : "border-line/40",
                        )}
                      >
                        <span
                          className={cn("flex items-center gap-2", rating.text)}
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "h-2.5 w-2.5 rounded-full",
                              rating.dot,
                            )}
                          />
                          {rating.label}
                        </span>
                        <kbd
                          aria-hidden="true"
                          className="hidden text-xs font-normal text-muted sm:block"
                        >
                          {rating.shortcut}
                        </kbd>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </main>

        <p className="hidden text-center text-xs text-muted sm:block">
          Space flips · ← → move · 1 2 3 rate · Esc exits
        </p>
      </div>
    </motion.dialog>
  );
}
