export default function FallbackNotice({ title = 'Frontend fallback active', message }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-slate-700">
      <p className="font-bold uppercase tracking-wide text-[10px] text-amber-700">{title}</p>
      <p className="mt-1 leading-5">{message}</p>
    </div>
  )
}
