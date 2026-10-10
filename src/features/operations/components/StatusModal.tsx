import { useState } from 'react';
import { Icon } from '../../../components/ui/Icon';
import type { OperationStatus } from '../types/operation.types';

type Status = OperationStatus;
type Operation = {
  id: string;
  name: string;
  status: Status;
};

const statusStyle: Record<Status, { dot: string; option: string }> = {
  Pending: { dot: "bg-amber-500", option: "border-amber-500 bg-amber-50/60" },
  Running: { dot: "bg-teal-600", option: "border-teal-600 bg-teal-50/60" },
  Completed: { dot: "bg-emerald-600", option: "border-emerald-600 bg-emerald-50/60" },
  Failed: { dot: "bg-red-500", option: "border-red-500 bg-red-50/60" },
};

interface StatusModalProps {
  operation: Operation;
  isSaving?: boolean;
  error?: string;
  onClose: () => void;
  onSave: (status: Status) => void;
}

export function StatusModal({ operation, isSaving = false, error, onClose, onSave }: StatusModalProps) {
  const [selected, setSelected] = useState<Status>(operation.status);
  const statuses: Status[] = ["Pending", "Running", "Completed", "Failed"];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/35 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)]">
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Change operation status</h2>
            <p className="mt-1 text-xs text-slate-500">{operation.id} · {operation.name}</p>
          </div>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <Icon name="close" className="size-5" />
          </button>
        </header>
        <div className="p-6">
          <fieldset>
            <legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Select new status</legend>
            <div className="space-y-2">
              {statuses.map((item) => (
                <label key={item} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${selected === item ? statusStyle[item].option : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>
                  <input className="sr-only" type="radio" name="status" value={item} checked={selected === item} onChange={() => setSelected(item)} />
                  <span className={`grid size-5 place-items-center rounded-full border ${selected === item ? "border-[#153746] bg-[#153746] text-white" : "border-slate-300 bg-white"}`}>
                    {selected === item && <Icon name="check" className="size-3" />}
                  </span>
                  <span className={`size-2.5 rounded-full ${statusStyle[item].dot}`} />
                  <span className="text-sm font-semibold text-slate-800">{item}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        {error && (
          <p role="alert" className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            {error}
          </p>
        )}
        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/60 px-6 py-4">
          <button onClick={onClose} disabled={isSaving} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Cancel</button>
          <button onClick={() => onSave(selected)} disabled={isSaving} className="rounded-lg bg-[#153746] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0f2b37] disabled:cursor-not-allowed disabled:opacity-60">{isSaving ? "Saving…" : "Save changes"}</button>
        </footer>
      </section>
    </div>
  );
}