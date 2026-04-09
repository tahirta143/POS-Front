import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { MdArrowBack, MdExtension } from 'react-icons/md'
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
  return { moduleId: '', name: '' }
}

export default function ModuleFunctions() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [modules, setModules] = useState([])
  const [functionalities, setFunctionalities] = useState([])
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [filterModuleId, setFilterModuleId] = useState('')

  useEffect(() => {
    fetchPageData()
  }, [])

  async function fetchPageData() {
    setLoading(true)
    setMessage('')
    try {
      const [modulesResponse, functionsResponse] = await Promise.all([
        axiosInstance.get('/modules'),
        axiosInstance.get('/functionalities'),
      ])
      setModules(Array.isArray(modulesResponse.data) ? modulesResponse.data : [])
      setFunctionalities(Array.isArray(functionsResponse.data) ? functionsResponse.data : [])
    } catch {
      setModules([])
      setFunctionalities([])
      setMessage('Module functions could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.moduleId || !form.name.trim()) {
      toast.error('Module and function name are required.')
      return
    }

    setSubmitting(true)
    setMessage('')
    try {
      const payload = { moduleId: Number(form.moduleId), name: form.name.trim() }
      if (editId) {
        await axiosInstance.put(`/functionalities/${editId}`, payload)
        toast.success('Module function updated successfully.')
      } else {
        await axiosInstance.post('/functionalities', payload)
        toast.success('Module function created successfully.')
      }
      resetForm()
      fetchPageData()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to save module function.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleEdit(row) {
    setEditId(row.id)
    setForm({
      moduleId: String(row.module_id || ''),
      name: row.name || '',
    })
    setMessage('')
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(row) {
    if (!window.confirm(`Delete "${row.name}"?`)) return
    try {
      await axiosInstance.delete(`/functionalities/${row.id}`)
      toast.success('Module function deleted successfully.')
      if (editId === row.id) resetForm()
      fetchPageData()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to delete module function.')
    }
  }

  function resetForm() {
    setEditId(null)
    setForm(emptyForm())
    setMessage('')
  }

  const visibleFunctions = useMemo(() => {
    if (!filterModuleId) return functionalities
    return functionalities.filter((row) => String(row.module_id) === String(filterModuleId))
  }, [filterModuleId, functionalities])

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <button
        onClick={() => navigate('/security')}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-teal-300 bg-teal-50 px-3 py-1.5 text-[11px] font-semibold text-teal-700 hover:bg-teal-100 transition"
      >
        <MdArrowBack /> Back to Overview
      </button>
      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <SectionHeader
          title={editId ? 'Edit Module Function' : 'Module Functions'}
          description="Define specific actions or buttons available within modules."
          icon={<MdExtension className="text-teal-600 text-3xl" />}
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

        <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <Field label="Function ID">
            <input
              type="text"
              className="h-8 w-full rounded-md border border-slate-100 bg-slate-50 px-2.5 text-[12px] font-mono text-slate-500"
              value={editId ? `FUNC-${String(editId).padStart(4, '0')}` : 'Auto generated'}
              disabled
            />
          </Field>
          <Field label="Module Selection" required>
            <select
              value={form.moduleId}
              onChange={(event) => setForm((prev) => ({ ...prev, moduleId: event.target.value }))}
              className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              <option value="">Select Module</option>
              {modules.map((moduleRow) => (
                <option key={moduleRow.id} value={moduleRow.id}>{moduleRow.module_name}</option>
              ))}
            </select>
          </Field>
          <Field label="Function Name" required>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              placeholder="e.g. Create Invoice"
              required
            />
          </Field>
          <div className="md:col-span-3 flex justify-end gap-3">
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
              className="flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2 text-sm font-bold text-white shadow-lg hover:bg-teal-700 transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editId ? 'Update Function' : 'Save Function'}
            </button>
          </div>
        </form>
      </Card>

      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-700">Registered Module Functions</h3>
            <p className="text-xs text-slate-500 mt-1">{visibleFunctions.length} functions shown</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterModuleId}
              onChange={(event) => setFilterModuleId(event.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            >
              <option value="">All Modules</option>
              {modules.map((moduleRow) => (
                <option key={moduleRow.id} value={moduleRow.id}>{moduleRow.module_name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={fetchPageData}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>
        {loading ? (
          <TableState message="Loading module functions..." />
        ) : visibleFunctions.length === 0 ? (
          <TableState message="No module functions recorded yet." />
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Function ID</th>
                  <th className="px-6 py-3">Module</th>
                  <th className="px-6 py-3">Function Name</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {visibleFunctions.map((row) => (
                  <tr key={row.id}>
                    <td className="px-6 py-3 font-mono text-xs text-slate-400">#FUNC-{String(row.id).padStart(3, '0')}</td>
                    <td className="px-6 py-3 text-slate-600">{row.module_name || 'Unassigned'}</td>
                    <td className="px-6 py-3 font-semibold text-slate-700">{row.name}</td>
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
