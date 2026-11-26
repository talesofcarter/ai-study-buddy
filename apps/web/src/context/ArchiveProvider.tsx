import { useCallback, useMemo, type ReactNode } from "react";
import {
  addSetToArchive,
  createArchiveSchema,
  removeSetFromArchive,
} from "../lib/archive";
import { useStoredState } from "../hooks/useStoredState";
import { ArchiveContext, type ArchiveApi } from "./ArchiveContext";

interface ArchiveProviderProps {
  email: string;
  children: ReactNode;
}

/** Mount with key={email}: the stored state is read once per mount. */
export function ArchiveProvider({ email, children }: ArchiveProviderProps) {
  const schema = useMemo(() => createArchiveSchema(email), [email]);
  const [archive, setArchive] = useStoredState(schema);

  const addSet = useCallback<ArchiveApi["addSet"]>(
    (set, cards) =>
      setArchive((current) => addSetToArchive(current, set, cards)),
    [setArchive],
  );
  const removeSet = useCallback<ArchiveApi["removeSet"]>(
    (setId) => setArchive((current) => removeSetFromArchive(current, setId)),
    [setArchive],
  );

  const value = useMemo<ArchiveApi>(
    () => ({ sets: archive.sets, cards: archive.cards, addSet, removeSet }),
    [archive, addSet, removeSet],
  );

  return (
    <ArchiveContext.Provider value={value}>{children}</ArchiveContext.Provider>
  );
}
