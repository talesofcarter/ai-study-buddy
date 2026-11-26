export type ThemeMode = "light" | "dark";

export type Difficulty = "unrated" | "easy" | "medium" | "hard";

export interface UserProfile {
  readonly name: string;
  readonly email: string;
  readonly createdAt: string; // ISO 8601
}

export interface Flashcard {
  readonly id: string;
  readonly studySetId: string;
  readonly question: string;
  readonly answer: string;
  readonly explanation: string;
  readonly tags: readonly string[];
  readonly difficulty: Difficulty;
  readonly bookmarked: boolean;
  readonly createdAt: string; // ISO 8601
}

export interface NavItem {
  readonly to: string;
  readonly label: string;
  readonly description: string;
  /** Remove once the page ships. */
  readonly status?: "soon";
}

export type SubjectId =
  | "math"
  | "science"
  | "history"
  | "language"
  | "cs"
  | "biology"
  | "physics"
  | "chemistry"
  | "general";

export interface Subject {
  readonly id: SubjectId;
  readonly label: string;
}

/** A group of cards generated together from one set of notes. */
export interface StudySet {
  readonly id: string;
  readonly title: string;
  readonly subjects: readonly SubjectId[];
  readonly createdAt: string; // ISO 8601
}

/** A card as returned by the generator, before the client gives it an identity. */
export interface CardDraft {
  readonly question: string;
  readonly answer: string;
  readonly explanation: string;
  readonly tags: readonly string[];
}

/** Everything one profile has saved. Flat arrays keep search/filter simple. */
export interface Archive {
  readonly sets: readonly StudySet[]; // newest first
  readonly cards: readonly Flashcard[];
}

export interface NewStudySet {
  readonly set: StudySet;
  readonly cards: readonly Flashcard[];
}
