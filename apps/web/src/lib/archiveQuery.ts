import { DIFFICULTY_RANK } from "../data/difficulty";
import { SUBJECTS } from "../data/subjects";
import type {
  CardFilter,
  CardSort,
  DifficultyCounts,
  Flashcard,
  SetFilter,
  SetSummary,
  StudySet,
  SubjectId,
} from "../types";

export function normalizeQuery(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Every word of the (normalized) query must appear somewhere in the text. */
export function matchesTerms(text: string, query: string): boolean {
  if (query.length === 0) return true;
  const haystack = text.toLowerCase();
  return query.split(" ").every((term) => haystack.includes(term));
}

function cardText(card: Flashcard): string {
  return `${card.question} ${card.answer} ${card.explanation} ${card.tags.join(" ")}`;
}

export function countByDifficulty(
  cards: readonly Flashcard[],
): DifficultyCounts {
  const counts = { unrated: 0, easy: 0, medium: 0, hard: 0 };
  for (const card of cards) counts[card.difficulty] += 1;
  return counts;
}

export function filterCards(
  cards: readonly Flashcard[],
  filter: CardFilter,
): Flashcard[] {
  const query = normalizeQuery(filter.query);
  return cards.filter(
    (card) =>
      (filter.difficulty === "all" || card.difficulty === filter.difficulty) &&
      (!filter.bookmarkedOnly || card.bookmarked) &&
      matchesTerms(cardText(card), query),
  );
}

export function sortCards(
  cards: readonly Flashcard[],
  sort: CardSort,
): readonly Flashcard[] {
  if (sort === "original") return cards;
  const direction = sort === "hardest" ? 1 : -1;
  return [...cards].sort(
    (a, b) =>
      direction *
      (DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty]),
  );
}

export function summarizeSets(
  sets: readonly StudySet[],
  cards: readonly Flashcard[],
  filter: SetFilter,
): SetSummary[] {
  const query = normalizeQuery(filter.query);

  const bySet = new Map<string, Flashcard[]>();
  for (const card of cards) {
    const list = bySet.get(card.studySetId);
    if (list) list.push(card);
    else bySet.set(card.studySetId, [card]);
  }

  const summaries: SetSummary[] = [];
  for (const set of sets) {
    if (filter.subject !== "all" && !set.subjects.includes(filter.subject)) {
      continue;
    }
    const setCards = bySet.get(set.id) ?? [];
    const matching =
      query.length > 0
        ? setCards.filter((card) => matchesTerms(cardText(card), query))
        : [];
    if (
      query.length > 0 &&
      !matchesTerms(set.title, query) &&
      matching.length === 0
    ) {
      continue;
    }
    summaries.push({
      set,
      total: setCards.length,
      matches: matching.length,
      counts: countByDifficulty(setCards),
    });
  }

  switch (filter.sort) {
    case "oldest":
      return summaries.sort((a, b) =>
        a.set.createdAt.localeCompare(b.set.createdAt),
      );
    case "title":
      return summaries.sort((a, b) =>
        a.set.title.localeCompare(b.set.title, undefined, {
          sensitivity: "base",
        }),
      );
    case "largest":
      return summaries.sort((a, b) => b.total - a.total);
    case "newest":
      return summaries.sort((a, b) =>
        b.set.createdAt.localeCompare(a.set.createdAt),
      );
  }
}

/** Subjects that at least one set uses, in the order they appear in the picker. */
export function subjectsInUse(
  sets: readonly StudySet[],
): { id: SubjectId; count: number }[] {
  return SUBJECTS.flatMap(({ id }) => {
    const count = sets.filter((set) => set.subjects.includes(id)).length;
    return count > 0 ? [{ id, count }] : [];
  });
}
