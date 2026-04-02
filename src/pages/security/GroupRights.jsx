import { useState } from 'react'
import { Card, SectionHeader, Field } from '../../components/layout/PageShell.jsx'
import { MdArrowBack, MdSecurity, MdSave } from 'react-icons/md'

export default function GroupRights({ onBack }) {
  const [selectedModule, setSelectedModule] = useState("");

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <button onClick={onBack} className="flex items-center gap-2 rounded-lg bg-white border px-4 py-2 text-sm font-bold text-teal-700 hover:bg-teal-50 transition">
        <MdArrowBack /> Back
      </button>

      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <SectionHeader title="Group Rights" description="Assign functional permissions to specific user groups." icon={<MdSecurity className="text-teal-600 text-3xl"/>} />
        <form className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Right ID">
              <input type="text" className="w-full rounded-lg border border-slate-100 bg-slate-50 p-2 text-sm font-mono text-slate-500" value="RT-4041" disabled />
            </Field>
            <Field label="Group Dropdown">
              <select className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none bg-white">
                <option>Select Group</option>
                <option>Admins</option>
                <option>Sales Staff</option>
              </select>
            </Field>
            <Field label="Module Dropdown">
              <select 
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none bg-white"
              >
                <option value="">Select Module First</option>
                <option value="inv">Inventory</option>
                <option value="hr">Human Resources</option>
              </select>
            </Field>

            {/* Functionality dropdown only shown after module has been selected */}
            {selectedModule && (
              <Field label="Functionality Dropdown">
                <select className="w-full rounded-lg border border-teal-200 bg-teal-50/30 p-2 text-sm focus:border-teal-500 outline-none animate-in fade-in slide-in-from-top-2">
                  <option>Select Access Type</option>
                  <option>Full Access</option>
                  <option>Read Only</option>
                  <option>Edit Only</option>
                </select>
              </Field>
            )}
          </div>
          <div className="flex justify-end border-t pt-6">
            <button className="flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2 text-sm font-bold text-white shadow-lg hover:bg-teal-700 transition">
              <MdSecurity /> Assign Rights
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}