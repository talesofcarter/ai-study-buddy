import { isSubjectId } from "../data/subjects";
import type {
  Archive,
  CardDraft,
  Difficulty,
  Flashcard,
  NewStudySet,
  StudySet,
  SubjectId,
} from "../types";
import { isRecord } from "./guards";
import { createId } from "./id";
import type { StorageSchema } from "./storage";

export const EMPTY_ARCHIVE: Archive = { sets: [], cards: [] };

const TITLE_MAX = 48;
const DIFFICULTIES: readonly string[] = ["unrated", "easy", "medium", "hard"];

function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === "string" && DIFFICULTIES.includes(value);
}

function parseList<T>(
  raw: unknown,
  parseItem: (item: unknown) => T | null,
): T[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item: unknown) => {
    const parsed = parseItem(item);
    return parsed ? [parsed] : [];
  });
}

function parseSet(raw: unknown): StudySet | null {
  if (!isRecord(raw)) return null;
  const { id, title, subjects, createdAt } = raw;
  if (
    typeof id !== "string" ||
    typeof title !== "string" ||
    typeof createdAt !== "string" ||
    !Array.isArray(subjects)
  ) {
    return null;
  }
  return { id, title, subjects: subjects.filter(isSubjectId), createdAt };
}

function parseCard(raw: unknown): Flashcard | null {
  if (!isRecord(raw)) return null;
  const { id, studySetId, question, answer, createdAt } = raw;
  if (
    typeof id !== "string" ||
    typeof studySetId !== "string" ||
    typeof question !== "string" ||
    typeof answer !== "string" ||
    typeof createdAt !== "string"
  ) {
    return null;
  }
  return {
    id,
    studySetId,
    question,
    answer,
    explanation: typeof raw.explanation === "string" ? raw.explanation : "",
    tags: Array.isArray(raw.tags)
      ? raw.tags.filter(
          (tag: unknown): tag is string => typeof tag === "string",
        )
      : [],
    difficulty: isDifficulty(raw.difficulty) ? raw.difficulty : "unrated",
    bookmarked: raw.bookmarked === true,
    createdAt,
  };
}

/** One archive per profile. Create the schema once per email (see ArchiveProvider). */
export function createArchiveSchema(email: string): StorageSchema<Archive> {
  return {
    key: `archive:${email}`,
    version: 1,
    fallback: EMPTY_ARCHIVE,
    parse: (raw) => {
      if (!isRecord(raw)) return null;
      const sets = parseList(raw.sets, parseSet);
      const setIds = new Set(sets.map((set) => set.id));
      // Drop orphaned cards so a damaged entry can't break the UI later.
      const cards = parseList(raw.cards, parseCard).filter((card) =>
        setIds.has(card.studySetId),
      );
      return { sets, cards };
    },
  };
}

function deriveTitle(notes: string): string {
  const firstLine =
    notes
      .split(/\r?\n/)
      .map((line) => line.replace(/^[#>*\-\s]+/, "").trim())
      .find((line) => line.length > 0) ?? "";
  if (firstLine.length === 0) return "Untitled set";
  return firstLine.length > TITLE_MAX
    ? `${firstLine.slice(0, TITLE_MAX - 1).trimEnd()}…`
    : firstLine;
}

interface SetInput {
  readonly title: string;
  readonly notes: string;
  readonly subjects: readonly SubjectId[];
}

/** Gives generator output a client-side identity so ids never depend on the backend. */
export function buildStudySet(
  input: SetInput,
  drafts: readonly CardDraft[],
): NewStudySet {
  const createdAt = new Date().toISOString();
  const setId = createId();
  const title = input.title.trim() || deriveTitle(input.notes);

  const cards = drafts.map(
    (draft): Flashcard => ({
      id: createId(),
      studySetId: setId,
      question: draft.question,
      answer: draft.answer,
      explanation: draft.explanation,
      tags: draft.tags.length > 0 ? draft.tags : input.subjects,
      difficulty: "unrated",
      bookmarked: false,
      createdAt,
    }),
  );

  return {
    set: { id: setId, title, subjects: input.subjects, createdAt },
    cards,
  };
}

export function addSetToArchive(
  archive: Archive,
  set: StudySet,
  cards: readonly Flashcard[],
): Archive {
  return {
    sets: [set, ...archive.sets],
    cards: [...archive.cards, ...cards],
  };
}

export function removeSetFromArchive(archive: Archive, setId: string): Archive {
  return {
    sets: archive.sets.filter((set) => set.id !== setId),
    cards: archive.cards.filter((card) => card.studySetId !== setId),
  };
}
