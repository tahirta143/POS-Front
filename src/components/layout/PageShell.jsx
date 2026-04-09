// PageShell — wraps page content in a centred, max-width section.
// Note: the `title`, `description`, and `accent` props passed by some pages
// are intentionally unused here; the Sidebar topbar already shows the page title.
export function PageShell({ children }) {
  return (
    <section className="page-shell w-full space-y-6 pb-20">
      {children}
    </section>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div
      className={`app-card rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur ${className}`}
    >
      {children}
    </div>
  )
}

export function SectionHeader({ icon, title, description, action }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-teal-100 pb-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600 shadow-sm">
          {icon}
        </div>
        <div>
          <h3 className="text-[16px] font-bold tracking-tight text-slate-900">{title}</h3>
          <p className="text-[12px] leading-5 text-slate-500">{description}</p>
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
      <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-600">
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

export function StatusChip({ label, tone = 'slate' }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-700',
    teal: 'bg-teal-50 text-teal-700',
    slate: 'bg-slate-100 text-slate-700',
  }
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${tones[tone] || tones.slate}`}>
      {label}
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
  const isIconOnly = label === 'Edit' || label === 'Delete'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`${isIconOnly ? 'inline-flex h-8 w-8 items-center justify-center rounded-lg p-0' : 'rounded-xl px-3 py-2 text-xs font-semibold'} transition ${tones[tone] || tones.teal}`}
    >
      {label === 'Edit' ? (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.1 2.1 0 113.03 2.908L9.4 17.462 5 19l1.62-4.273L16.862 4.487z" />
        </svg>
      ) : label === 'Delete' ? (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ) : (
        label
      )}
    </button>
  )
}
