import { Card, SectionHeader, Field } from '../../components/layout/PageShell.jsx'
import { MdArrowBack, MdSave, MdViewModule, MdRefresh } from 'react-icons/md'

export default function ModuleInfo({ onBack }) {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <button onClick={onBack} className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-bold text-teal-700 hover:bg-teal-50 transition shadow-sm">
        <MdArrowBack /> Back to Overview
      </button>

      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <SectionHeader title="Module Information" description="Register and manage system-wide software modules." icon={<MdViewModule className="text-teal-600 text-3xl"/>} />
        <form className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Module ID">
              <input type="text" className="w-full rounded-lg border border-slate-100 bg-slate-50 p-2 text-sm font-mono text-slate-500" value="MOD-882" disabled />
            </Field>
            <Field label="Module Name" required>
              <input type="text" className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" placeholder="e.g. Inventory Management" />
            </Field>
          </div>
          <Field label="Description">
            <textarea className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" rows="3" placeholder="Define the purpose of this module..."></textarea>
          </Field>
          <div className="flex justify-end pt-4 border-t border-slate-50">
            <button className="flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2 text-sm font-bold text-white shadow-lg hover:bg-teal-700 transition">
              <MdSave /> Save Module
            </button>
          </div>
        </form>
      </Card>

      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-slate-700">Registered Modules</h3>
          <MdRefresh className="text-slate-400 cursor-pointer" />
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
              <tr><th className="px-6 py-3">ID</th><th className="px-6 py-3">Module Name</th><th className="px-6 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50 italic text-slate-400">
              <tr><td colSpan="3" className="py-10 text-center">No modules found.</td></tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}