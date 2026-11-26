import { forwardRef } from "react";

interface CardCountProps {
  shown: number;
  total: number;
}

export const CardCount = forwardRef<HTMLParagraphElement, CardCountProps>(
  function CardCount({ shown, total }, ref) {
    return (
      <p
        ref={ref}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="text-sm tabular-nums text-muted"
      >
        Showing {shown} of {total} {total === 1 ? "card" : "cards"}
      </p>
    );
  },
);
