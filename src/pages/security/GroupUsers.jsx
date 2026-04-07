import { Card, SectionHeader, Field } from '../../components/layout/PageShell.jsx'
import { MdArrowBack, MdSave, MdGroupWork, MdRefresh } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'

export default function GroupUsers({ onBack }) {
  const navigate = useNavigate()
  const handleSave = (e) => {
    e.preventDefault();
    // Logic for saving group would go here
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <button
        onClick={() => navigate('/security')}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-teal-300 bg-teal-50 px-3 py-1.5 text-[11px] font-semibold text-teal-700 hover:bg-teal-100 transition"
      >
        <MdArrowBack /> Back to Overview
      </button>

      {/* FORM SECTION */}
      <Card className="border-l-[6px] border-l-teal-500 p-6 shadow-sm">
        <SectionHeader 
          title="Add Group Users" 
          description="Define and register a new user group for the system." 
          icon={<MdGroupWork className="text-teal-600 text-3xl"/>} 
        />
        
        <form onSubmit={handleSave} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <Field label="Group ID">
              <input 
                type="text" 
                className="h-8 w-full rounded-md border border-slate-100 bg-slate-50 px-2.5 text-[12px] font-mono text-slate-500" 
                value="GRP-2026-004" 
                disabled 
              />
            </Field>
            <Field label="Group Name" required>
              <input 
                type="text" 
                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" 
                placeholder="e.g. System Administrators" 
                required 
              />
            </Field>
          </div>

          <div className="flex justify-end gap-3  border-slate-100 pt-6">
            <button 
              type="button" 
              onClick={onBack} 
              className="px-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2 text-sm font-bold text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition"
            >
              <MdSave /> Save Group
            </button>
          </div>
        </form>
      </Card>

      {/* DATA TABLE SECTION */}
      <Card className="border-l-[6px] border-l-teal-500 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-slate-700">Existing User Groups</h3>
          <MdRefresh className="text-slate-400 cursor-pointer hover:text-teal-600 transition" />
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Group ID</th>
                <th className="px-6 py-4">Group Name</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr className="hover:bg-teal-50/20 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-slate-400">#GRP-0001</td>
                <td className="px-6 py-4 font-bold text-slate-700">Administrator</td>
                <td className="px-6 py-4 text-right">
                  <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[9px] font-bold text-teal-700 uppercase">Active</span>
                </td>
              </tr>
              {/* More rows would be mapped here */}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
