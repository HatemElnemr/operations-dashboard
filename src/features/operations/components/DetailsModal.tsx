import { Icon } from '../../../components/ui/Icon';
import { StatusBadge } from './StatusBadge';
import type { OperationView } from '../utils/operationView';

interface DetailsModalProps {
  operation: OperationView;
  onClose: () => void;
  onEdit: () => void;
}

export function DetailsModal({ operation, onClose, onEdit }: DetailsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)]">
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="mb-1 font-mono text-xs font-semibold text-slate-500">{operation.id}</p>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">{operation.name}</h2>
          </div>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <Icon name="close" className="size-5" />
          </button>
        </header>
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Current status</p>
              <StatusBadge status={operation.status} />
            </div>
            <button onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
              <Icon name="edit" className="size-3.5" /> Change status
            </button>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Description</h3>
            <p className="text-sm leading-6 text-slate-600">{operation.description}</p>
          </div>
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Assignee</h3>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-[#dce8e7] text-sm font-bold text-teal-800">{operation.initials}</span>
              <div>
                <p className="text-sm font-semibold text-slate-800">{operation.assignee}</p>
                <p className="mt-0.5 text-xs text-slate-500">{operation.role}</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Timeline</h3>
            <div className="relative grid grid-cols-2 gap-4 rounded-xl border border-slate-200 p-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700"><Icon name="plus" className="size-4 text-slate-400" /> Created</div>
                <p className="text-sm font-medium text-slate-800">{operation.created}</p>
                <p className="mt-0.5 text-xs text-slate-500">{operation.createdTime}</p>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700"><Icon name="clock" className="size-4 text-slate-400" /> Last updated</div>
                <p className="text-sm font-medium text-slate-800">{operation.updated}</p>
                <p className="mt-0.5 text-xs text-slate-500">{operation.updatedTime}</p>
              </div>
            </div>
          </div>
        </div>
        <footer className="flex justify-end border-t border-slate-200 bg-slate-50/60 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
        </footer>
      </section>
    </div>
  );
}