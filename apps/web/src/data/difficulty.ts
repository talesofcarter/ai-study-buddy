import type { Difficulty, Rating } from "../types";

export interface RatingMeta {
  readonly id: Rating;
  readonly label: string;
  readonly shortcut: string;
  readonly text: string;
  readonly dot: string;
}

export const RATINGS: readonly RatingMeta[] = [
  {
    id: "easy",
    label: "Easy",
    shortcut: "1",
    text: "text-easy",
    dot: "bg-easy",
  },
  {
    id: "medium",
    label: "Medium",
    shortcut: "2",
    text: "text-medium",
    dot: "bg-medium",
  },
  {
    id: "hard",
    label: "Hard",
    shortcut: "3",
    text: "text-hard",
    dot: "bg-hard",
  },
];

export const DIFFICULTY_RANK: Record<Difficulty, number> = {
  hard: 0,
  medium: 1,
  unrated: 2,
  easy: 3,
};
