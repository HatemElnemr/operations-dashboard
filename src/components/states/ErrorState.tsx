import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/** Shown when a query or mutation fails. */
export function ErrorState({
  title = "Something went wrong",
  message = "Failed to load data. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" role="alert">
      <span className="grid size-12 place-items-center rounded-full bg-red-50">
        <AlertCircle className="size-6 text-red-500" />
      </span>
      <p className="mt-4 text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 max-w-md text-xs text-slate-500">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#153746] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0f2b37]"
        >
          <RefreshCw className="size-3.5" /> Try again
        </button>
      )}
    </div>
  );
}
