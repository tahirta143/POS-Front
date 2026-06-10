import { MdEdit } from "react-icons/md";

export default function AccountInfoPanel({ title, fields, onEdit }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-teal-600 hover:bg-teal-50 transition"
          >
            <MdEdit className="h-3.5 w-3.5" />
            Edit
          </button>
        )}
      </div>
      <div className="divide-y divide-slate-50 dark:divide-slate-800">
        {fields.map(({ label, value, icon }) => (
          <div key={label} className="flex items-start gap-3 px-5 py-3.5">
            {icon && <span className="mt-0.5 text-slate-400 shrink-0">{icon}</span>}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
              <p className="mt-0.5 text-[13px] font-medium text-slate-700 dark:text-slate-200 break-words">
                {value || "—"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
