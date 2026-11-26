import { createContext } from "react";
import type { Difficulty, Flashcard, StudySet } from "../types";

export interface ArchiveApi {
  readonly sets: readonly StudySet[];
  readonly cards: readonly Flashcard[];
  addSet: (set: StudySet, cards: readonly Flashcard[]) => void;
  removeSet: (setId: string) => void;
  renameSet: (setId: string, title: string) => void;
  removeCard: (cardId: string) => void;
  rateCard: (cardId: string, difficulty: Difficulty) => void;
  toggleBookmark: (cardId: string) => void;
}

export const ArchiveContext = createContext<ArchiveApi | null>(null);
