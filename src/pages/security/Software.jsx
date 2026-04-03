import { Card, SectionHeader, Field } from '../../components/layout/PageShell.jsx'
import { MdArrowBack, MdSave, MdViewModule, MdRefresh } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
export default function SoftwareGroup({ onBack }) {
  const navigate = useNavigate()
  const handleSave = (e) => {
    e.preventDefault();
    // Save logic
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
       <button
        onClick={() => navigate('/security')}
        className="flex items-center gap-2 rounded-lg bg-white border px-4 py-2 text-sm font-bold text-teal-700 hover:bg-teal-50 transition"
      >
        <MdArrowBack /> Back to Overview
      </button>

      {/* FORM SECTION */}
      <Card className="border-l-[6px] border-l-teal-500 p-6 shadow-sm">
        <SectionHeader 
          title="Add Software Group" 
          description="Register a new software category or application module." 
          icon={<MdViewModule className="text-teal-600 text-3xl"/>} 
        />
        
        <form onSubmit={handleSave} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <Field label="Software Group ID">
              <input 
                type="text" 
                className="w-full rounded-lg border border-slate-100 bg-slate-50 p-2 text-sm font-mono text-slate-500" 
                value="SW-GRP-552" 
                disabled 
              />
            </Field>
            <Field label="Software Group Name" required>
              <input 
                type="text" 
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none transition-all" 
                placeholder="e.g. ERP Module" 
                required 
              />
            </Field>
          </div>

          <div className="flex justify-end pt-6 border-slate-100">
            <button 
              type="submit" 
              className="flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2 text-sm font-bold text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition"
            >
              <MdSave /> Save Software Group
            </button>
          </div>
        </form>
      </Card>

      {/* DATA TABLE SECTION */}
      <Card className="border-l-[6px] border-l-teal-500 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-slate-700">Software Categories</h3>
          <MdRefresh className="text-slate-400 cursor-pointer hover:text-teal-600 transition" />
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Software Group Name</th>
                <th className="px-6 py-4 text-right">Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr className="hover:bg-teal-50/20 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-slate-400">#SW-001</td>
                <td className="px-6 py-4 font-bold text-slate-700">Inventory Management</td>
                <td className="px-6 py-4 text-right font-medium text-teal-600">12 Users</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}