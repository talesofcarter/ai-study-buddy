import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  readStore,
  storageKey,
  writeStore,
  type StorageSchema,
} from "../lib/storage";

/**
 * useState backed by localStorage. Schemas must be module-level constants.
 * Stays in sync across tabs via the `storage` event.
 */
export function useStoredState<T>(
  schema: StorageSchema<T>,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readStore(schema));
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    writeStore(schema, value);
  }, [schema, value]);

  useEffect(() => {
    const key = storageKey(schema);
    const handleStorage = (event: StorageEvent): void => {
      if (event.storageArea !== window.localStorage) return;
      if (event.key !== null && event.key !== key) return; // null = storage cleared
      setValue(readStore(schema));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [schema]);

  return [value, setValue];
}
