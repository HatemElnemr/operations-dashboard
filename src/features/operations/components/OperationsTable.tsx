import { Icon } from "../../../components/ui/Icon";
import { EmptyState } from "../../../components/states/EmptyState";
import { StatusBadge } from "./StatusBadge";
import type { OperationView } from "../utils/operationView";

interface OperationsTableProps {
  rows: OperationView[];
  isUpdating: boolean;
  onView: (operation: OperationView) => void;
  onEdit: (operation: OperationView) => void;
}

export function OperationsTable({ rows, isUpdating, onView, onEdit }: OperationsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-262.5 border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            <th className="px-5 py-3.5">ID</th>
            <th className="px-4 py-3.5">Operation name</th>
            <th className="px-4 py-3.5">Assignee</th>
            <th className="px-4 py-3.5">Status</th>
            <th className="px-4 py-3.5">Created date</th>
            <th className="px-4 py-3.5">Last updated</th>
            <th className="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-[13px]">
          {rows.length === 0 && (
            <tr>
              <td colSpan={7}>
                <EmptyState
                  title="No operations found"
                  description="No operations match your current search or filters."
                />
              </td>
            </tr>
          )}
          {rows.map((item, index) => (
            <tr key={item.id} className={`border-b border-slate-100 transition hover:bg-teal-50/30 ${index % 2 ? "bg-slate-50/45" : "bg-white"}`}>
              <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-500">{item.id}</td>
              <td className="px-4 py-3.5 font-semibold text-slate-800">{item.name}</td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-7 place-items-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-600">{item.initials}</span>
                  <span className="text-slate-700">{item.assignee}</span>
                </div>
              </td>
              <td className="px-4 py-3.5"><StatusBadge status={item.status} /></td>
              <td className="px-4 py-3.5 text-slate-600">{item.created}</td>
              <td className="px-4 py-3.5 text-slate-500">
                <span className="block">{item.updated}</span>
                <span className="text-[10px]">{item.updatedTime}</span>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex justify-end gap-1.5">
                  <button onClick={() => onView(item)} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50">
                    <Icon name="eye" className="size-3.5" /> View
                  </button>
                  <button onClick={() => onEdit(item)} disabled={isUpdating} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50">
                    <Icon name="edit" className="size-3.5" /> Edit
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
