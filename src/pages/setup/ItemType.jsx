import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Card, Field, PageShell, SectionHeader, StatusAlert, Toggle } from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance'

function createEmptyForm() {
  return {
    type_name: '',
    description: '',
    is_enable: true,
  }
}

export default function ItemTypePage() {
  const [form, setForm] = useState(createEmptyForm)
  const [itemTypes, setItemTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    fetchItemTypes()
  }, [])

  async function fetchItemTypes() {
    setLoading(true)
    try {
      const response = await axiosInstance.get('/item-types')
      const data = response.data
      setItemTypes(Array.isArray(data) ? data : data.data || [])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load item types.')
      setItemTypes([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.type_name.trim()) {
      toast.error('Item type name is required.')
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        type_name: form.type_name.trim(),
        description: form.description.trim(),
        is_enable: form.is_enable ? 1 : 0,
      }
      if (editId) {
        await axiosInstance.put(`/item-types/${editId}`, payload)
        toast.success('Item type updated successfully.')
      } else {
        await axiosInstance.post('/item-types', payload)
        toast.success('Item type created successfully.')
      }

      resetForm()
      fetchItemTypes()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save item type.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this item type?')) return

    try {
      await axiosInstance.delete(`/item-types/${id}`)
      toast.success('Item type deleted successfully.')
      fetchItemTypes()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete item type.')
    }
  }

  function handleEdit(itemType) {
    setEditId(itemType.id)
    setForm({
      type_name: itemType.type_name ?? '',
      description: itemType.description ?? '',  // ✅ fixed: ?? handles null/undefined without discarding ''
      is_enable: itemType.is_enable === 1 || itemType.is_enable === true,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditId(null)
    setForm(createEmptyForm())
  }

  return (
    <PageShell
      title="Item type setup"
      description="Create and manage item types in a compact setup screen that matches the cleaner form-first layout you shared."
      accent="from-emerald-700 via-teal-700 to-cyan-800"
    >
      <div className="space-y-5">
        <Card className="border-l-[6px] border-l-teal-500">
          <SectionHeader
            title={editId ? 'Edit item type' : 'New item type'}
            description="Item type stays separate from category and subcategory classification."
            icon={<ItemTypeIcon className="h-6 w-6" />}
          />

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid gap-3 md:grid-cols-[280px_minmax(0,420px)]">
              <Field label="Item type name" required hint="Example: Product, Service, Bundle">
                <input
                  type="text"
                  value={form.type_name ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, type_name: event.target.value }))}
                  placeholder="Enter item type name"
                  className="h-10 w-full max-w-xs rounded-md border border-slate-300 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-teal-400 focus:ring-3 focus:ring-teal-100"
                />
              </Field>

              <Field label="Description" hint="Optional short note for internal reference.">
                <textarea
                  rows={2}
                  value={form.description ?? ''}  // ✅ fixed: guaranteed controlled value
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Short description"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none transition focus:border-teal-400 focus:ring-3 focus:ring-teal-100"
                />
              </Field>
            </div>

            <Toggle
              enabled={form.is_enable}
              onChange={(value) => setForm((current) => ({ ...current, is_enable: value }))}
              label="Enable item type"
              description="Enabled item types can be used by frontend POS setup forms."
            />

            <div className="flex flex-wrap justify-end gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-w-40 items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Saving...' : editId ? 'Update item type' : 'Add item type'}
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

        <Card>
          <SectionHeader
            title="Item type list"
            description={`${itemTypes.length} item types configured`}
            icon={<ListIcon className="h-6 w-6" />}
            action={
              <button
                type="button"
                onClick={fetchItemTypes}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Refresh
              </button>
            }
          />

          {loading ? (
            <TableState message="Loading item types..." />
          ) : itemTypes.length === 0 ? (
            <TableState message="No item types found yet." />
          ) : (
            <div className="space-y-3 lg:max-h-[22rem] lg:overflow-y-auto">
              {itemTypes.map((itemType, index) => (
                <div key={itemType.id ?? index} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{itemType.type_name}</p>
                        <StatusChip enabled={itemType.is_enable === 1 || itemType.is_enable === true} />
                      </div>
                      {itemType.description && <p className="mt-1 max-w-xs text-sm text-slate-500">{itemType.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(itemType)} />
                      <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(itemType.id)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  )
}

function TableState({ message }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center text-sm text-slate-500">{message}</div>
}

function StatusChip({ enabled }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
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
    <button type="button" onClick={onClick} className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${tones[tone]}`}>
      {label}
    </button>
  )
}

function ItemTypeIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" /></svg>
}

function ListIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
}