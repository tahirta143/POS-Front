import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card, Field, PageShell, SectionHeader,
  StatusAlert, TableState, ActionButton
} from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance'
import { MdPeople, MdBadge, MdApartment, MdBusiness, MdArrowBack } from 'react-icons/md'

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
  const navigate = useNavigate()
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
  const [isFormOpen, setIsFormOpen]   = useState(false)

  // On mount: fetch employees + dropdowns
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
    } catch {
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
      setIsFormOpen(false)
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
    setIsFormOpen(true)
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditId(null)
    setForm(createEmptyForm())
    setError('')
  }

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const inputCls = "h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
  const selectCls = `${inputCls} appearance-none cursor-pointer`

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
              <h1 className="text-xl font-bold text-slate-900">Employee Management</h1>
              <p className="text-sm text-slate-500">Register and manage organization staff members</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isFormOpen && editId) {
                resetForm()
              } else {
                setIsFormOpen(!isFormOpen)
                if (!isFormOpen) resetForm()
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
                Add Employee
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
              <Card className="mx-auto max-w-5xl border-l-[6px] border-l-teal-500 p-4 mb-6">
                <SectionHeader
                  title={editId ? 'Edit Employee Identity' : 'New Employee Onboarding'}
                  description="Fill in the staff personal and placement details."
                  icon={<MdPeople className="h-6 w-6" />}
                />

                <StatusAlert type="error"   message={error}   />
                <StatusAlert type="success" message={success} />

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <SectionCard color="teal" title="Identity Details">
                      <div className="grid gap-3">
                        <Field label="Employee #Code">
                           <input
                             type="text"
                             disabled
                             value={editId ? `EMP-ID-${editId}` : 'Auto Generated'}
                             className="h-8 w-full rounded-md border border-slate-100 bg-slate-50 px-2.5 text-[12px] font-mono text-slate-400 cursor-not-allowed"
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

                    <SectionCard color="emerald" title="Assignment & Placement">
                      <div className="grid gap-3">
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
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetForm()
                        setIsFormOpen(false)
                      }}
                      className="inline-flex min-w-[100px] items-center justify-center rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex min-w-[140px] items-center justify-center rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-700 shadow-sm shadow-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? 'Saving...' : editId ? 'Update Employee' : 'Save Employee'}
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Directory Table */}
        <Card className="mx-auto max-w-5xl p-0 overflow-hidden">
          <SectionHeader
            title="Employee Directory"
            description={`${employees.length} registered employees`}
            icon={<MdPeople className="h-6 w-6" />}
            action={
              <div className="p-4">
                <button
                  type="button"
                  onClick={fetchEmployees}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Refresh Directory
                </button>
              </div>
            }
          />

          {loading ? (
            <TableState message="Loading employees..." />
          ) : employees.length === 0 ? (
            <TableState message="No employees registered yet." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">Code</th>
                    <th className="px-5 py-4">Staff Details</th>
                    <th className="px-5 py-4">Placement</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {employees.map(emp => (
                    <motion.tr 
                      key={emp.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`group transition-colors hover:bg-teal-50/30 ${editId === emp.id ? 'bg-teal-50/50' : ''}`}
                    >
                      <td className="px-5 py-4">
                        <span className="font-mono text-[11px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">
                          {emp.employee_code}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{emp.employee_name}</span>
                          <span className="text-[11px] text-slate-400 font-medium">{emp.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[12px] font-semibold text-slate-600">{emp.designation_name || 'No Designation'}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">{emp.department_name || '-'}</span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[10px] text-slate-400">{emp.company_name || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(emp)} />
                          <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(emp.id)} />
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
