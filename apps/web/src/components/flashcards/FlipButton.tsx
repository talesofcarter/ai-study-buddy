import { forwardRef, type ButtonHTMLAttributes } from "react";
import { RotateCw } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";

interface FlipButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  flipped: boolean;
}

const LABEL = "col-start-1 row-start-1 text-left";

export const FlipButton = forwardRef<HTMLButtonElement, FlipButtonProps>(
  function FlipButton({ flipped, ...props }, ref) {
    return (
      <Button ref={ref} {...props}>
        <RotateCw className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span className="grid">
          <span className={cn(LABEL, flipped && "invisible")}>Show answer</span>
          <span className={cn(LABEL, !flipped && "invisible")}>
            Show question
          </span>
        </span>
      </Button>
    );
  },
);
