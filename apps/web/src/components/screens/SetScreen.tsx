import {
  useCallback,
  useDeferredValue,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bookmark, Focus, Trash2 } from "lucide-react";
import { CardCount } from "../archive/CardCount";
import { CardRow } from "../archive/CardRow";
import { MasteryBar } from "../archive/MasteryBar";
import { SetTitle } from "../archive/SetTitle";
import { FocusMode } from "../focus/FocusMode";
import { Button, buttonStyles } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EmptyState } from "../ui/EmptyState";
import { chipStyles, FilterChips, type ChipOption } from "../ui/FilterChips";
import { SearchField } from "../ui/SearchField";
import { SelectField } from "../ui/SelectField";
import { subjectLabel } from "../../data/subjects";
import { useArchive } from "../../hooks/useArchive";
import { useRetained } from "../../hooks/useRetained";
import {
  countByDifficulty,
  filterCards,
  normalizeQuery,
  sortCards,
} from "../../lib/archiveQuery";
import { formatDate, plural } from "../../lib/format";
import type { CardSort, Difficulty, Flashcard } from "../../types";

type Pending =
  | { readonly kind: "set" }
  | { readonly kind: "card"; readonly cardId: string }
  | null;

const NO_CARDS: readonly Flashcard[] = [];

const SORT_OPTIONS: readonly { value: CardSort; label: string }[] = [
  { value: "original", label: "Original order" },
  { value: "hardest", label: "Hardest first" },
  { value: "easiest", label: "Easiest first" },
];

export function SetScreen() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const {
    sets,
    cards,
    rateCard,
    toggleBookmark,
    removeCard,
    renameSet,
    removeSet,
  } = useArchive();

  const set = sets.find((candidate) => candidate.id === setId);
  const setCards = useMemo(
    () => cards.filter((card) => card.studySetId === setId),
    [cards, setId],
  );
  const live = useMemo(
    () => (set ? { set, cards: setCards } : null),
    [set, setCards],
  );
  // Keeps the page intact through its exit fade after the set is deleted.
  const data = useRetained(live);

  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [sort, setSort] = useState<CardSort>("original");
  const [pending, setPending] = useState<Pending>(null);
  const [focusing, setFocusing] = useState(false);
  const statusRef = useRef<HTMLParagraphElement>(null);

  const deferredQuery = useDeferredValue(query);
  const highlight = normalizeQuery(deferredQuery);
  const allCards = data?.cards ?? NO_CARDS;

  const visible = useMemo(
    () =>
      sortCards(
        filterCards(allCards, {
          query: deferredQuery,
          difficulty,
          bookmarkedOnly,
        }),
        sort,
      ),
    [allCards, deferredQuery, difficulty, bookmarkedOnly, sort],
  );
  const counts = useMemo(() => countByDifficulty(allCards), [allCards]);

  const requestDeleteCard = useCallback(
    (cardId: string) => setPending({ kind: "card", cardId }),
    [],
  );

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-20">
        <div className="max-w-xl">
          <EmptyState
            title="That set isn't in this archive"
            description="It may have been deleted, or it belongs to a different profile."
            action={
              <Link to="/archive" className={buttonStyles("secondary")}>
                Back to the archive
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const { set: current } = data;
  const total = allCards.length;
  const filtered =
    query.trim().length > 0 || difficulty !== "all" || bookmarkedOnly;

  const difficultyOptions: readonly ChipOption<Difficulty | "all">[] = [
    { value: "all", label: "All", count: total },
    { value: "unrated", label: "Unrated", count: counts.unrated },
    { value: "easy", label: "Easy", count: counts.easy },
    { value: "medium", label: "Medium", count: counts.medium },
    { value: "hard", label: "Hard", count: counts.hard },
  ];

  const clearFilters = (): void => {
    setQuery("");
    setDifficulty("all");
    setBookmarkedOnly(false);
  };

  const confirmDelete = (): void => {
    if (!pending) return;
    if (pending.kind === "set") {
      removeSet(current.id);
      navigate("/archive");
    } else {
      const wasLast = total === 1;
      removeCard(pending.cardId);
      if (wasLast) navigate("/archive");
      // The deleted row had focus; land on the result count instead of <body>.
      else window.requestAnimationFrame(() => statusRef.current?.focus());
    }
    setPending(null);
  };

  const dialog =
    pending?.kind === "set"
      ? {
          title: `Delete “${current.title}”?`,
          description: `This removes the set and its ${plural(total, "card")} from this profile's archive. This can't be undone.`,
          confirmLabel: "Delete set",
        }
      : {
          title: "Delete this card?",
          description:
            total === 1
              ? "This is the last card in the set, so the set will be removed too. This can't be undone."
              : "It will be removed from the set. This can't be undone.",
          confirmLabel: "Delete card",
        };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-14 lg:py-14">
      <section
        aria-labelledby="set-title"
        className="flex flex-col items-start gap-4"
      >
        <Link
          to="/archive"
          className="-ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-ctl px-1 text-sm font-bold text-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Archive
        </Link>

        <SetTitle
          title={current.title}
          onRename={(title) => renameSet(current.id, title)}
        />

        <p className="text-muted">
          {plural(total, "card")} · {formatDate(current.createdAt)}
          {current.subjects.length > 0
            ? ` · ${current.subjects.map(subjectLabel).join(" · ")}`
            : ""}
        </p>

        <div className="flex w-full flex-col gap-2">
          <MasteryBar counts={counts} />
          <p className="text-sm tabular-nums text-muted">
            {counts.easy} easy · {counts.medium} medium · {counts.hard} hard ·{" "}
            {counts.unrated} unrated
          </p>
        </div>

        <Button
          onClick={() => setFocusing(true)}
          disabled={visible.length === 0}
        >
          <Focus className="h-5 w-5" aria-hidden="true" />
          Focus mode{filtered ? ` (${visible.length})` : ""}
        </Button>
        <Button variant="danger" onClick={() => setPending({ kind: "set" })}>
          <Trash2 className="h-5 w-5" aria-hidden="true" />
          Delete set
        </Button>
      </section>

      <section aria-label="Cards" className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-3">
          <SearchField
            label="Search cards in this set"
            placeholder="Search questions, answers, tags…"
            value={query}
            onChange={setQuery}
          />
          <FilterChips
            label="Filter by difficulty"
            options={difficultyOptions}
            value={difficulty}
            onChange={setDifficulty}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              aria-pressed={bookmarkedOnly}
              onClick={() => setBookmarkedOnly((value) => !value)}
              className={chipStyles(bookmarkedOnly)}
            >
              <Bookmark className="h-4 w-4" aria-hidden="true" />
              Bookmarked
            </button>
            <SelectField
              label="Sort"
              value={sort}
              options={SORT_OPTIONS}
              onChange={setSort}
            />
          </div>
        </div>

        <CardCount ref={statusRef} shown={visible.length} total={total} />

        {visible.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {visible.map((card) => (
              <CardRow
                key={card.id}
                card={card}
                query={highlight}
                onRate={rateCard}
                onToggleBookmark={toggleBookmark}
                onDelete={requestDeleteCard}
              />
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No cards match"
            description="Try different words, or remove a filter."
            action={
              filtered ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        )}
      </section>

      <ConfirmDialog
        open={pending !== null}
        title={dialog.title}
        description={dialog.description}
        confirmLabel={dialog.confirmLabel}
        onConfirm={confirmDelete}
        onCancel={() => setPending(null)}
      />

      <AnimatePresence>
        {focusing ? (
          <FocusMode
            cards={visible}
            title={current.title}
            onRate={rateCard}
            onExit={() => setFocusing(false)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
