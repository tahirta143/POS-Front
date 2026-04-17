import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, SectionHeader, Field, ActionButton, TableState } from '../../components/layout/PageShell.jsx'
import { MdArrowBack, MdSave, MdGroupWork, MdRefresh, MdAdd, MdRemove } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../services/axiosInstance.js'

function generateGroupId() {
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `GRP-${new Date().getFullYear()}-${rand}`
}

export default function Groups() {
  const navigate = useNavigate()

  const [groups, setGroups]       = useState([])
  const [loading, setLoading]     = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editId, setEditId]       = useState(null)
  const [groupName, setGroupName] = useState('')
  const [groupId]                 = useState(generateGroupId)

  useEffect(() => { fetchGroups() }, [])

  async function fetchGroups() {
    setLoading(true)
    try {
      const res = await axiosInstance.get('/groups')
      setGroups(Array.isArray(res.data) ? res.data : res.data?.data || [])
    } catch {
      toast.error('Failed to load groups.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!groupName.trim()) { toast.error('Group name is required.'); return }

    setSubmitting(true)
    try {
      if (editId) {
        await axiosInstance.put(`/groups/${editId}`, { group_name: groupName.trim() })
        toast.success('Group updated successfully.')
      } else {
        await axiosInstance.post('/groups', { group_name: groupName.trim() })
        toast.success('Group created successfully.')
      }
      resetForm()
      setIsFormOpen(false)
      fetchGroups()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save group.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this group? This may affect assigned users.')) return
    try {
      await axiosInstance.delete(`/groups/${id}`)
      toast.success('Group deleted.')
      if (editId === id) resetForm()
      fetchGroups()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete group.')
    }
  }

  function handleEdit(group) {
    setEditId(group.id)
    setGroupName(group.group_name || '')
    setIsFormOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditId(null)
    setGroupName('')
  }

  return (
    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">

      {/* Back button */}
      <button
        onClick={() => navigate('/security')}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-teal-300 bg-teal-50 px-3 py-1.5 text-[11px] font-semibold text-teal-700 hover:bg-teal-100 transition"
      >
        <MdArrowBack /> Back to Overview
      </button>

      {/* Header + toggle button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">User Groups</h1>
          <p className="text-sm text-slate-500">Create and manage system access groups.</p>
        </div>
        <button
          onClick={() => {
            if (isFormOpen && editId) { resetForm(); return }
            const opening = !isFormOpen
            setIsFormOpen(opening)
            if (opening) resetForm()
          }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition shadow-sm ${
            isFormOpen
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              : 'bg-teal-600 text-white hover:bg-teal-700 hover:shadow-teal-100'
          }`}
        >
          {isFormOpen
            ? <><MdRemove className="h-5 w-5" /> Close Form</>
            : <><MdAdd    className="h-5 w-5" /> Add Group</>
          }
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <Card className="border-l-[6px] border-l-teal-500 p-6 shadow-sm">
              <SectionHeader
                title={editId ? 'Edit Group' : 'Add New Group'}
                description="Define a user group to assign roles and access rights."
                icon={<MdGroupWork className="text-teal-600 text-2xl" />}
              />

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <Field label="Group ID">
                    <input
                      type="text"
                      value={editId ? `#${editId}` : groupId}
                      disabled
                      className="h-8 w-full rounded-md border border-slate-100 bg-slate-50 px-2.5 text-[12px] font-mono text-slate-400"
                    />
                  </Field>
                  <Field label="Group Name" required>
                    <input
                      type="text"
                      value={groupName}
                      onChange={e => setGroupName(e.target.value)}
                      placeholder="e.g. System Administrators"
                      className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      required
                    />
                  </Field>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => { resetForm(); setIsFormOpen(false) }}
                    className="px-6 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2 text-sm font-bold text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition disabled:opacity-50"
                  >
                    <MdSave />
                    {submitting ? 'Saving...' : editId ? 'Update Group' : 'Save Group'}
                  </button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <Card className="border-l-[6px] border-l-teal-500 p-0 overflow-hidden shadow-sm">
        <SectionHeader
          title="Existing User Groups"
          description={`${groups.length} group${groups.length !== 1 ? 's' : ''} registered`}
          icon={<MdGroupWork className="text-teal-600 text-xl" />}
          action={
            <div className="p-4">
              <button
                type="button"
                onClick={fetchGroups}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                <MdRefresh className="inline mr-1" /> Refresh
              </button>
            </div>
          }
        />

        {loading ? (
          <TableState message="Loading groups..." />
        ) : groups.length === 0 ? (
          <TableState message="No groups found. Click 'Add Group' to create one." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Group ID</th>
                  <th className="px-6 py-3">Group Name</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {groups.map((group, idx) => (
                  <motion.tr
                    key={group.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`hover:bg-teal-50/20 transition-colors ${editId === group.id ? 'bg-teal-50/40' : ''}`}
                  >
                    <td className="px-6 py-3.5 text-[11px] text-slate-400 font-mono">{idx + 1}</td>
                    <td className="px-6 py-3.5 font-mono text-[11px] text-slate-400">
                      #{String(group.id).padStart(4, '0')}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-700 text-[13px]">
                      {group.group_name}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[9px] font-bold text-teal-700 uppercase tracking-wider">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-end gap-2">
                        <ActionButton label="Edit"   tone="teal" onClick={() => handleEdit(group)} />
                        <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(group.id)} />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

    </div>
  )
}