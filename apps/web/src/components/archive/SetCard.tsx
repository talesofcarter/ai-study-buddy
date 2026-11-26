import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { subjectLabel } from "../../data/subjects";
import { formatDate, plural } from "../../lib/format";
import type { SetSummary } from "../../types";
import { Highlight } from "../ui/Highlight";
import { MasteryBar } from "./MasteryBar";

interface SetCardProps {
  summary: SetSummary;
  query: string;
}

export function SetCard({ summary, query }: SetCardProps) {
  const { set, total, matches, counts } = summary;
  const easyShare = total > 0 ? Math.round((counts.easy / total) * 100) : 0;

  return (
    <li>
      <Link
        to={`/archive/${set.id}`}
        className="group flex h-full flex-col gap-4 rounded-card border border-line/25 bg-surface p-5 shadow-card transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        <div className="flex flex-col gap-1">
          <h2 className="font-card text-xl font-semibold leading-snug">
            <Highlight text={set.title} query={query} />
          </h2>
          <p className="text-sm text-muted">
            {plural(total, "card")} · {formatDate(set.createdAt)}
          </p>
        </div>

        {set.subjects.length > 0 ? (
          <ul aria-label="Subjects" className="flex flex-wrap gap-1.5">
            {set.subjects.map((id) => (
              <li
                key={id}
                className="rounded-full border border-line/30 px-2.5 text-xs text-muted"
              >
                {subjectLabel(id)}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex flex-col gap-2">
          <MasteryBar counts={counts} />
          <div className="flex items-center justify-between gap-2 text-sm text-muted">
            <span>{easyShare}% easy</span>
            {matches > 0 ? (
              <span className="font-bold text-ink">
                {plural(matches, "matching card")}
              </span>
            ) : (
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden="true"
              />
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
