import { useCallback, useMemo, type ReactNode } from "react";
import { StorageWarning } from "../components/layout/StorageWarning";
import {
  addSetToArchive,
  createArchiveSchema,
  removeCardFromArchive,
  removeSetFromArchive,
  renameSetInArchive,
  rateCardInArchive,
  toggleBookmarkInArchive,
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
  const [archive, setArchive, saveFailed] = useStoredState(schema);

  const addSet = useCallback<ArchiveApi["addSet"]>(
    (set, cards) =>
      setArchive((current) => addSetToArchive(current, set, cards)),
    [setArchive],
  );
  const removeSet = useCallback<ArchiveApi["removeSet"]>(
    (setId) => setArchive((current) => removeSetFromArchive(current, setId)),
    [setArchive],
  );
  const renameSet = useCallback<ArchiveApi["renameSet"]>(
    (setId, title) =>
      setArchive((current) => renameSetInArchive(current, setId, title)),
    [setArchive],
  );
  const removeCard = useCallback<ArchiveApi["removeCard"]>(
    (cardId) => setArchive((current) => removeCardFromArchive(current, cardId)),
    [setArchive],
  );
  const rateCard = useCallback<ArchiveApi["rateCard"]>(
    (cardId, difficulty) =>
      setArchive((current) => rateCardInArchive(current, cardId, difficulty)),
    [setArchive],
  );
  const toggleBookmark = useCallback<ArchiveApi["toggleBookmark"]>(
    (cardId) =>
      setArchive((current) => toggleBookmarkInArchive(current, cardId)),
    [setArchive],
  );

  const value = useMemo<ArchiveApi>(
    () => ({
      sets: archive.sets,
      cards: archive.cards,
      addSet,
      removeSet,
      renameSet,
      removeCard,
      rateCard,
      toggleBookmark,
    }),
    [
      archive,
      addSet,
      removeSet,
      renameSet,
      removeCard,
      rateCard,
      toggleBookmark,
    ],
  );

  return (
    <ArchiveContext.Provider value={value}>
      {saveFailed ? <StorageWarning /> : null}
      {children}
    </ArchiveContext.Provider>
  );
}
