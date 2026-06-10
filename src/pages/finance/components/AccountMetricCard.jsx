export default function AccountMetricCard({ label, value, subtext, icon, tone = "teal" }) {
  const tones = {
    teal: "text-teal-600 bg-teal-50",
    emerald: "text-emerald-600 bg-emerald-50",
    rose: "text-rose-600 bg-rose-50",
    amber: "text-amber-600 bg-amber-50",
    slate: "text-slate-600 bg-slate-50",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-black font-mono text-slate-800 dark:text-slate-100">
            PKR {Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          {subtext && (
            <p className={`mt-1 text-[11px] font-medium ${tone === "rose" ? "text-rose-500" : "text-slate-400"}`}>
              {subtext}
            </p>
          )}
        </div>
        {icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone] || tones.teal}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
