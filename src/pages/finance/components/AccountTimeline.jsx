import { MdReceipt, MdPayment, MdShoppingCart, MdCalendarToday } from "react-icons/md";

const TYPE_STYLES = {
  invoice: { icon: MdReceipt, bg: "bg-teal-50 text-teal-600", amount: "text-rose-600" },
  purchase: { icon: MdShoppingCart, bg: "bg-teal-50 text-teal-600", amount: "text-rose-600" },
  payment: { icon: MdPayment, bg: "bg-emerald-50 text-emerald-600", amount: "text-emerald-600" },
  booking: { icon: MdCalendarToday, bg: "bg-indigo-50 text-indigo-600", amount: "text-rose-600" },
};

function fmtDateTime(val) {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(val);
  }
}

export default function AccountTimeline({ events = [] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">
          Account Timeline (Latest Activity)
        </h3>
      </div>
      {events.length === 0 ? (
        <div className="px-5 py-10 text-center text-[13px] text-slate-400">No recent activity.</div>
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-[360px] overflow-y-auto">
          {events.map((event, idx) => {
            const style = TYPE_STYLES[event.type] || TYPE_STYLES.payment;
            const Icon = style.icon;
            return (
              <div key={`${event.type}-${event.id}-${idx}`} className="flex items-center gap-4 px-5 py-4">
                <div className="w-28 shrink-0 text-[11px] text-slate-400">{fmtDateTime(event.date)}</div>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.bg}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">{event.title}</p>
                  {event.subtitle && <p className="text-[11px] text-slate-400">{event.subtitle}</p>}
                </div>
                <div className={`shrink-0 text-[13px] font-bold font-mono ${style.amount}`}>
                  {event.amountPrefix || ""}PKR {Number(event.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
