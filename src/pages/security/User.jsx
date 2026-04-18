import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MdArrowBack, MdLockPerson, MdEmail, MdVpnKey, MdPerson, MdBusiness, MdBadge, MdGroup } from 'react-icons/md'
import axiosInstance from '../../services/axiosInstance'
import {
  ActionButton,
  Card,
  Field,
  PageShell,
  SectionHeader,
  StatusAlert,
  TableState,
} from '../../components/layout/PageShell.jsx'

const USER_META_KEY = 'pos_security_user_meta_v1'

function emptyForm() {
  return {
    username: '',
    email: '',
    password: '',
    role: 'User',
    group_id: '',
    status: 'active',
  }
}

export default function User() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [groups, setGroups] = useState([])
  const [users, setUsers] = useState([])
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)

  useEffect(() => {
    fetchPageData()
  }, [])

  async function fetchPageData() {
    setLoading(true)
    setMessage('')
    try {
      const [groupsResponse, usersResponse] = await Promise.all([
        axiosInstance.get('/groups'),
        axiosInstance.get('/auth/users'),
      ])
      setGroups(Array.isArray(groupsResponse.data) ? groupsResponse.data : [])
      setUsers(Array.isArray(usersResponse.data.data) ? usersResponse.data.data : [])
    } catch (error) {
      setGroups([])
      setUsers([])
      setMessage(error?.response?.data?.message || 'Users could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSave(event) {
    event.preventDefault()
    if (!form.username.trim() || !form.email.trim() || (!editId && !form.password.trim())) {
      toast.error('Username, email, and password are required.')
      return
    }

    setSubmitting(true)
    setMessage('')
    try {
      const payload = {
        name: form.username.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        role: form.role,
        group_id: form.group_id,
        status: form.status,
      }
      
      if (form.password) payload.password = form.password;

      if (editId) {
        await axiosInstance.put(`/auth/users/${editId}`, payload)
        toast.success('User updated successfully.')
      } else {
        await axiosInstance.post('/auth/users', payload)
        toast.success('User created successfully.')
      }

      resetForm()
      setIsFormOpen(false)
      fetchPageData()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to save user.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleEdit(userRow) {
    setEditId(userRow.id)
    setForm({
      username: userRow.username || userRow.name || '',
      email: userRow.email || '',
      password: '', // Don't show password on edit
      role: userRow.role || 'User',
      group_id: userRow.group_id || '',
      status: userRow.status || 'active',
    })
    setMessage('')
    setIsFormOpen(true)
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(userRow) {
    if (!window.confirm(`Delete "${userRow.name || userRow.username}"?`)) return
    try {
      await axiosInstance.delete(`/auth/users/${userRow.id}`)
      toast.success('User deleted successfully.')
      if (editId === userRow.id) resetForm()
      fetchPageData()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to delete user.')
    }
  }

  function resetForm() {
    setEditId(null)
    setForm(emptyForm())
    setMessage('')
  }

  const inputCls = "h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button
              onClick={() => navigate('/security')}
              className="group flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-600"
            >
              <MdArrowBack className="h-5 w-5 transition group-hover:-translate-x-0.5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">User Management</h1>
              <p className="text-sm text-slate-500">Create and manage software access credentials</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isFormOpen && editId) {
                resetForm()
                document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
              } else {
                const opening = !isFormOpen
                setIsFormOpen(opening)
                if (opening) {
                  resetForm()
                  document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
                }
              }
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition duration-300 shadow-sm ${
              isFormOpen 
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                : 'bg-teal-600 text-white hover:bg-teal-700 hover:shadow-teal-100'
            }`}
          >
            {isFormOpen ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Close Form
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Add User
              </>
            )}
          </button>
        </div>

        {/* Collapsible Form */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <Card className="mx-auto max-w-5xl border-l-[6px] border-l-teal-500 p-6 mb-6">
                <SectionHeader
                  title={editId ? 'Edit User' : 'Add New User'}
                  description="Create system credentials and assign them to security groups."
                  icon={<MdLockPerson className="text-teal-600 text-3xl" />}
                />

                <StatusAlert type="error" message={message} />

                <form onSubmit={handleSave} className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Field label="User ID">
                      <input
                        type="text"
                        className="h-8 w-full rounded-md border border-slate-100 bg-slate-50 px-2.5 text-[12px] font-mono"
                        value={editId ? `USR-${String(editId).padStart(4, '0')}` : 'Auto generated'}
                        disabled
                      />
                    </Field>
                    <Field label="Username" required>
                      <div className="relative">
                        <input type="text" name="username" value={form.username} onChange={handleChange} className={inputCls} required />
                        <MdPerson className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </Field>
                    <Field label="Security Group">
                       <div className="relative">
                        <select name="group_id" value={form.group_id} onChange={handleChange} className={`${inputCls} appearance-none pr-8`}>
                          <option value="">No Group</option>
                          {groups.map((group) => (
                            <option key={group.id} value={group.id}>{group.group_name}</option>
                          ))}
                        </select>
                        <MdGroup className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2 border-b border-slate-100">
                    <Field label="Email Address" required>
                      <div className="relative">
                        <input type="email" name="email" value={form.email} onChange={handleChange} className={inputCls} required />
                        <MdEmail className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </Field>
                    <Field label="Password" required={!editId}>
                      <div className="relative">
                        <input type="password" name="password" value={form.password} onChange={handleChange} className={inputCls} placeholder={editId ? "Leave blank to keep current" : ""} required={!editId} />
                        <MdVpnKey className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Role Selection">
                      <select name="role" value={form.role} onChange={handleChange} className={inputCls}>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                      </select>
                    </Field>
                    <Field label="Account Status">
                      <select name="status" value={form.status} onChange={handleChange} className={inputCls}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </Field>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        resetForm()
                        setIsFormOpen(false)
                      }}
                      className="rounded-xl border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2 text-sm font-bold text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition disabled:opacity-50">
                      {submitting ? 'Saving...' : editId ? 'Update User' : 'Save User'}
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="mx-auto max-w-5xl p-0 overflow-hidden">
          <SectionHeader
            title="Registered Users"
            description={`${users.length} accounts found`}
            icon={<MdLockPerson className="h-6 w-6 text-teal-600" />}
            action={
              <div className="p-4">
                <button
                  type="button"
                  onClick={fetchPageData}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Refresh
                </button>
              </div>
            }
          />
          {loading ? (
            <TableState message="Loading users..." />
          ) : users.length === 0 ? (
            <TableState message="No users recorded yet." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">User Details</th>
                    <th className="px-5 py-3">Security Group</th>
                    <th className="px-5 py-3">Access Level</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {users.map((row) => (
                    <motion.tr 
                      key={row.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`group transition-colors hover:bg-teal-50/30 ${editId === row.id ? 'bg-teal-50/50' : ''}`}
                    >
                      <td className="px-5 py-4 font-mono text-[11px] text-slate-400">#USR-{String(row.id).padStart(3, '0')}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{row.username || row.name}</span>
                          <span className="text-[11px] text-slate-400">{row.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[12px] font-semibold text-slate-600">
                        {row.group_name || '—'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            row.role === 'admin' ? 'bg-rose-50 text-rose-700' : 'bg-teal-50 text-teal-700'
                          }`}>
                            {row.role}
                          </span>
                          <span className={`h-2 w-2 rounded-full ${row.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(row)} />
                          <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(row)} />
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
    </PageShell>
  )
}
