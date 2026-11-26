import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { MasteryBar } from "../archive/MasteryBar";
import { SetCard } from "../archive/SetCard";
import { Button, buttonStyles } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { FilterChips, type ChipOption } from "../ui/FilterChips";
import { SearchField } from "../ui/SearchField";
import { SelectField } from "../ui/SelectField";
import { isSubjectId, subjectLabel } from "../../data/subjects";
import { useArchive } from "../../hooks/useArchive";
import {
  countByDifficulty,
  normalizeQuery,
  subjectsInUse,
  summarizeSets,
} from "../../lib/archiveQuery";
import { plural } from "../../lib/format";
import type { SetSort, SubjectId } from "../../types";

const SORT_OPTIONS: readonly { value: SetSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title", label: "Title A–Z" },
  { value: "largest", label: "Most cards" },
];

function parseSort(raw: string | null): SetSort {
  return SORT_OPTIONS.find((option) => option.value === raw)?.value ?? "newest";
}

function parseSubject(raw: string | null): SubjectId | "all" {
  return isSubjectId(raw) ? raw : "all";
}

export function ArchiveScreen() {
  const { sets, cards } = useArchive();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const subject = parseSubject(params.get("subject"));
  const sort = parseSort(params.get("sort"));
  const deferredQuery = useDeferredValue(query);
  const highlight = normalizeQuery(deferredQuery);

  const update = useCallback(
    (key: string, value: string, fallback: string): void => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (value === fallback) next.delete(key);
          else next.set(key, value);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const subjectOptions = useMemo<readonly ChipOption<SubjectId | "all">[]>(
    () => [
      { value: "all", label: "All", count: sets.length },
      ...subjectsInUse(sets).map(({ id, count }) => ({
        value: id,
        label: subjectLabel(id),
        count,
      })),
    ],
    [sets],
  );

  const activeSubject = subjectOptions.some(
    (option) => option.value === subject,
  )
    ? subject
    : "all";

  const summaries = useMemo(
    () =>
      summarizeSets(sets, cards, {
        query: deferredQuery,
        subject: activeSubject,
        sort,
      }),
    [sets, cards, deferredQuery, activeSubject, sort],
  );
  const totals = useMemo(() => countByDifficulty(cards), [cards]);

  const hasFilters = query.trim().length > 0 || activeSubject !== "all";

  const clearFilters = (): void => {
    setQuery("");
    setParams({}, { replace: true });
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-14 lg:py-14">
      <section
        aria-labelledby="archive-title"
        className="flex flex-col items-start gap-4"
      >
        <span className="highlight text-sm font-bold leading-8">Archive</span>
        <h1
          id="archive-title"
          className="font-card text-3xl font-semibold leading-tight"
        >
          Your study sets
        </h1>
        <p>
          Every set you generate is saved in this browser, for this profile
          only.
        </p>
        {sets.length > 0 ? (
          <div className="flex w-full flex-col gap-2">
            <MasteryBar counts={totals} />
            <p className="text-sm tabular-nums text-muted">
              {plural(sets.length, "set")} · {plural(cards.length, "card")}
            </p>
          </div>
        ) : null}
        <Link to="/generate" className={buttonStyles("primary")}>
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          New set
        </Link>
      </section>

      <section aria-label="Saved sets" className="flex min-w-0 flex-col gap-5">
        {sets.length === 0 ? (
          <EmptyState
            title="Nothing saved yet"
            description="Generate your first set and it will appear here, ready to search, rate and revisit."
            action={
              <Link to="/generate" className={buttonStyles("secondary")}>
                Go to the generator
              </Link>
            }
          />
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <SearchField
                label="Search the archive"
                placeholder="Search sets, questions, answers…"
                value={query}
                onChange={(value) => {
                  setQuery(value);
                  update("q", value, "");
                }}
              />
              <FilterChips
                label="Filter by subject"
                options={subjectOptions}
                value={activeSubject}
                onChange={(value) => update("subject", value, "all")}
              />
              <div className="flex justify-end">
                <SelectField
                  label="Sort"
                  value={sort}
                  options={SORT_OPTIONS}
                  onChange={(value) => update("sort", value, "newest")}
                />
              </div>
            </div>

            <p
              role="status"
              aria-live="polite"
              className="text-sm tabular-nums text-muted"
            >
              Showing {summaries.length} of {plural(sets.length, "set")}
            </p>

            {summaries.length > 0 ? (
              <ul className="grid gap-4 sm:grid-cols-2">
                {summaries.map((summary) => (
                  <SetCard
                    key={summary.set.id}
                    summary={summary}
                    query={highlight}
                  />
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No sets match"
                description="Try different words, or remove a filter."
                action={
                  hasFilters ? (
                    <Button variant="secondary" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}
