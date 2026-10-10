import { Suspense, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ErrorBoundary } from "../../../components/states/ErrorBoundary";
import { ErrorState } from "../../../components/states/ErrorState";
import { useOperations } from "../hooks/useOperations";
import { toView, type OperationView } from "../utils/operationView";
import { OperationsStats } from "../components/OperationsStats";
import { OperationsToolbar } from "../components/OperationsToolbar";
import { OperationsTable } from "../components/OperationsTable";
import { OperationsPagination } from "../components/OperationsPagination";
import { OperationsPageSkeleton } from "../components/OperationsPageSkeleton";
import { StatusModal } from "../components/StatusModal";
import { DetailsModal } from "../components/DetailsModal";
import type { OperationStatus } from "../types/operation.types";

export default function OperationsPage() {
  const queryClient = useQueryClient();

  return (
    // الخطأ (query failure) يظهر كـ ErrorState مع إعادة محاولة
    <ErrorBoundary
      fallback={(_error, reset) => (
        <ErrorState
          title="Failed to load operations"
          message="Failed to load operations. The server connection may have timed out. Please try again."
          onRetry={() => {
            // لازم نعيد ضبط الـ Query كمان، وإلا الخطأ المتخزن هيترمى تاني فوراً
            queryClient.resetQueries({ queryKey: ["operations"] });
            reset();
          }}
        />
      )}
    >
      {/* التحميل الأولي يعرض الـ Skeleton حتى تجهز البيانات */}
      <Suspense fallback={<OperationsPageSkeleton />}>
        <OperationsContent />
      </Suspense>
    </ErrorBoundary>
  );
}

function OperationsContent() {
  const {
    operations, total, stats, isFetching,
    filters, setSearch, setStatus, setSortBy, setPage,
    updateStatus, isUpdating, updateError,
  } = useOperations();

  const [searchInput, setSearchInput] = useState(filters.search);
  const [details, setDetails] = useState<OperationView | null>(null);
  const [editing, setEditing] = useState<OperationView | null>(null);

  // تأخير البحث (Debounce) قبل إرساله للـ URL عبر الـ Hook
  useEffect(() => {
    if (searchInput === filters.search) return;
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, setSearch]);

  const rows = useMemo(() => operations.map(toView), [operations]);

  const grandTotal = Object.values(stats).reduce((sum, count) => sum + count, 0);
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));
  const safePage = Math.min(filters.page, totalPages);

  const handleSave = (nextStatus: OperationStatus) => {
    if (!editing) return;
    updateStatus(
      { id: editing.id, newStatus: nextStatus },
      {
        onSuccess: () => {
          setDetails((current) => (current?.id === editing.id ? { ...current, status: nextStatus } : current));
          setEditing(null);
        },
      }
    );
  };

  return (
    <>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">Operations overview</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Monitor and manage {grandTotal.toLocaleString("en-US")} operational records across all teams.
            {isFetching && <span className="ml-1 text-xs text-teal-700">Updating…</span>}
          </p>
        </div>
      </div>

      <OperationsStats stats={stats} />

      <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <OperationsToolbar
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          status={filters.status}
          onStatusChange={setStatus}
          sortBy={filters.sortBy}
          onSortByChange={setSortBy}
        />

        <OperationsTable rows={rows} isUpdating={isUpdating} onView={setDetails} onEdit={setEditing} />

        <OperationsPagination
          page={safePage}
          totalPages={totalPages}
          total={total}
          limit={filters.limit}
          onPageChange={setPage}
        />
      </section>

      {details && <DetailsModal operation={details} onClose={() => setDetails(null)} onEdit={() => setEditing(details)} />}
      {editing && (
        <StatusModal
          operation={editing}
          isSaving={isUpdating}
          error={updateError?.message}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
