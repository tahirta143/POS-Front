import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Card, Field, PageShell, SectionHeader, TableState, ActionButton } from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance'

const sectionStyles = {
  emerald: { accent: 'bg-emerald-500', header: 'border-emerald-100 bg-emerald-50/80' },
  teal: { accent: 'bg-teal-500', header: 'border-teal-100 bg-teal-50/80' },
  cyan: { accent: 'bg-cyan-500', header: 'border-cyan-100 bg-cyan-50/80' },
}

function SectionCard({ color, title, children }) {
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

function GridIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )
}

function createEmptyForm() {
  return {
    head: '',
    description: '',
  }
}

export default function ExpenseHeadPage() {
  const [form, setForm] = useState(createEmptyForm)
  const [expenseHeads, setExpenseHeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    fetchHeads()
  }, [])

  async function fetchHeads() {
    setLoading(true)
    try {
      const response = await axiosInstance.get('/expense-heads')
      const data = response.data
      setExpenseHeads(Array.isArray(data) ? data : data.data || [])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load expense heads.')
      setExpenseHeads([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.head.trim()) {
      toast.error('Expense head name is required.')
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        head: form.head.trim(),
        description: form.description.trim(),
      }

      if (editId) {
        await axiosInstance.put(`/expense-heads/${editId}`, payload)
      } else {
        await axiosInstance.post('/expense-heads', payload)
      }

      toast.success(editId ? 'Expense Head updated successfully.' : 'Expense Head defined successfully.')
      resetForm()
      fetchHeads()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to save expense head.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this expense head?')) return

    try {
      await axiosInstance.delete(`/expense-heads/${id}`)
      toast.success('Expense Head deleted successfully.')
      fetchHeads()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete expense head.')
    }
  }

  function handleEdit(eh) {
    setEditId(eh.id)
    setForm({
      head: eh.head || '',
      description: eh.description || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditId(null)
    setForm(createEmptyForm())
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <PageShell
      title="Expense Heads"
      description="Define distinct expense categories or heads."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-5">
        <Card className="mx-auto max-w-4xl border-l-[6px] border-l-teal-500 p-3.5">
          <SectionHeader
            title={editId ? 'Edit Expense Head' : 'Create Expense Head'}
            description="Categorize your operational and fixed costs."
            icon={<GridIcon className="h-6 w-6" />}
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            <SectionCard color="teal" title="Head Details">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Head Name" required className="sm:col-span-2">
                  <input
                    type="text"
                    value={form.head}
                    onChange={(e) => updateField('head', e.target.value)}
                    placeholder="e.g. Office Rent, Utility Bills, Salaries"
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] outline-none transition focus:border-teal-400 focus:ring-3 focus:ring-teal-100"
                  />
                </Field>
                <Field label="Description" className="sm:col-span-2">
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Details about what falls under this expense head"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[13px] outline-none transition focus:border-teal-400 focus:ring-3 focus:ring-teal-100"
                  />
                </Field>
              </div>
            </SectionCard>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex min-w-[120px] items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-w-[120px] items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Saving...' : editId ? 'Update Head' : 'Save Head'}
              </button>
            </div>
          </form>
        </Card>

        {/* List Card */}
        <Card className="mx-auto max-w-4xl">
          <SectionHeader
            title="Registered Expense Heads"
            description={`${expenseHeads.length} categories found`}
            icon={<GridIcon className="h-6 w-6" />}
            action={
              <button
                type="button"
                onClick={fetchHeads}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Refresh
              </button>
            }
          />

          {loading ? (
            <TableState message="Loading expense heads..." />
          ) : expenseHeads.length === 0 ? (
            <TableState message="No expense heads configured." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="overflow-x-auto lg:max-h-[500px] lg:overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      <th className="px-4 py-4 w-16">ID</th>
                      <th className="px-4 py-4 w-1/3">Head Name</th>
                      <th className="px-4 py-4">Description</th>
                      <th className="px-4 py-4 text-right w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {expenseHeads.map((eh) => (
                      <tr key={eh.id} className="text-sm border-t border-slate-50 transition hover:bg-slate-50/50">
                        <td className="px-4 py-3.5 text-slate-400">{eh.id}</td>
                        <td className="px-4 py-3.5 font-medium text-slate-900">{eh.head}</td>
                        <td className="px-4 py-3.5 text-slate-600">{eh.description || '-'}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex justify-end gap-2">
                            <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(eh)} />
                            <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(eh.id)} />
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