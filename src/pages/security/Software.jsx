import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { MdArrowBack, MdRefresh, MdViewModule } from 'react-icons/md'
import axiosInstance from '../../services/axiosInstance'
import {
  ActionButton,
  Card,
  Field,
  SectionHeader,
  StatusAlert,
  TableState,
} from '../../components/layout/PageShell.jsx'

function emptyForm() {
  return { groupName: '' }
}

export default function SoftwareGroup() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [groups, setGroups] = useState([])
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchGroups()
  }, [])

  async function fetchGroups() {
    setLoading(true)
    setMessage('')
    try {
      const response = await axiosInstance.get('/groups')
      setGroups(Array.isArray(response.data) ? response.data : [])
    } catch {
      setGroups([])
      setMessage('Software groups could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.groupName.trim()) {
      toast.error('Software group name is required.')
      return
    }

    setSubmitting(true)
    setMessage('')
    try {
      const payload = { groupName: form.groupName.trim(), users: [] }
      if (editId) {
        await axiosInstance.put(`/groups/${editId}`, payload)
        toast.success('Software group updated successfully.')
      } else {
        await axiosInstance.post('/groups', payload)
        toast.success('Software group created successfully.')
      }
      resetForm()
      fetchGroups()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to save software group.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleEdit(group) {
    setEditId(group.id)
    setForm({ groupName: group.group_name || '' })
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(group) {
    if (!window.confirm(`Delete "${group.group_name}"?`)) return
    try {
      await axiosInstance.delete(`/groups/${group.id}`)
      toast.success('Software group deleted successfully.')
      if (editId === group.id) resetForm()
      fetchGroups()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to delete software group.')
    }
  }

  function resetForm() {
    setEditId(null)
    setForm(emptyForm())
    setMessage('')
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <button
        onClick={() => navigate('/security')}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-teal-300 bg-teal-50 px-3 py-1.5 text-[11px] font-semibold text-teal-700 hover:bg-teal-100 transition"
      >
        <MdArrowBack /> Back to Overview
      </button>

      <Card className="border-l-[6px] border-l-teal-500 p-6 shadow-sm">
        <SectionHeader
          title={editId ? 'Edit Software Group' : 'Add Software Group'}
          description="Create and maintain the groups used for security and access control."
          icon={<MdViewModule className="text-teal-600 text-3xl" />}
          action={
            editId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel Edit
              </button>
            ) : null
          }
        />

        <StatusAlert type="error" message={message} />

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <Field label="Software Group ID">
              <input
                type="text"
                className="h-8 w-full rounded-md border border-slate-100 bg-slate-50 px-2.5 text-[12px] font-mono text-slate-500"
                value={editId ? `GRP-${String(editId).padStart(4, '0')}` : 'Auto generated'}
                disabled
              />
            </Field>
            <Field label="Software Group Name" required>
              <input
                type="text"
                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                placeholder="e.g. Inventory Supervisors"
                required
                value={form.groupName}
                onChange={(event) => setForm({ groupName: event.target.value })}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2 text-sm font-bold text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editId ? 'Update Group' : 'Save Group'}
            </button>
          </div>
        </form>
      </Card>

      <Card className="border-l-[6px] border-l-teal-500 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-700">Software Groups</h3>
            <p className="text-xs text-slate-500 mt-1">{groups.length} groups available</p>
          </div>
          <button
            type="button"
            onClick={fetchGroups}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <MdRefresh /> Refresh
          </button>
        </div>

        {loading ? (
          <TableState message="Loading software groups..." />
        ) : groups.length === 0 ? (
          <TableState message="No software groups found yet." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Software Group Name</th>
                  <th className="px-6 py-4">Assigned Users</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {groups.map((group) => (
                  <tr key={group.id} className="hover:bg-teal-50/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">#GRP-{String(group.id).padStart(3, '0')}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{group.group_name}</td>
                    <td className="px-6 py-4 text-sm text-teal-700">{group.users?.length || 0} linked</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(group)} />
                        <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(group)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
