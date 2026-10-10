import type { OperationStatus } from '../types/operation.types';

const statusStyle: Record<OperationStatus, { badge: string; dot: string }> = {
  Pending: { badge: "bg-amber-50 text-amber-700 ring-amber-600/20", dot: "bg-amber-500" },
  Running: { badge: "bg-teal-50 text-teal-700 ring-teal-600/20", dot: "bg-teal-600" },
  Completed: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-600" },
  Failed: { badge: "bg-red-50 text-red-700 ring-red-600/20", dot: "bg-red-500" },
};

export function StatusBadge({ status }: { status: OperationStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle[status].badge}`}>
      <span className={`size-1.5 rounded-full ${statusStyle[status].dot}`} />
      {status}
    </span>
  );
}