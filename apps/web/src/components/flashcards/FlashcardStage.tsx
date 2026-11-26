import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCw } from "lucide-react";
import { isInteractiveTarget } from "../../lib/dom";
import { slideVariants, type Direction } from "../../lib/motion";
import type { Flashcard } from "../../types";
import { Button } from "../ui/Button";
import { ProgressTrack } from "../ui/ProgressTrack";
import { FlashcardView } from "./FlashcardView";
import { cn } from "../../lib/cn";

interface FlashcardStageProps {
  cards: readonly Flashcard[];
  fill?: boolean;
}

export function FlashcardStage({ cards, fill = false }: FlashcardStageProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState<Direction>(1);
  const reduceMotion = useReducedMotion();

  const total = cards.length;

  const goTo = useCallback(
    (target: number) => {
      if (target === index || target < 0 || target >= total) return;
      setDirection(target > index ? 1 : -1);
      setIndex(target);
      setFlipped(false);
    },
    [index, total],
  );

  const go = useCallback(
    (delta: Direction) => goTo(index + delta),
    [goTo, index],
  );

  const flip = useCallback(() => setFlipped((value) => !value), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      )
        return;
      if (isInteractiveTarget(event.target)) return;

      if (event.key === " ") {
        event.preventDefault();
        flip();
      } else if (event.key === "ArrowRight") {
        go(1);
      } else if (event.key === "ArrowLeft") {
        go(-1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flip, go]);

  const card = cards[index];
  if (!card) return null;

  const stackDepth = Math.min(2, total - index - 1) as 0 | 1 | 2;

  return (
    <div
      className={cn(
        "flex flex-col",
        fill ? "min-h-0 flex-1 gap-3 sm:gap-4" : "gap-6",
      )}
    >
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={card.id}
          custom={direction}
          variants={slideVariants(reduceMotion ? 0 : 32)}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={fill ? "flex min-h-0 flex-1 flex-col" : undefined}
        >
          <FlashcardView
            card={card}
            flipped={flipped}
            onFlip={flip}
            stackDepth={stackDepth}
            fill={fill}
          />
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          onClick={() => go(-1)}
          disabled={index === 0}
          aria-label="Previous card"
          className="px-3 sm:px-5"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        <Button onClick={flip} className="flex-1">
          <RotateCw className="h-5 w-5" aria-hidden="true" />
          {flipped ? "Show question" : "Show answer"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => go(1)}
          disabled={index === total - 1}
          aria-label="Next card"
          className="px-3 sm:px-5"
        >
          <span className="hidden sm:inline">Next</span>
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>

      <ProgressTrack current={index} total={total} onSelect={goTo} />
    </div>
  );
}
