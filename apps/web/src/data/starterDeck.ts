import type { Flashcard } from "../types";

const base = {
  studySetId: "starter",
  difficulty: "unrated",
  bookmarked: false,
  createdAt: "2026-01-01T00:00:00.000Z",
} as const;

export const STARTER_DECK: readonly Flashcard[] = [
  {
    ...base,
    id: "starter-1",
    question: "What is spaced repetition?",
    answer: "Reviewing a card at growing intervals instead of all at once.",
    explanation:
      "Each successful recall lets you wait longer before the next review, so effort stays low while memory stays strong.",
    tags: ["learning"],
  },
  {
    ...base,
    id: "starter-2",
    question: "Why try to answer before flipping the card?",
    answer:
      "Pulling an answer from memory strengthens it more than rereading does.",
    explanation:
      "This is retrieval practice. Even a wrong guess helps, because the correct answer sticks better afterwards.",
    tags: ["learning"],
  },
  {
    ...base,
    id: "starter-3",
    question: "What makes a good flashcard question?",
    answer: "It asks for one specific idea and has one clear answer.",
    explanation:
      "If a card needs a paragraph to answer, split it into smaller cards.",
    tags: ["cards"],
  },
  {
    ...base,
    id: "starter-4",
    question: "How should you schedule your reviews?",
    answer: "In short, regular sessions, shortly before you would forget.",
    explanation:
      "Several 15-minute sessions across a week beat one long session the night before a test (the spacing effect).",
    tags: ["learning", "habits"],
  },
];
