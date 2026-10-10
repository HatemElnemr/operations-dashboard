export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-18 max-w-[1600px] items-center justify-between gap-5 px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-lg bg-[#153746] text-sm font-bold text-white">O</div>
          <div>
            <p className="text-base font-bold tracking-tight text-slate-900">Operations Dashboard</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">Management workspace</p>
          </div>
        </div>

        <div className="h-7 w-px bg-slate-200" />
        <button className="flex items-center gap-2.5 rounded-lg p-1.5 text-left hover:bg-slate-50">
          <span className="grid size-8 place-items-center rounded-full bg-[#dce8e7] text-xs font-semibold text-teal-800">AK</span>
          <span className="hidden sm:block">
            <span className="block text-xs font-semibold">Alex Kim</span>
            <span className="block text-[10px] text-slate-500">Administrator</span>
          </span>
        </button>
      </div>
    </header>
  );
}
