import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-card border border-dashed border-line/40 p-6 sm:p-8">
      <h2 className="font-card text-xl font-semibold">{title}</h2>
      <p className="text-muted">{description}</p>
      {action}
    </div>
  );
}
