import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

/** Shown when a query succeeds but returns no results. */
export function EmptyState({
  title = "No operations found",
  description = "Try adjusting your search or filters.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-slate-100">
        <Inbox className="size-6 text-slate-400" />
      </span>
      <p className="mt-4 text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}
