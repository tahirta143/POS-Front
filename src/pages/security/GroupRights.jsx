import { useState } from 'react'
import { Card, SectionHeader, Field } from '../../components/layout/PageShell.jsx'
import { MdArrowBack, MdSecurity } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../services/axiosInstance'

export default function GroupRights({ onBack }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ groupId: '', moduleId: '', accessType: '' });
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post('/rights', formData);
      setFormData({ groupId: '', moduleId: '', accessType: '' });
      // Refresh list
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <button
        onClick={() => navigate('/security')}
        className="flex items-center gap-2 rounded-lg bg-white border px-4 py-2 text-sm font-bold text-teal-700 hover:bg-teal-50 transition"
      >
        <MdArrowBack /> Back to Overview
      </button>

      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <SectionHeader title="Group Rights" description="Assign functional permissions to specific user groups." icon={<MdSecurity className="text-teal-600 text-3xl"/>} />
        <form onSubmit={handleSave} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Right ID">
              <input type="text" className="w-full rounded-lg border border-slate-100 bg-slate-50 p-2 text-sm font-mono text-slate-500" value="RT-4041" disabled />
            </Field>
            <Field label="Group Selection">
              <select value={formData.groupId} onChange={(e) => setFormData({...formData, groupId: e.target.value})} className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none bg-white" required>
                <option value="">Select Group</option>
                <option value="admins">Admins</option>
                <option value="staff">Sales Staff</option>
              </select>
            </Field>
            <Field label="Module Selection">
              <select
                value={formData.moduleId}
                onChange={(e) => setFormData({...formData, moduleId: e.target.value})}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none bg-white"
                required
              >
                <option value="">Select Module</option>
                <option value="inv">Inventory</option>
                <option value="hr">Human Resources</option>
              </select>
            </Field>

            <Field label="Access Level">
              <select value={formData.accessType} onChange={(e) => setFormData({...formData, accessType: e.target.value})} className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none bg-white" required>
                <option value="">Select Access Type</option>
                <option value="full">Full Access</option>
                <option value="read">Read Only</option>
                <option value="edit">Edit Only</option>
              </select>
            </Field>
          </div>
          <div className="flex justify-end pt-6">
            <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2 text-sm font-bold text-white shadow-lg hover:bg-teal-700 transition disabled:opacity-50">
              <MdSecurity /> {loading ? 'Assigning...' : 'Assign Rights'}
            </button>
          </div>
        </form>
      </Card>

      {/* DATA TABLE */}
      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Assigned Group Rights</h3>
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Right ID</th>
                <th className="px-6 py-3">Group</th>
                <th className="px-6 py-3">Module</th>
                <th className="px-6 py-3">Access Type</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic text-slate-400">
              <tr><td colSpan="5" className="py-10 text-center">No group rights assigned yet.</td></tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}