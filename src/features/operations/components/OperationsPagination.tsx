import { useMemo } from "react";
import { Icon } from "../../../components/ui/Icon";

interface OperationsPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function OperationsPagination({ page, totalPages, total, limit, onPageChange }: OperationsPaginationProps) {
  // أزرار الصفحات: الأولى، الأخيرة، والمحاطة بالصفحة الحالية مع … بين الفجوات
  const pageNumbers = useMemo(() => {
    const candidates = new Set<number>([1, totalPages, page - 1, page, page + 1]);
    const sorted = [...candidates].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
    const items: (number | "gap")[] = [];
    sorted.forEach((number, index) => {
      if (index > 0 && number - sorted[index - 1] > 1) items.push("gap");
      items.push(number);
    });
    return items;
  }, [page, totalPages]);

  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row">
      <p className="text-xs text-slate-500">
        <span className="font-semibold text-slate-700">{rangeStart.toLocaleString("en-US")}–{rangeEnd.toLocaleString("en-US")}</span> of <span className="font-semibold text-slate-700">{total.toLocaleString("en-US")}</span> operations
      </p>
      <div className="flex items-center gap-1">
        <button aria-label="Previous page" disabled={page === 1} onClick={() => onPageChange(page - 1)} className="grid size-8 place-items-center rounded-md border border-slate-200 text-slate-500 disabled:cursor-not-allowed disabled:opacity-40">
          <Icon name="chevron" className="size-4 rotate-180" />
        </button>
        {pageNumbers.map((number, index) =>
          number === "gap" ? (
            <span key={`gap-${index}`} className="px-1 text-xs text-slate-400">…</span>
          ) : (
            <button key={number} onClick={() => onPageChange(number)} className={`size-8 rounded-md text-xs font-semibold ${number === page ? "bg-[#153746] text-white" : "text-slate-600 hover:bg-slate-100"}`}>{number}</button>
          )
        )}
        <button aria-label="Next page" disabled={page === totalPages} onClick={() => onPageChange(page + 1)} className="grid size-8 place-items-center rounded-md border border-slate-200 text-slate-500 disabled:cursor-not-allowed disabled:opacity-40">
          <Icon name="chevron" className="size-4" />
        </button>
      </div>
    </div>
  );
}
