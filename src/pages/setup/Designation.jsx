import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Card, Field, PageShell, SectionHeader, TableState, ActionButton } from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance.js'
import { MdBadge } from 'react-icons/md'

const sectionStyles = {
  teal:    { accent: 'bg-teal-500',    header: 'border-teal-100 bg-teal-50/80' },
  emerald: { accent: 'bg-emerald-500', header: 'border-emerald-100 bg-emerald-50/80' },
  cyan:    { accent: 'bg-cyan-500',    header: 'border-cyan-100 bg-cyan-50/80' },
}

function SectionCard({ color = 'teal', title, children }) {
  const style = sectionStyles[color] ?? sectionStyles.teal
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm shadow-slate-100/50">
      <div className={`mb-2 flex items-center gap-2 rounded-md border px-2 py-1 ${style.header}`}>
        <span className={`h-3 w-1 rounded-full ${style.accent}`} />
        <h3 className="text-[12px] font-semibold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function createEmptyForm() {
  return { designationName: '', description: '' }
}

export default function Designation() {
  const [form, setForm] = useState(createEmptyForm)
  const [designations, setDesignations] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState(null)

  useEffect(() => { fetchDesignations() }, [])

  async function fetchDesignations() {
    setLoading(true)
    try {
      const res = await axiosInstance.get('/designations')
      const data = res.data
      setDesignations(Array.isArray(data) ? data : data.data || [])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load designations.')
      setDesignations([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.designationName.trim()) {
      toast.error('Designation Name is required.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        designationName: form.designationName.trim(),
        description: form.description.trim(),
      }
      if (editId) {
        await axiosInstance.put(`/designations/${editId}`, payload)
        toast.success('Designation updated successfully.')
      } else {
        await axiosInstance.post('/designations', payload)
        toast.success('Designation created successfully.')
      }
      resetForm()
      fetchDesignations()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to save designation.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this designation?')) return
    try {
      await axiosInstance.delete(`/designations/${id}`)
      toast.success('Designation deleted successfully.')
      if (editId === id) resetForm()
      fetchDesignations()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete designation.')
    }
  }

  function handleEdit(desig) {
    setEditId(desig.id)
    setForm({ designationName: desig.designation_name || '', description: desig.description || '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditId(null)
    setForm(createEmptyForm())
  }

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const inputCls = "h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"

  return (
    <PageShell
      title="Designation Management"
      description="Create and manage employee designations"
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-4">
        <Card className="mx-auto max-w-5xl border-l-[6px] border-l-teal-500 p-3">
          <SectionHeader
            title={editId ? 'Edit Designation' : 'Add Designation'}
            description="Manage designation records."
            icon={<MdBadge className="h-5 w-5" />}
            action={editId && (
              <button type="button" onClick={resetForm}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50">
                Cancel Edit
              </button>
            )}
          />

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 lg:grid-cols-[1fr_minmax(0,1fr)]">
              <SectionCard color="teal" title="Designation Details">
                <div className="grid gap-3">
                  <Field label="Designation Name" required>
                    <input type="text" value={form.designationName}
                      onChange={e => updateField('designationName', e.target.value)}
                      placeholder="e.g. Senior Developer"
                      className={inputCls} />
                  </Field>
                  <Field label="Description">
                    <textarea rows={2} value={form.description}
                      onChange={e => updateField('description', e.target.value)}
                      placeholder="Brief description of this designation"
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard color="cyan" title="Actions">
                <div className="flex justify-center gap-2 pt-1">
                  <button type="button" onClick={resetForm}
                    className="inline-flex min-w-[100px] items-center justify-center rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50">
                    Clear
                  </button>
                  <button type="submit" disabled={submitting}
                    className="inline-flex min-w-[110px] items-center justify-center rounded-lg bg-teal-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">
                    {submitting ? 'Saving...' : editId ? 'Update' : 'Save'}
                  </button>
                </div>
              </SectionCard>
            </div>
          </form>
        </Card>

        <Card className="mx-auto max-w-5xl p-3">
          <SectionHeader
            title="Designation Registry"
            description={`${designations.length} designations`}
            icon={<MdBadge className="h-5 w-5" />}
            action={
              <button type="button" onClick={fetchDesignations}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50">
                Refresh
              </button>
            }
          />
          {loading ? <TableState message="Loading designations..." /> :
           designations.length === 0 ? <TableState message="No designations found yet." /> : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="overflow-x-auto lg:max-h-[500px] lg:overflow-y-auto w-full">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      <th className="px-3 py-2 w-12">#</th>
                      <th className="px-3 py-2">Designation Name</th>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2 text-right w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {designations.map((d, i) => (
                      <tr key={d.id} className={`text-[11px] transition hover:bg-slate-50/50 ${editId === d.id ? 'bg-teal-50/40' : ''}`}>
                        <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-slate-900">{d.designation_name}</td>
                        <td className="px-3 py-2 text-slate-500 max-w-xs truncate text-[10px]">{d.description || '—'}</td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1.5">
                            <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(d)} />
                            <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(d.id)} />
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