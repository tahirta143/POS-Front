import { Card, SectionHeader, Field } from '../../components/layout/PageShell.jsx'
import { MdArrowBack, MdSave, MdLockPerson } from 'react-icons/md'

export default function User({ onBack }) {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4">
      <button onClick={onBack} className="flex items-center gap-2 rounded-lg bg-white border px-4 py-2 text-sm font-bold text-teal-700 hover:bg-teal-50 transition">
        <MdArrowBack /> Back to Overview
      </button>

      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <SectionHeader title="Add New User" description="Create system credentials and assign organizational links" icon={<MdLockPerson className="text-teal-600 text-3xl"/>} />
        
        <form className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="User ID"><input type="text" className="w-full rounded-lg border border-slate-100 bg-slate-50 p-2 text-sm font-mono" value="USR-9901" disabled /></Field>
            <Field label="Username" required><input type="text" className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" /></Field>
            <Field label="Company ID" required><input type="text" className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" /></Field>
            <Field label="Employee ID" required><input type="text" className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" /></Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <Field label="Email Address" required><input type="email" className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" /></Field>
            <Field label="Password" required><input type="password" className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" /></Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Role Selection">
              <select className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none bg-white">
                <option>Admin</option><option>Manager</option><option>User</option>
              </select>
            </Field>
            <Field label="Account Status">
              <select className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none bg-white">
                <option>Active</option><option>Inactive</option><option>Pending</option><option>Suspended</option>
              </select>
            </Field>
          </div>

          <Field label="Description"><textarea className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" rows="2" placeholder="User access notes..."></textarea></Field>

          <div className="flex justify-end pt-4"><button className="flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2 text-sm font-bold text-white shadow-lg hover:bg-teal-700 transition"><MdSave /> Save User</button></div>
        </form>
      </Card>
    </div>
  )
}