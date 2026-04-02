import { Card, SectionHeader, Field } from '../../components/layout/PageShell.jsx'
import { MdArrowBack, MdSave, MdPeople } from 'react-icons/md'

export default function Employee({ onBack }) {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4">
      <button onClick={onBack} className="flex items-center gap-2 rounded-lg bg-white border px-4 py-2 text-sm font-bold text-teal-700 hover:bg-teal-50 transition">
        <MdArrowBack /> Back to Overview
      </button>

      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <SectionHeader title="Add New Employee" description="Register a new staff member to the organization" icon={<MdPeople className="text-teal-600 text-3xl"/>} />
        
        <form className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Employee #Code">
              <input type="text" className="w-full rounded-lg border border-slate-100 bg-slate-50 p-2 text-sm font-mono text-slate-500" value="EMP-2024-XXXX" disabled />
            </Field>
            <Field label="Employee Name" required><input type="text" className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" /></Field>
            <Field label="Email Address" required><input type="email" className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" /></Field>
            
            <Field label="Department">
              <select className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none bg-white">
                <option>Select Department</option>
                <option>IT Support</option>
                <option>Finance</option>
                <option>Human Resources</option>
              </select>
            </Field>

            <Field label="Select Designation">
              <select className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none bg-white">
                <option>Select Designation</option>
                <option>Manager</option>
                <option>System Administrator</option>
                <option>Staff</option>
              </select>
            </Field>
          </div>

          <div className="flex justify-end border-t pt-6">
            <button className="flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2 text-sm font-bold text-white shadow-lg hover:bg-teal-700 transition">
              <MdSave /> Save Employee
            </button>
          </div>
        </form>
      </Card>

      {/* DATA TABLE BELOW FORM */}
      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Employee Directory</h3>
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
              <tr><th className="px-6 py-3">Code</th><th className="px-6 py-3">Name</th><th className="px-6 py-3">Department</th><th className="px-6 py-3 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic text-slate-400">
              <tr><td colSpan="4" className="py-10 text-center">No employee data recorded yet.</td></tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}