import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Card, Field, PageShell, SectionHeader, StatusAlert, Toggle } from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance'

function createEmptyForm() {
  return {
    category_name: '',
    is_enable: true,
  }
}

export default function CategoryPage() {
  const [form, setForm] = useState(createEmptyForm)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    setLoading(true)
    try {
      const response = await axiosInstance.get('/categories')
      const data = response.data
      setCategories(Array.isArray(data) ? data : data.data || [])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load categories.')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.category_name.trim()) {
      toast.error('Category name is required.')
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        category_name: form.category_name.trim(),
        is_enable: form.is_enable ? 1 : 0,
      }
      if (editId) {
        await axiosInstance.put(`/categories/${editId}`, payload)
        toast.success('Category updated successfully.')
      } else {
        await axiosInstance.post('/categories', payload)
        toast.success('Category created successfully.')
      }
      resetForm()
      fetchCategories()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save category. Confirm the backend route exists.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this category?')) return

    try {
      await axiosInstance.delete(`/categories/${id}`)
      toast.success('Category deleted successfully.')
      fetchCategories()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete category.')
    }
  }

  function handleEdit(category) {
    setEditId(category.id)
    setForm({
      category_name: category.category_name || '',
      is_enable: category.is_enable === 1 || category.is_enable === true,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditId(null)
    setForm(createEmptyForm())
  }

  return (
    <PageShell>
      <div className="space-y-5">
        {/* Form card */}
        <Card className="border-l-[6px] border-l-teal-500">
          <SectionHeader
            title={editId ? 'Edit category' : 'New category'}
            description="Create or update a primary item classification."
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.53 0 1.04.21 1.41.59l7 7a2 2 0 010 2.82l-7 7a2 2 0 01-2.82 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
              </svg>
            }
          />

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <Field label="Category name" required hint="Example: Beverages, Snacks, Dairy">
              <input
                type="text"
                value={form.category_name}
                onChange={(e) => setForm((current) => ({ ...current, category_name: e.target.value }))}
                placeholder="Enter category name"
                className="h-10 w-full max-w-sm rounded-md border border-slate-300 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-teal-400 focus:ring-3 focus:ring-teal-100"
              />
            </Field>

            <Toggle
              enabled={form.is_enable}
              onChange={(value) => setForm((current) => ({ ...current, is_enable: value }))}
              label="Enable category"
              description="Enabled categories are visible in POS and inventory forms."
            />

            <div className="flex flex-wrap justify-end gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-w-40 items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Saving...' : editId ? 'Update category' : 'Add category'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          </form>
        </Card>

        {/* List card */}
        <Card>
          <SectionHeader
            title="Category list"
            description={`${categories.length} categories configured`}
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            }
            action={
              <button
                type="button"
                onClick={fetchCategories}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Refresh
              </button>
            }
          />

          {loading ? (
            <TableState message="Loading categories..." />
          ) : categories.length === 0 ? (
            <TableState message="No categories found yet." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="overflow-x-auto lg:max-h-88 lg:overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      <th className="px-4 py-4">#</th>
                      <th className="px-4 py-4">Name</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {categories.map((category, index) => (
                      <tr key={category.id ?? index} className="text-sm text-slate-700">
                        <td className="px-4 py-4 text-slate-400">{index + 1}</td>
                        <td className="px-4 py-4 font-medium text-slate-900">{category.category_name}</td>
                        <td className="px-4 py-4">
                          <StatusChip enabled={category.is_enable === 1 || category.is_enable === true} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(category)} />
                            <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(category.id)} />
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

function TableState({ message }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center text-sm text-slate-500">
      {message}
    </div>
  )
}

function StatusChip({ enabled }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
      }`}
    >
      {enabled ? 'Enabled' : 'Disabled'}
    </span>
  )
}

function ActionButton({ label, tone, onClick }) {
  const tones = {
    teal: 'bg-teal-50 text-teal-700 hover:bg-teal-100',
    rose: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${tones[tone]}`}
    >
      {label}
    </button>
  )
}