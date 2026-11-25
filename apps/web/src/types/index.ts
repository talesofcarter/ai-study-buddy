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
