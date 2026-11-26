import { Check, CircleAlert } from "lucide-react";
import type { BackendStatus } from "../../hooks/useGenerator";

interface BackendStatusBadgeProps {
  status: BackendStatus;
  onRetry: () => void;
}

export function BackendStatusBadge({
  status,
  onRetry,
}: BackendStatusBadgeProps) {
  return (
    <div
      role="status"
      className="flex min-h-11 items-center gap-2 text-sm text-muted"
    >
      {status === "checking" ? (
        <>
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 rounded-full border border-edge bg-accent motion-safe:animate-pulse"
          />
          <span>Waking the study server. You can keep typing.</span>
        </>
      ) : null}
      {status === "ready" ? (
        <>
          <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Server ready</span>
        </>
      ) : null}
      {status === "unreachable" ? (
        <>
          <CircleAlert
            className="h-4 w-4 shrink-0 text-hard"
            aria-hidden="true"
          />
          <span>Can't reach the server.</span>
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 rounded-ctl px-2 font-bold text-ink underline"
          >
            Retry
          </button>
        </>
      ) : null}
    </div>
  );
}
