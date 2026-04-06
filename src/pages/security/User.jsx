import { useState } from 'react'
import { Card, SectionHeader, Field } from '../../components/layout/PageShell.jsx'
import { MdArrowBack, MdSave, MdLockPerson } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../services/axiosInstance'

export default function User({ onBack }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '', companyId: '', employeeId: '', email: '', password: '', role: 'User', status: 'Active', description: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post('/users', formData);
      setFormData({ username: '', companyId: '', employeeId: '', email: '', password: '', role: 'User', status: 'Active', description: '' });
      // Logic to refresh table
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
        <SectionHeader title="Add New User" description="Create system credentials and assign organizational links" icon={<MdLockPerson className="text-teal-600 text-3xl"/>} />
        
          <form onSubmit={handleSave} className="mt-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="User ID"><input type="text" className="w-full rounded-lg border border-slate-100 bg-slate-50 p-2 text-sm font-mono" value="USR-9901" disabled /></Field>
              <Field label="Username" required><input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" required /></Field>
              <Field label="Company ID" required><input type="text" name="companyId" value={formData.companyId} onChange={handleChange} className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" required /></Field>
              <Field label="Employee ID" required><input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" required /></Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <Field label="Email Address" required><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" required /></Field>
              <Field label="Password" required><input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" required /></Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Role Selection">
                <select name="role" value={formData.role} onChange={handleChange} className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none bg-white">
                  <option value="Admin">Admin</option><option value="Manager">Manager</option><option value="User">User</option>
                </select>
              </Field>
              <Field label="Account Status">
                <select name="status" value={formData.status} onChange={handleChange} className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none bg-white">
                  <option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Pending">Pending</option><option value="Suspended">Suspended</option>
                </select>
              </Field>
            </div>

            <Field label="Description"><textarea name="description" value={formData.description} onChange={handleChange} className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-teal-500 outline-none" rows="2" placeholder="User access notes..."></textarea></Field>

            <div className="flex justify-end pt-4">
              <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2 text-sm font-bold text-white shadow-lg hover:bg-teal-700 transition disabled:opacity-50">
                <MdSave /> {loading ? 'Saving...' : 'Save User'}
              </button>
            </div>
          </form>
      </Card>

      {/* DATA TABLE */}
      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Registered Users</h3>
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">User ID</th>
                <th className="px-6 py-3">Username</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic text-slate-400">
              <tr><td colSpan="5" className="py-10 text-center">No users recorded yet.</td></tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}