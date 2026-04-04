import { Card, SectionHeader, Field } from '../../components/layout/PageShell.jsx'
import { MdArrowBack, MdVpnKey, MdSave } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
export default function UserModule({ onBack }) {
  const navigate = useNavigate()
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
       <button
        onClick={() => navigate('/security')}
        className="flex items-center gap-2 rounded-lg bg-white border px-4 py-2 text-sm font-bold text-teal-700 hover:bg-teal-50 transition"
      >
        <MdArrowBack /> Back to Overview
      </button>
      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <SectionHeader title="User Module Access" description="Grant direct module access to individual system users." icon={<MdVpnKey className="text-teal-600 text-3xl"/>} />
        <form className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <Field label="Access ID">
            <input type="text" className="w-full rounded-lg border border-slate-100 bg-slate-50 p-2 text-sm font-mono text-slate-500" value="ACC-202" disabled />
          </Field>
          <Field label="Module Dropdown">
            <select className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none bg-white">
              <option>Select Module</option>
              <option>Reports</option>
              <option>Settings</option>
            </select>
          </Field>
          <Field label="User Dropdown">
            <select className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none bg-white">
              <option>Select User</option>
              <option>John Doe</option>
            </select>
          </Field>
          <button className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-teal-700 transition h-[38px]">
             Grant Access
          </button>
        </form>
      </Card>

      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Active Access Grants</h3>
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
              <tr><th className="px-6 py-3">Access ID</th><th className="px-6 py-3">User</th><th className="px-6 py-3">Module</th><th className="px-6 py-3 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic text-slate-400">
              <tr><td colSpan="4" className="py-10 text-center">No active access grants found.</td></tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}