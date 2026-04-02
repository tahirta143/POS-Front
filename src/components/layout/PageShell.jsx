// PageShell — wraps page content in a centred, max-width section.
// Note: the `title`, `description`, and `accent` props passed by some pages
// are intentionally unused here; the Sidebar topbar already shows the page title.
export function PageShell({ children }) {
  return (
    <section className="w-full space-y-6 pb-20">
      {children}
    </section>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur ${className}`}
    >
      {children}
    </div>
  )
}

export function SectionHeader({ icon, title, description, action }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
          {icon}
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
          <p className="text-[13px] leading-5 text-slate-500">{description}</p>
        </div>
      </div>
      {action}
    </div>
  )
}

export function StatusAlert({ type = 'error', message }) {
  if (!message) return null
  const themes = {
    error: 'border-rose-100 bg-rose-50 text-rose-700',
    success: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  }
  return (
    <div className={`mb-3 rounded-lg border px-3.5 py-2.5 text-[13px] ${themes[type]}`}>
      {message}
    </div>
  )
}

export function Field({ label, required = false, hint, children, className = '' }) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className="block text-[13px] font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-slate-400">{hint}</span>}
    </label>
  )
}

export function Toggle({ enabled, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <div>
        <p className="text-[13px] font-medium text-slate-800">{label}</p>
        <p className="mt-1 text-[11px] text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition ${
          enabled ? 'bg-teal-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-6 w-6 rounded-full bg-white shadow transition ${
            enabled ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

export function TableState({ message }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center text-sm text-slate-500">
      {message}
    </div>
  )
}

export function StatusChip({ enabled, label, colorClass }) {
  if (label) {
    return (
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colorClass}`}>
        {label}
      </span>
    )
  }
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
      }`}
    >
      {enabled ? 'Enabled' : 'Disabled'}
    </span>
  )
}

export function ActionButton({ label, tone, onClick, disabled }) {
  const tones = {
    teal: 'bg-teal-50 text-teal-700 hover:bg-teal-100 disabled:opacity-50 disabled:hover:bg-teal-50',
    rose: 'bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50 disabled:hover:bg-rose-50',
    amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 disabled:hover:bg-amber-50',
    indigo: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 disabled:hover:bg-indigo-50',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${tones[tone] || tones.teal}`}
    >
      {label}
    </button>
  )
}