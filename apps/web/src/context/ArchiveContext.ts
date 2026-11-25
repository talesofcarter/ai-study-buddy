import { createContext } from "react";
import type { Flashcard, StudySet } from "../types";

export interface ArchiveApi {
  readonly sets: readonly StudySet[];
  readonly cards: readonly Flashcard[];
  addSet: (set: StudySet, cards: readonly Flashcard[]) => void;
  removeSet: (setId: string) => void;
}

export const ArchiveContext = createContext<ArchiveApi | null>(null);
