import type { Subject, SubjectId } from "../types";

export const SUBJECTS: readonly Subject[] = [
  { id: "math", label: "Math" },
  { id: "science", label: "Science" },
  { id: "history", label: "History" },
  { id: "language", label: "Language" },
  { id: "cs", label: "Computer Science" },
  { id: "biology", label: "Biology" },
  { id: "physics", label: "Physics" },
  { id: "chemistry", label: "Chemistry" },
  { id: "general", label: "General" },
];

const IDS: ReadonlySet<string> = new Set(SUBJECTS.map((subject) => subject.id));

export function isSubjectId(value: unknown): value is SubjectId {
  return typeof value === "string" && IDS.has(value);
}

export function subjectLabel(id: SubjectId): string {
  return SUBJECTS.find((subject) => subject.id === id)?.label ?? id;
}
