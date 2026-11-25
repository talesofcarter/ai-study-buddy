import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError,
  generateCards,
  isAbortError,
  raceAbort,
  toApiError,
  waitForBackend,
  type GenerateInput,
} from "../lib/api";
import type { CardDraft } from "../types";

export type BackendStatus = "checking" | "ready" | "unreachable";
export type GeneratorPhase = "idle" | "waking" | "generating";

/** Render sleeps after ~15 min idle, so re-check a little before that. */
const WARM_TTL_MS = 10 * 60 * 1000;

interface UseGenerator {
  backend: BackendStatus;
  phase: GeneratorPhase;
  error: ApiError | null;
  /** Resolves to the drafts, or null if it failed (see `error`) or was cancelled. */
  generate: (input: GenerateInput) => Promise<readonly CardDraft[] | null>;
  cancel: () => void;
  retryWake: () => void;
  clearError: () => void;
}

export function useGenerator(): UseGenerator {
  const [backend, setBackend] = useState<BackendStatus>("checking");
  const [phase, setPhase] = useState<GeneratorPhase>("idle");
  const [error, setError] = useState<ApiError | null>(null);

  const lifetimeRef = useRef<AbortController | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const wakeRef = useRef<Promise<void> | null>(null);
  const lastOkRef = useRef(0);

  /** Starts (or joins) a wake-up. Only one runs at a time. */
  const wake = useCallback((): Promise<void> => {
    if (wakeRef.current) return wakeRef.current;
    const lifetime = lifetimeRef.current;
    if (!lifetime) return Promise.reject(toApiError(null));

    setBackend("checking");
    const attempt: Promise<void> = waitForBackend(lifetime.signal).then(
      () => {
        lastOkRef.current = Date.now();
        if (wakeRef.current === attempt) wakeRef.current = null;
        setBackend("ready");
      },
      (reason: unknown) => {
        if (wakeRef.current === attempt) wakeRef.current = null;
        if (!isAbortError(reason)) setBackend("unreachable");
        throw toApiError(reason);
      },
    );
    wakeRef.current = attempt;
    return attempt;
  }, []);

  // Start warming as soon as the page opens, so the server is usually ready
  // by the time the notes are pasted.
  useEffect(() => {
    const lifetime = new AbortController();
    lifetimeRef.current = lifetime;
    wake().catch(() => undefined); // the outcome is reflected in `backend`
    return () => {
      lifetime.abort();
      lifetimeRef.current = null;
      wakeRef.current = null;
      requestRef.current?.abort();
    };
  }, [wake]);

  const generate = useCallback(
    async (input: GenerateInput): Promise<readonly CardDraft[] | null> => {
      const controller = new AbortController();
      requestRef.current = controller;
      setError(null);

      try {
        if (Date.now() - lastOkRef.current > WARM_TTL_MS) {
          setPhase("waking");
          await raceAbort(wake(), controller.signal);
        }
        setPhase("generating");
        const drafts = await generateCards(input, controller.signal);
        lastOkRef.current = Date.now();
        return drafts;
      } catch (reason) {
        const apiError = toApiError(reason);
        if (apiError.kind !== "aborted") setError(apiError);
        return null;
      } finally {
        if (requestRef.current === controller) requestRef.current = null;
        setPhase("idle");
      }
    },
    [wake],
  );

  const cancel = useCallback(() => requestRef.current?.abort(), []);
  const retryWake = useCallback(() => {
    wake().catch(() => undefined);
  }, [wake]);
  const clearError = useCallback(() => setError(null), []);

  return { backend, phase, error, generate, cancel, retryWake, clearError };
}
