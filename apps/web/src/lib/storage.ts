import { isRecord } from "./guards";

const NAMESPACE = "asb:v2";

export interface StorageSchema<T> {
  readonly key: string;
  /** Bump when the stored shape changes; `parse` receives the stored version. */
  readonly version: number;
  readonly fallback: T;
  /** Validate (and migrate) untrusted data. Return null when it is unusable. */
  readonly parse: (raw: unknown, storedVersion: number) => T | null;
}

interface Envelope {
  readonly version: number;
  readonly data: unknown;
}

export function storageKey(schema: { readonly key: string }): string {
  return `${NAMESPACE}:${schema.key}`;
}

function parseEnvelope(raw: string): Envelope | null {
  const value: unknown = JSON.parse(raw);
  if (
    !isRecord(value) ||
    typeof value.version !== "number" ||
    !("data" in value)
  ) {
    return null;
  }
  return { version: value.version, data: value.data };
}

/** Never throws: missing, corrupt or blocked storage all resolve to the fallback. */
export function readStore<T>(schema: StorageSchema<T>): T {
  try {
    const raw = window.localStorage.getItem(storageKey(schema));
    if (raw === null) return schema.fallback;
    const envelope = parseEnvelope(raw);
    if (!envelope) return schema.fallback;
    return schema.parse(envelope.data, envelope.version) ?? schema.fallback;
  } catch {
    return schema.fallback;
  }
}

/** Returns false when the write fails (private mode, quota exceeded, blocked). */
export function writeStore<T>(schema: StorageSchema<T>, value: T): boolean {
  try {
    const envelope: Envelope = { version: schema.version, data: value };
    window.localStorage.setItem(storageKey(schema), JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

export function removeStore(schema: { readonly key: string }): void {
  try {
    window.localStorage.removeItem(storageKey(schema));
  } catch {
    /* nothing to clean up if storage is unavailable */
  }
}
