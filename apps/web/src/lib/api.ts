import type { CardDraft, SubjectId } from "../types";
import { isRecord } from "./guards";

const DEFAULT_BASE_URL = "https://ai-study-buddy-6.onrender.com/api";
const configuredBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL = (
  typeof configuredBaseUrl === "string" && configuredBaseUrl.length > 0
    ? configuredBaseUrl
    : DEFAULT_BASE_URL
).replace(/\/+$/, "");

/** A cold Render instance can take about a minute to boot. */
const WAKE_ATTEMPT_TIMEOUT_MS = 10_000;
const WAKE_RETRY_DELAY_MS = 2_000;
const WAKE_BUDGET_MS = 90_000;
const GENERATE_TIMEOUT_MS = 90_000;

export type ApiErrorKind =
  | "aborted" // the person cancelled, or the page went away
  | "timeout"
  | "offline" // network failure, CORS, DNS
  | "unreachable" // the server never woke up within the budget
  | "rejected" // 4xx
  | "server" // 5xx
  | "invalid"; // 2xx, but not something we can use

export class ApiError extends Error {
  readonly kind: ApiErrorKind;

  constructor(kind: ApiErrorKind, message: string) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
  }
}

export interface GenerateInput {
  readonly notes: string;
  readonly subjects: readonly SubjectId[];
}

const cancelled = (): ApiError => new ApiError("aborted", "Cancelled.");

export function toApiError(reason: unknown): ApiError {
  return reason instanceof ApiError
    ? reason
    : new ApiError(
        "server",
        "Something unexpected went wrong. Please try again.",
      );
}

export function isAbortError(reason: unknown): boolean {
  return reason instanceof ApiError && reason.kind === "aborted";
}

/** Rejects with an abort error as soon as `signal` fires, without cancelling `promise`. */
export function raceAbort<T>(
  promise: Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) {
      reject(cancelled());
      return;
    }
    const onAbort = (): void => reject(cancelled());
    signal.addEventListener("abort", onAbort, { once: true });
    promise
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", onAbort));
  });
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(cancelled());
      return;
    }
    function onAbort(): void {
      window.clearTimeout(timer);
      reject(cancelled());
    }
    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null; // e.g. an HTML 502 page from the host while it boots
  }
}

function httpError(status: number, payload: unknown): ApiError {
  const serverMessage =
    isRecord(payload) && typeof payload.error === "string"
      ? payload.error
      : null;

  if (status === 429) {
    return new ApiError(
      "rejected",
      "Too many requests. Wait a moment and try again.",
    );
  }
  if (status >= 400 && status < 500) {
    return new ApiError(
      "rejected",
      serverMessage ?? "The server couldn't accept that request.",
    );
  }
  return new ApiError(
    "server",
    "The generator hit a problem on the server. Try again in a moment.",
  );
}

interface RequestOptions {
  readonly method?: "GET" | "POST";
  readonly body?: unknown;
  readonly signal?: AbortSignal;
  readonly timeoutMs: number;
}

async function request(
  path: string,
  { method = "GET", body, signal, timeoutMs }: RequestOptions,
): Promise<unknown> {
  if (signal?.aborted) throw cancelled();

  const controller = new AbortController();
  const flags = { timedOut: false };
  const timer = window.setTimeout(() => {
    flags.timedOut = true;
    controller.abort();
  }, timeoutMs);
  const forwardAbort = (): void => controller.abort();
  signal?.addEventListener("abort", forwardAbort, { once: true });

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers:
        body === undefined
          ? { Accept: "application/json" }
          : { Accept: "application/json", "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = await readJson(response);
    if (!response.ok) throw httpError(response.status, payload);
    return payload;
  } catch (reason) {
    if (reason instanceof ApiError) throw reason;
    if (flags.timedOut) {
      throw new ApiError(
        "timeout",
        "The server took too long to answer. Your notes are still here, so you can try again.",
      );
    }
    if (controller.signal.aborted) throw cancelled();
    throw new ApiError(
      "offline",
      "Can't reach the server. Check your connection and try again.",
    );
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", forwardAbort);
  }
}

/**
 * Polls /health until the backend answers. A sleeping Render instance holds or
 * rejects early requests while it boots, so short attempts are retried until
 * the overall budget runs out.
 */
export async function waitForBackend(signal?: AbortSignal): Promise<void> {
  const deadline = Date.now() + WAKE_BUDGET_MS;

  for (;;) {
    try {
      await request("/health", { timeoutMs: WAKE_ATTEMPT_TIMEOUT_MS, signal });
      return;
    } catch (reason) {
      if (isAbortError(reason)) throw toApiError(reason);
      if (Date.now() + WAKE_RETRY_DELAY_MS >= deadline) {
        throw new ApiError(
          "unreachable",
          "The server didn't wake up in time. Give it a minute and try again.",
        );
      }
      await delay(WAKE_RETRY_DELAY_MS, signal);
    }
  }
}

function parseDraft(raw: unknown): CardDraft | null {
  if (!isRecord(raw)) return null;
  const question = typeof raw.question === "string" ? raw.question.trim() : "";
  const answer = typeof raw.answer === "string" ? raw.answer.trim() : "";
  if (question.length === 0 || answer.length === 0) return null;

  const explanation =
    typeof raw.explanation === "string" ? raw.explanation.trim() : "";
  const tags = Array.isArray(raw.tags)
    ? raw.tags.flatMap((tag: unknown) =>
        typeof tag === "string" && tag.trim().length > 0 ? [tag.trim()] : [],
      )
    : [];

  return { question, answer, explanation, tags };
}

/** Never retried automatically: a retry could generate (and bill) a duplicate set. */
export async function generateCards(
  input: GenerateInput,
  signal?: AbortSignal,
): Promise<CardDraft[]> {
  const payload = await request("/generate", {
    method: "POST",
    body: { text: input.notes, subjects: input.subjects },
    timeoutMs: GENERATE_TIMEOUT_MS,
    signal,
  });

  const rawCards: unknown[] =
    isRecord(payload) && Array.isArray(payload.flashcards)
      ? payload.flashcards
      : [];
  const drafts = rawCards.flatMap((raw) => {
    const draft = parseDraft(raw);
    return draft ? [draft] : [];
  });

  if (drafts.length === 0) {
    throw new ApiError(
      "invalid",
      "The generator didn't return any usable cards. Try adding more detail to your notes.",
    );
  }
  return drafts;
}
