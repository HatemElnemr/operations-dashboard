import { Icon } from "../../../components/ui/Icon";
import type { OperationStatus } from "../types/operation.types";

interface OperationsToolbarProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  status: OperationStatus | "All";
  onStatusChange: (value: OperationStatus | "All") => void;
  sortBy: "createdAt" | "updatedAt";
  onSortByChange: (value: "createdAt" | "updatedAt") => void;
}

export function OperationsToolbar({
  searchInput, onSearchChange, status, onStatusChange, sortBy, onSortByChange,
}: OperationsToolbarProps) {
  return (
    <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 xl:flex-row xl:items-center">
      <div>
        <h2 className="font-semibold text-slate-900">All operations</h2>
        <p className="mt-0.5 text-xs text-slate-500">Search, filter, and update operational records</p>
      </div>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <label className="relative sm:w-65">
          <span className="sr-only">Search by operation ID or name</span>
          <Icon name="search" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by ID or name"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
          />
        </label>
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(event) => onStatusChange(event.target.value as OperationStatus | "All")}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 outline-none focus:border-teal-600"
        >
          <option value="All">All statuses</option><option>Pending</option><option>Running</option><option>Completed</option><option>Failed</option>
        </select>
        <select
          aria-label="Sort operations"
          value={sortBy}
          onChange={(event) => onSortByChange(event.target.value as "createdAt" | "updatedAt")}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 outline-none focus:border-teal-600"
        >
          <option value="createdAt">Created date</option><option value="updatedAt">Updated date</option>
        </select>
      </div>
    </div>
  );
}
