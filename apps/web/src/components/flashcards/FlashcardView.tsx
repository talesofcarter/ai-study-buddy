import { useLayoutEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { cn } from "../../lib/cn";
import type { Flashcard } from "../../types";

const FLIP_DURATION_S = 0.6;

interface FlashcardViewProps {
  card: Flashcard;
  flipped: boolean;
  onFlip: () => void;
  /** Cards visibly stacked underneath this one (0–2). */
  stackDepth?: 0 | 1 | 2;
  /** Stretch to the parent's height instead of using the default card size. */
  fill?: boolean;
  className?: string;
}

const FACE =
  "flip-face ruled absolute inset-0 flex flex-col overflow-y-auto rounded-card border border-line/25 bg-surface px-6 pb-6 pt-8 shadow-card sm:px-8";

export function FlashcardView({
  card,
  flipped,
  onFlip,
  stackDepth = 0,
  fill = false,
  className,
}: FlashcardViewProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const hasMounted = useRef(false);
  const reduceMotion = useReducedMotion();

  // GSAP owns the rotation of the inner body; nothing else touches that element.
  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return undefined;
    const rotationY = flipped ? 180 : 0;

    if (!hasMounted.current || reduceMotion) {
      gsap.set(body, { rotationY });
      hasMounted.current = true;
      return undefined;
    }

    const tween = gsap.to(body, {
      rotationY,
      duration: FLIP_DURATION_S,
      ease: "power3.inOut",
      overwrite: true,
    });
    return () => {
      tween.kill();
    };
  }, [flipped, reduceMotion]);

  const handleClick = (): void => {
    // Let people select text without flipping the card.
    if (window.getSelection()?.toString()) return;
    onFlip();
  };

  return (
    // pb-7 (28px) is always reserved for the stack (deepest layer sticks out
    // 20px), so the layout never jumps when the last cards have no stack.
    <div
      className={cn(
        fill ? "flex min-h-0 flex-1 flex-col pb-7" : "pb-7",
        className,
      )}
    >
      <div className={cn("relative", fill && "min-h-48 flex-1")}>
        {stackDepth >= 2 ? (
          <span
            aria-hidden="true"
            className="absolute inset-x-8 inset-y-0 translate-y-5 rounded-card border border-line/20 bg-sunken"
          />
        ) : null}
        {stackDepth >= 1 ? (
          <span
            aria-hidden="true"
            className="absolute inset-x-4 inset-y-0 translate-y-2.5 rounded-card border border-line/25 bg-surface"
          />
        ) : null}

        {/* The Flip button in FlashcardStage is the keyboard/AT equivalent of this click. */}
        <div
          className={cn(
            "flip-scene z-10 cursor-pointer",
            fill ? "absolute inset-0" : "relative",
          )}
          onClick={handleClick}
        >
          <div
            ref={bodyRef}
            className={cn(
              "flip-body relative",
              fill ? "h-full" : "h-104 sm:aspect-5/3 sm:h-auto",
            )}
          >
            <section
              aria-label="Question"
              aria-hidden={flipped}
              className={FACE}
            >
              <span className="highlight self-start text-sm font-bold leading-8">
                Question
              </span>
              <p className="font-card text-[1.375rem] leading-8">
                {card.question}
              </p>
              {card.tags.length > 0 ? (
                <p className="mt-auto pt-4 text-sm leading-8 text-muted">
                  {card.tags.join(" · ")}
                </p>
              ) : null}
            </section>

            <section
              aria-label="Answer"
              aria-hidden={!flipped}
              className={cn(FACE, "transform-[rotateY(180deg)]")}
            >
              <span className="highlight self-start text-sm font-bold leading-8">
                Answer
              </span>
              <p className="font-card text-[1.375rem] leading-8">
                {card.answer}
              </p>
              {card.explanation ? (
                <>
                  <span className="mt-4 self-start text-sm font-bold leading-8 text-muted">
                    Explanation
                  </span>
                  <p className="leading-8 text-muted">{card.explanation}</p>
                </>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
