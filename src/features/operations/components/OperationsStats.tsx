import type { OperationStatus } from "../types/operation.types";

const STATUS_ORDER: OperationStatus[] = ["Pending", "Running", "Completed", "Failed"];

const metricStyles: Record<OperationStatus, { color: string; tint: string }> = {
  Pending: { color: "bg-amber-500", tint: "bg-amber-50" },
  Running: { color: "bg-teal-600", tint: "bg-teal-50" },
  Completed: { color: "bg-emerald-600", tint: "bg-emerald-50" },
  Failed: { color: "bg-red-500", tint: "bg-red-50" },
};

interface OperationsStatsProps {
  stats: Record<OperationStatus, number>;
}

export function OperationsStats({ stats }: OperationsStatsProps) {
  const grandTotal = STATUS_ORDER.reduce((sum, key) => sum + stats[key], 0);

  return (
    <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Operation status summary">
      {STATUS_ORDER.map((name) => {
        const percent = grandTotal ? ((stats[name] / grandTotal) * 100).toFixed(1) : "0.0";
        return (
          <article key={name} className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{name}</p>
                <p className="mt-2 text-[28px] font-bold leading-none tracking-[-0.03em] text-slate-900">
                  {stats[name].toLocaleString("en-US")}
                </p>
              </div>
              <span className={`grid size-9 place-items-center rounded-lg ${metricStyles[name].tint}`}>
                <span className={`size-2.5 rounded-full ${metricStyles[name].color}`} />
              </span>
            </div>
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{percent}%</span> of total operations
            </p>
          </article>
        );
      })}
    </section>
  );
}
