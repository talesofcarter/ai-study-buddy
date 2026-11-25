import { useEffect, useState } from "react";
import { Button } from "../ui/Button";

interface GenerationProgressProps {
  phase: "waking" | "generating";
  onCancel: () => void;
}

export function GenerationProgress({
  phase,
  onCancel,
}: GenerationProgressProps) {
  // Total time across both phases: the component stays mounted between them.
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = window.setInterval(
      () => setSeconds(Math.floor((Date.now() - start) / 1000)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, []);

  const waking = phase === "waking";

  return (
    <div className="flex flex-col gap-6 rounded-card border border-line/25 bg-surface p-6 shadow-card sm:p-8">
      {/* A card-shaped placeholder: the cards are on their way. */}
      <div
        aria-hidden="true"
        className="ruled flex h-44 flex-col gap-4 rounded-card border border-line/25 bg-bg px-6 pt-8"
      >
        <span className="h-3 w-20 rounded-full bg-accent/60 motion-safe:animate-pulse" />
        <span className="h-3 w-3/4 rounded-full bg-sunken motion-safe:animate-pulse" />
        <span className="h-3 w-1/2 rounded-full bg-sunken motion-safe:animate-pulse" />
      </div>

      <div className="flex flex-col gap-1">
        <div role="status" aria-live="polite" className="flex flex-col gap-1">
          <p className="font-card text-xl font-semibold">
            {waking ? "Waking the study server…" : "Writing your cards…"}
          </p>
          <p className="text-muted">
            {waking
              ? "The free host sleeps when idle, so the first request can take up to a minute. Your notes are safe."
              : "Reading your notes and picking out the ideas worth remembering."}
          </p>
        </div>
        <p aria-hidden="true" className="text-sm tabular-nums text-muted">
          {seconds}s elapsed
        </p>
      </div>

      <Button variant="secondary" onClick={onCancel} className="self-start">
        Cancel
      </Button>
    </div>
  );
}
