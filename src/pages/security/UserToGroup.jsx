import { useState } from 'react'
import { Card, SectionHeader, Field } from '../../components/layout/PageShell.jsx'
import { MdArrowBack, MdSave, MdAppRegistration } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../services/axiosInstance'

export default function UserToGroup({ onBack }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ groupId: "", userId: "" });
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post("/user-groups", formData);
      setFormData({ groupId: "", userId: "" });
      // Refresh table
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4">
       <button
        onClick={() => navigate('/security')}
        className="flex items-center gap-2 rounded-lg bg-white border px-4 py-2 text-sm font-bold text-teal-700 hover:bg-teal-50 transition"
      >
        <MdArrowBack /> Back to Overview
      </button>

      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <SectionHeader title="Assign User to Group" description="Link users to specific software access groups" icon={<MdAppRegistration className="text-teal-600 text-3xl"/>} />
        <form onSubmit={handleSave} className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <Field label="Assignment ID">
            <input type="text" className="w-full rounded-lg border border-slate-100 bg-slate-50 p-2 text-sm font-mono" value="ASGN-4421" disabled />
          </Field>
          <Field label="Software Group">
            <select name="groupId" value={formData.groupId} onChange={(e) => setFormData({ ...formData, groupId: e.target.value })} className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none bg-white" required>
              <option value="">Select Software Group</option><option value="erp">ERP Suite</option><option value="hr">HR Portal</option>
            </select>
          </Field>
          <Field label="User Selection">
            <select name="userId" value={formData.userId} onChange={(e) => setFormData({ ...formData, userId: e.target.value })} className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none bg-white" required>
              <option value="">Select User</option><option value="john">John Doe</option><option value="admin">Admin_01</option>
            </select>
          </Field>
          <div className="md:col-span-3 flex justify-end">
            <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2 text-sm font-bold text-white shadow-lg hover:bg-teal-700 transition disabled:opacity-50">
              <MdSave /> {loading ? 'Assigning...' : 'Assign User to Group'}
            </button>
          </div>
        </form>
      </Card>

      {/* DATA TABLE */}
      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4">User Group Assignments</h3>
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Assignment ID</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Software Group</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic text-slate-400">
              <tr><td colSpan="4" className="py-10 text-center">No assignments recorded yet.</td></tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}