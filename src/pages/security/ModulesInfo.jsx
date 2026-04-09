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
  return { moduleName: '', description: '' }
}

export default function ModuleInfo() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [modules, setModules] = useState([])
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchModules()
  }, [])

  async function fetchModules() {
    setLoading(true)
    setMessage('')
    try {
      const response = await axiosInstance.get('/modules')
      setModules(Array.isArray(response.data) ? response.data : [])
    } catch {
      setModules([])
      setMessage('Modules could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.moduleName.trim()) {
      toast.error('Module name is required.')
      return
    }

    setSubmitting(true)
    setMessage('')
    try {
      const payload = {
        moduleName: form.moduleName.trim(),
        description: form.description.trim(),
      }
      if (editId) {
        await axiosInstance.put(`/modules/${editId}`, payload)
        toast.success('Module updated successfully.')
      } else {
        await axiosInstance.post('/modules', payload)
        toast.success('Module created successfully.')
      }
      resetForm()
      fetchModules()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to save module.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleEdit(moduleRow) {
    setEditId(moduleRow.id)
    setForm({
      moduleName: moduleRow.module_name || '',
      description: moduleRow.description || '',
    })
    setMessage('')
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(moduleRow) {
    if (!window.confirm(`Delete "${moduleRow.module_name}"?`)) return
    try {
      await axiosInstance.delete(`/modules/${moduleRow.id}`)
      toast.success('Module deleted successfully.')
      if (editId === moduleRow.id) resetForm()
      fetchModules()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to delete module.')
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

      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <SectionHeader
          title={editId ? 'Edit Module' : 'Module Information'}
          description="Register and manage system-wide software modules."
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Module ID">
              <input
                type="text"
                className="h-8 w-full rounded-md border border-slate-100 bg-slate-50 px-2.5 text-[12px] font-mono text-slate-500"
                value={editId ? `MOD-${String(editId).padStart(4, '0')}` : 'Auto generated'}
                disabled
              />
            </Field>
            <Field label="Module Name" required>
              <input
                type="text"
                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                placeholder="e.g. Inventory Management"
                value={form.moduleName}
                onChange={(event) => setForm((prev) => ({ ...prev, moduleName: event.target.value }))}
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              rows="3"
              placeholder="Define the purpose of this module..."
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </Field>
          <div className="flex justify-end gap-3 pt-4">
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
              {submitting ? 'Saving...' : editId ? 'Update Module' : 'Save Module'}
            </button>
          </div>
        </form>
      </Card>

      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-700">Registered Modules</h3>
            <p className="text-xs text-slate-500 mt-1">{modules.length} modules configured</p>
          </div>
          <button
            type="button"
            onClick={fetchModules}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <MdRefresh /> Refresh
          </button>
        </div>

        {loading ? (
          <TableState message="Loading modules..." />
        ) : modules.length === 0 ? (
          <TableState message="No modules found." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Module Name</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {modules.map((moduleRow) => (
                  <tr key={moduleRow.id}>
                    <td className="px-6 py-3 font-mono text-xs text-slate-400">#MOD-{String(moduleRow.id).padStart(3, '0')}</td>
                    <td className="px-6 py-3 font-semibold text-slate-700">{moduleRow.module_name}</td>
                    <td className="px-6 py-3 text-slate-500">{moduleRow.description || 'No description added yet.'}</td>
                    <td className="px-6 py-3">
                      <div className="flex justify-end gap-2">
                        <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(moduleRow)} />
                        <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(moduleRow)} />
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
