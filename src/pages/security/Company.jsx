import { useState } from 'react'
import { Card, SectionHeader, Field } from '../../components/layout/PageShell.jsx'
import { MdArrowBack, MdSave, MdCloudUpload, MdBusiness } from 'react-icons/md'

export default function Company({ onBack }) {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4">
      <button onClick={onBack} className="flex items-center gap-2 rounded-lg bg-white border px-4 py-2 text-sm font-bold text-teal-700 hover:bg-teal-50 transition">
        <MdArrowBack /> Back to Overview
      </button>

      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <SectionHeader title="Add New Company" description="Setup company profile and licensing information" icon={<MdBusiness className="text-teal-600 text-3xl"/>} />
        
        <form className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Company Name" required><input type="text" className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" /></Field>
            <Field label="Email Address" required><input type="email" className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" /></Field>
            <Field label="Contact Info"><input type="text" className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" /></Field>
            <Field label="Phone Number"><input type="text" className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" /></Field>
            <Field label="Website"><input type="text" className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" /></Field>
            <Field label="Licence Information"><input type="text" className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" /></Field>
            
            <Field label="Expiry Date"><input type="date" className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" /></Field>
            
            <Field label="Renewable Licence">
              <div className="flex items-center gap-3 h-10">
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-teal-600 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            </Field>

            <Field label="Company Logo">
              <label className="flex items-center justify-center w-full h-10 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500"><MdCloudUpload className="text-teal-600" /> Upload File</div>
                <input type="file" className="hidden" />
              </label>
            </Field>

            <div className="md:col-span-3">
              <Field label="Address"><textarea className="w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-teal-500" rows="2"></textarea></Field>
            </div>
          </div>

          <div className="flex justify-end border-t pt-6">
            <button className="flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2 text-sm font-bold text-white shadow-lg hover:bg-teal-700 transition">
              <MdSave /> Save Company
            </button>
          </div>
        </form>
      </Card>

      {/* DATA TABLE BELOW FORM */}
      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Existing Companies</h3>
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
              <tr><th className="px-6 py-3">Company</th><th className="px-6 py-3">Email</th><th className="px-6 py-3">Licence</th><th className="px-6 py-3 text-right">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic text-slate-400">
              <tr><td colSpan="4" className="py-10 text-center">No company data recorded yet.</td></tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}