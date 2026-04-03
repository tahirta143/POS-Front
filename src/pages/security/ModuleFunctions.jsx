import { Card, SectionHeader, Field } from '../../components/layout/PageShell.jsx'
import { MdArrowBack, MdSave, MdExtension } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
export default function ModuleFunctions({ onBack }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <button
        onClick={() => navigate('/security')}
        className="flex items-center gap-2 rounded-lg bg-white border px-4 py-2 text-sm font-bold text-teal-700 hover:bg-teal-50 transition"
      >
        <MdArrowBack /> Back to Overview
      </button>
      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <SectionHeader title="Module Functions" description="Define specific actions or buttons available within modules." icon={<MdExtension className="text-teal-600 text-3xl" />} />
        <form className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <Field label="Function ID">
            <input type="text" className="w-full rounded-lg border border-slate-100 bg-slate-50 p-2 text-sm font-mono text-slate-500" value="FUNC-105" disabled />
          </Field>
          <Field label="Module Selection">
            <select className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none bg-white">
              <option>Select Module</option>
              <option>Inventory</option>
              <option>Security</option>
            </select>
          </Field>
          <Field label="Function Name" required>
            <input type="text" className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" placeholder="e.g. Create_Invoice" />
          </Field>
          <div className="md:col-span-3 flex justify-end">
            <button className="flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2 text-sm font-bold text-white shadow-lg hover:bg-teal-700 transition">
              <MdSave /> Save Function
            </button>
          </div>
        </form>
      </Card>

      {/* DATA TABLE */}
      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Registered Module Functions</h3>
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Function ID</th>
                <th className="px-6 py-3">Module</th>
                <th className="px-6 py-3">Function Name</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic text-slate-400">
              <tr><td colSpan="4" className="py-10 text-center">No module functions recorded yet.</td></tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}