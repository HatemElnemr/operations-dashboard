import { Skeleton } from "../../../components/ui/Skeleton";

/** Suspense fallback: mirrors the page layout (stats cards + toolbar + table rows). */
export function OperationsPageSkeleton() {
  return (
    <div role="status" aria-label="Loading operations">
      <span className="sr-only">Loading operations…</span>

      <div className="mb-7">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      </div>

      <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <article key={index} className="rounded-xl border border-slate-200 bg-white p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-7 w-20" />
            <Skeleton className="mt-5 h-4 w-full" />
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 xl:flex-row xl:items-center">
          <div>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-2 h-3.5 w-64" />
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Skeleton className="h-9 w-65" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <div>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 border-b border-slate-100 px-5 py-3.5">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-3.5 w-44" />
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="ml-auto h-6 w-28" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
