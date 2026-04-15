export default function FallbackNotice({ title = 'Frontend fallback active', message }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-[12px] text-slate-700 shadow-sm ring-1 ring-amber-100/80">
      <p className="font-bold uppercase tracking-wide text-[10px] text-amber-700">{title}</p>
      <p className="mt-1 leading-5">{message}</p>
    </div>
  )
}
