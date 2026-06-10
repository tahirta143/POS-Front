import { MdArrowBack, MdMoreVert } from "react-icons/md";

export default function AccountDetailHeader({
  icon,
  name,
  subtitle,
  balanceLabel,
  balanceAmount,
  balanceTone = "emerald",
  actionLabel,
  onBack,
  onAction,
  onRefresh,
}) {
  const balanceColors = {
    emerald: "text-emerald-600",
    rose: "text-rose-600",
    teal: "text-teal-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-teal-600 transition"
          >
            <MdArrowBack className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-teal-600">{icon}</span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">{name}</h1>
            </div>
            {subtitle && <p className="mt-1 text-[13px] text-slate-500">{subtitle}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{balanceLabel}</p>
            <p className={`text-2xl font-black font-mono ${balanceColors[balanceTone] || balanceColors.emerald}`}>
              PKR {Number(balanceAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-teal-700 transition"
            >
              {actionLabel}
            </button>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
                title="More options"
              >
                <MdMoreVert className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
