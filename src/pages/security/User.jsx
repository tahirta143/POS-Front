import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { MdArrowBack, MdLockPerson } from 'react-icons/md'
import axiosInstance from '../../services/axiosInstance'
import {
  ActionButton,
  Card,
  Field,
  SectionHeader,
  StatusAlert,
  TableState,
} from '../../components/layout/PageShell.jsx'

const USER_META_KEY = 'pos_security_user_meta_v1'

function emptyForm() {
  return {
    username: '',
    companyId: '',
    employeeId: '',
    email: '',
    password: '',
    role: 'User',
    status: 'active',
    description: '',
  }
}

function readUserMeta() {
  try {
    return JSON.parse(localStorage.getItem(USER_META_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeUserMeta(value) {
  localStorage.setItem(USER_META_KEY, JSON.stringify(value))
}

export default function User() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [companies, setCompanies] = useState([])
  const [employees, setEmployees] = useState([])
  const [users, setUsers] = useState([])
  const [userMeta, setUserMeta] = useState(readUserMeta)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchPageData()
  }, [])

  useEffect(() => {
    writeUserMeta(userMeta)
  }, [userMeta])

  async function fetchPageData() {
    setLoading(true)
    setMessage('')
    try {
      const [companiesResponse, employeesResponse, usersResponse] = await Promise.all([
        axiosInstance.get('/companies'),
        axiosInstance.get('/employees'),
        axiosInstance.get('/company-users'),
      ])
      setCompanies(Array.isArray(companiesResponse.data) ? companiesResponse.data : [])
      setEmployees(Array.isArray(employeesResponse.data) ? employeesResponse.data : [])
      setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : [])
    } catch (error) {
      setCompanies([])
      setEmployees([])
      setUsers([])
      setMessage(error?.response?.data?.message || 'Software users could not be loaded.')
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
    if (!form.username.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error('Username, email, and password are required.')
      return
    }

    const selectedEmployee = employees.find((row) => String(row.id) === String(form.employeeId))
    const designation = selectedEmployee?.designation_name || selectedEmployee?.employee_name || form.role

    setSubmitting(true)
    setMessage('')
    try {
      const payload = {
        name: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        designation,
        number: '',
        status: form.status,
      }

      let savedId = editId
      if (editId) {
        await axiosInstance.put(`/company-users/${editId}`, payload)
        toast.success('Software user updated successfully.')
      } else {
        const response = await axiosInstance.post('/company-users', payload)
        savedId = response.data?.id
        toast.success('Software user created successfully.')
      }

      if (savedId) {
        setUserMeta((prev) => ({
          ...prev,
          [savedId]: {
            companyId: form.companyId,
            employeeId: form.employeeId,
            role: form.role,
            description: form.description,
          },
        }))
      }

      resetForm()
      fetchPageData()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to save software user.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleEdit(userRow) {
    const meta = userMeta[userRow.id] || {}
    setEditId(userRow.id)
    setForm({
      username: userRow.name || userRow.username || '',
      companyId: meta.companyId || '',
      employeeId: meta.employeeId || '',
      email: userRow.email || '',
      password: userRow.password || '',
      role: meta.role || 'User',
      status: userRow.status || 'active',
      description: meta.description || '',
    })
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(userRow) {
    if (!window.confirm(`Delete "${userRow.name || userRow.username}"?`)) return
    try {
      await axiosInstance.delete(`/company-users/${userRow.id}`)
      setUserMeta((prev) => {
        const next = { ...prev }
        delete next[userRow.id]
        return next
      })
      toast.success('Software user deleted successfully.')
      if (editId === userRow.id) resetForm()
      fetchPageData()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to delete software user.')
    }
  }

  function resetForm() {
    setEditId(null)
    setForm(emptyForm())
    setMessage('')
  }

  const rows = useMemo(() => {
    return users.map((userRow) => {
      const meta = userMeta[userRow.id] || {}
      const company = companies.find((row) => String(row.id) === String(meta.companyId))
      const employee = employees.find((row) => String(row.id) === String(meta.employeeId))
      return {
        ...userRow,
        companyName: company?.company_name || '-',
        employeeName: employee?.employee_name || '-',
        role: meta.role || 'User',
        description: meta.description || '',
      }
    })
  }, [companies, employees, userMeta, users])

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4">
      <button
        onClick={() => navigate('/security')}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-teal-300 bg-teal-50 px-3 py-1.5 text-[11px] font-semibold text-teal-700 hover:bg-teal-100 transition"
      >
        <MdArrowBack /> Back to Overview
      </button>

      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <SectionHeader
          title={editId ? 'Edit Software User' : 'Add New User'}
          description="Create system credentials and keep company and employee links ready in the UI."
          icon={<MdLockPerson className="text-teal-600 text-3xl" />}
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

        <form onSubmit={handleSave} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="User ID">
              <input
                type="text"
                className="h-8 w-full rounded-md border border-slate-100 bg-slate-50 px-2.5 text-[12px] font-mono"
                value={editId ? `USR-${String(editId).padStart(4, '0')}` : 'Auto generated'}
                disabled
              />
            </Field>
            <Field label="Username" required>
              <input type="text" name="username" value={form.username} onChange={handleChange} className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" required />
            </Field>
            <Field label="Company">
              <select name="companyId" value={form.companyId} onChange={handleChange} className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                <option value="">Select Company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.company_name}</option>
                ))}
              </select>
            </Field>
            <Field label="Employee">
              <select name="employeeId" value={form.employeeId} onChange={handleChange} className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                <option value="">Select Employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.employee_name}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <Field label="Email Address" required>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" required />
            </Field>
            <Field label="Password" required>
              <input type="text" name="password" value={form.password} onChange={handleChange} className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" required />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Role Selection">
              <select name="role" value={form.role} onChange={handleChange} className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="User">User</option>
              </select>
            </Field>
            <Field label="Account Status">
              <select name="status" value={form.status} onChange={handleChange} className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </Field>
          </div>

          <Field label="Description">
            <textarea name="description" value={form.description} onChange={handleChange} className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" rows="2" placeholder="User access notes..." />
          </Field>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Clear
            </button>
            <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2 text-sm font-bold text-white shadow-lg hover:bg-teal-700 transition disabled:opacity-50">
              {submitting ? 'Saving...' : editId ? 'Update User' : 'Save User'}
            </button>
          </div>
        </form>
      </Card>

      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Registered Users</h3>
        {loading ? (
          <TableState message="Loading users..." />
        ) : rows.length === 0 ? (
          <TableState message="No users recorded yet." />
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">User ID</th>
                  <th className="px-6 py-3">Username</th>
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Employee</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-6 py-3 font-mono text-xs text-slate-400">#USR-{String(row.id).padStart(3, '0')}</td>
                    <td className="px-6 py-3">
                      <div className="font-semibold text-slate-700">{row.name || row.username}</div>
                      <div className="text-xs text-slate-500">{row.email}</div>
                    </td>
                    <td className="px-6 py-3 text-slate-600">{row.companyName}</td>
                    <td className="px-6 py-3 text-slate-600">{row.employeeName}</td>
                    <td className="px-6 py-3 text-slate-600">{row.role}</td>
                    <td className="px-6 py-3 capitalize text-slate-600">{row.status || 'active'}</td>
                    <td className="px-6 py-3">
                      <div className="flex justify-end gap-2">
                        <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(row)} />
                        <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(row)} />
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
