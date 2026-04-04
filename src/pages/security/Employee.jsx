import { useEffect, useState } from 'react'
import {
  Card, Field, PageShell, SectionHeader,
  StatusAlert, TableState, ActionButton
} from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance'
import { MdPeople, MdBadge, MdApartment, MdBusiness } from 'react-icons/md'

const sectionStyles = {
  teal:    { accent: 'bg-teal-500',    header: 'border-teal-100 bg-teal-50/80' },
  emerald: { accent: 'bg-emerald-500', header: 'border-emerald-100 bg-emerald-50/80' },
  cyan:    { accent: 'bg-cyan-500',    header: 'border-cyan-100 bg-cyan-50/80' },
}

function SectionCard({ color = 'teal', title, children }) {
  const style = sectionStyles[color] ?? sectionStyles.teal
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm shadow-slate-100/50">
      <div className={`mb-2 flex items-center gap-2.5 rounded-md border px-2.5 py-1.5 ${style.header}`}>
        <span className={`h-4 w-1 rounded-full ${style.accent}`} />
        <h3 className="text-[13px] font-semibold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function createEmptyForm() {
  return {
    employeeName:  '',
    email:         '',
    companyId:     '',
    departmentId:  '',
    designationId: '',
  }
}

export default function EmployeePage() {
  const [form, setForm]               = useState(createEmptyForm)
  const [employees, setEmployees]     = useState([])
  const [companies, setCompanies]     = useState([])
  const [departments, setDepartments] = useState([])
  const [designations, setDesignations] = useState([])
  const [loading, setLoading]         = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [editId, setEditId]           = useState(null)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')

  // ── On mount: fetch employees + dropdowns ──────────────────────────────────
  useEffect(() => {
    fetchEmployees()
    fetchDropdowns()
  }, [])

  async function fetchDropdowns() {
    try {
      const [companiesRes, departmentsRes, designationsRes] = await Promise.all([
        axiosInstance.get('/companies'),
        axiosInstance.get('/departments'),
        axiosInstance.get('/designations'),
      ])
      setCompanies(Array.isArray(companiesRes.data)     ? companiesRes.data     : companiesRes.data.data     || [])
      setDepartments(Array.isArray(departmentsRes.data) ? departmentsRes.data   : departmentsRes.data.data   || [])
      setDesignations(Array.isArray(designationsRes.data) ? designationsRes.data : designationsRes.data.data || [])
    } catch (err) {
      setError('Failed to load dropdown data.')
    }
  }

  async function fetchEmployees() {
    setLoading(true)
    setError('')
    try {
      const res  = await axiosInstance.get('/employees')
      const data = res.data
      setEmployees(Array.isArray(data) ? data : data.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load employees.')
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.employeeName.trim() || !form.email.trim())
      return setError('Employee Name and Email are required.')

    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        employeeName:  form.employeeName.trim(),
        email:         form.email.trim(),
        companyId:     form.companyId     || null,
        departmentId:  form.departmentId  || null,
        designationId: form.designationId || null,
      }

      if (editId) {
        await axiosInstance.put(`/employees/${editId}`, payload)
      } else {
        await axiosInstance.post('/employees', payload)
      }

      setSuccess(editId ? 'Employee updated successfully.' : 'Employee created successfully.')
      resetForm()
      fetchEmployees()
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save employee.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this employee?')) return
    try {
      await axiosInstance.delete(`/employees/${id}`)
      setSuccess('Employee deleted successfully.')
      if (editId === id) resetForm()
      fetchEmployees()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete employee.')
    }
  }

  function handleEdit(emp) {
    setEditId(emp.id)
    setForm({
      employeeName:  emp.employee_name  || '',
      email:         emp.email          || '',
      companyId:     emp.company_id     || '',
      departmentId:  emp.department_id  || '',
      designationId: emp.designation_id || '',
    })
    setError('')
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditId(null)
    setForm(createEmptyForm())
    setError('')
  }

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const inputCls = "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
  const selectCls = `${inputCls} appearance-none cursor-pointer`

  return (
    <PageShell
      title="Employee Management"
      description="Register and manage organization staff members"
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-5">
        <Card className="mx-auto max-w-5xl border-l-[6px] border-l-teal-500 p-3.5">
          <SectionHeader
            title={editId ? 'Edit Employee' : 'Add New Employee'}
            description="Register a new staff member to the organization."
            icon={<MdPeople className="h-6 w-6" />}
            action={editId && (
              <button type="button" onClick={resetForm}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                Cancel Edit
              </button>
            )}
          />

          <StatusAlert type="error"   message={error}   />
          <StatusAlert type="success" message={success} />

          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            <div className="grid gap-3 lg:grid-cols-[1fr_minmax(0,1fr)]">

              {/* ── Left: Identity ── */}
              <SectionCard color="teal" title="Employee Identity">
                <div className="grid gap-4">
                  {/* Auto-generated code — read only */}
                  <Field label="Employee #Code">
                    <input
                      type="text"
                      disabled
                      value={editId ? `EMP-ID-${editId}` : 'Auto Generated'}
                      className="h-10 w-full rounded-md border border-slate-100 bg-slate-50 px-3 text-[13px] font-mono text-slate-400 cursor-not-allowed"
                    />
                  </Field>

                  <Field label="Employee Name" required>
                    <input
                      type="text"
                      value={form.employeeName}
                      onChange={e => updateField('employeeName', e.target.value)}
                      placeholder="Full name"
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Email Address" required>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => updateField('email', e.target.value)}
                      placeholder="employee@company.com"
                      className={inputCls}
                    />
                  </Field>
                </div>
              </SectionCard>

              {/* ── Right: Assignment + Actions ── */}
              <div className="flex flex-col gap-3">
                <SectionCard color="emerald" title="Assignment">
                  <div className="grid gap-4">

                    <Field label="Company">
                      <div className="relative">
                        <select
                          value={form.companyId}
                          onChange={e => updateField('companyId', e.target.value)}
                          className={selectCls}
                        >
                          <option value="">Select Company</option>
                          {companies.map(c => (
                            <option key={c.id} value={c.id}>{c.company_name}</option>
                          ))}
                        </select>
                        <MdBusiness className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                      </div>
                    </Field>

                    <Field label="Department">
                      <div className="relative">
                        <select
                          value={form.departmentId}
                          onChange={e => updateField('departmentId', e.target.value)}
                          className={selectCls}
                        >
                          <option value="">Select Department</option>
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.department_name}</option>
                          ))}
                        </select>
                        <MdApartment className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                      </div>
                    </Field>

                    <Field label="Designation">
                      <div className="relative">
                        <select
                          value={form.designationId}
                          onChange={e => updateField('designationId', e.target.value)}
                          className={selectCls}
                        >
                          <option value="">Select Designation</option>
                          {designations.map(d => (
                            <option key={d.id} value={d.id}>{d.designation_name}</option>
                          ))}
                        </select>
                        <MdBadge className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                      </div>
                    </Field>
                  </div>
                </SectionCard>

                <SectionCard color="cyan" title="Actions">
                  <div className="flex justify-center gap-2 pt-1">
                    <button type="button" onClick={resetForm}
                      className="inline-flex min-w-[120px] items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                      Clear
                    </button>
                    <button type="submit" disabled={submitting}
                      className="inline-flex min-w-[140px] items-center justify-center rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">
                      {submitting ? 'Saving...' : editId ? 'Update Employee' : 'Save Employee'}
                    </button>
                  </div>
                </SectionCard>
              </div>
            </div>
          </form>
        </Card>

        {/* ── Table ── */}
        <Card className="mx-auto max-w-5xl">
          <SectionHeader
            title="Employee Directory"
            description={`${employees.length} registered employees`}
            icon={<MdPeople className="h-6 w-6" />}
            action={
              <button type="button" onClick={fetchEmployees}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                Refresh
              </button>
            }
          />

          {loading ? (
            <TableState message="Loading employees..." />
          ) : employees.length === 0 ? (
            <TableState message="No employees registered yet." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="overflow-x-auto lg:max-h-[500px] lg:overflow-y-auto w-full">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      <th className="px-4 py-4">Code</th>
                      <th className="px-4 py-4">Name</th>
                      <th className="px-4 py-4">Email</th>
                      <th className="px-4 py-4">Company</th>
                      <th className="px-4 py-4">Department</th>
                      <th className="px-4 py-4">Designation</th>
                      <th className="px-4 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {employees.map(emp => (
                      <tr key={emp.id}
                        className={`text-sm transition hover:bg-slate-50/50 ${editId === emp.id ? 'bg-teal-50/40' : ''}`}>
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-[11px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-md">
                            {emp.employee_code}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-900">{emp.employee_name}</td>
                        <td className="px-4 py-3.5 text-slate-500">{emp.email}</td>
                        <td className="px-4 py-3.5 text-slate-500">{emp.company_name  || '—'}</td>
                        <td className="px-4 py-3.5 text-slate-500">{emp.department_name  || '—'}</td>
                        <td className="px-4 py-3.5 text-slate-500">{emp.designation_name || '—'}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex justify-end gap-2">
                            <ActionButton label="Edit"   tone="teal" onClick={() => handleEdit(emp)}      />
                            <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(emp.id)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  )
}