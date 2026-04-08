import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Card, Field, PageShell, SectionHeader, ActionButton, TableState } from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance'

function createEmptyForm() {
  return {
    unit_name: '',
    description: '',
  }
}

export default function ItemUnitPage() {
  const [form, setForm] = useState(createEmptyForm)
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    fetchUnits()
  }, [])

  async function fetchUnits() {
    setLoading(true)
    try {
      const response = await axiosInstance.get('/item-units')
      const data = response.data
      setUnits(Array.isArray(data) ? data : data.data || [])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load item units.')
      setUnits([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.unit_name.trim()) {
      toast.error('Unit name is required.')
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        unitName: form.unit_name.trim(),
        description: form.description.trim(),
      }
      
      if (editId) {
        await axiosInstance.put(`/item-units/${editId}`, payload)
        toast.success('Item unit updated successfully.')
      } else {
        await axiosInstance.post('/item-units', payload)
        toast.success('Item unit created successfully.')
      }

      resetForm()
      fetchUnits()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save item unit.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this item unit?')) return

    try {
      await axiosInstance.delete(`/item-units/${id}`)
      toast.success('Item unit deleted successfully.')
      fetchUnits()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete item unit.')
    }
  }

  function handleEdit(unit) {
    setEditId(unit.id)
    setForm({
      unit_name: unit.unit_name || '',
      description: unit.description || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditId(null)
    setForm(createEmptyForm())
  }

  return (
    <PageShell
      title="Item Unit Setup"
      description="Create and manage measurement units for your items."
      accent="from-emerald-700 via-teal-700 to-cyan-800"
    >
      <div className="space-y-4">
        <Card className="border-l-[6px] border-l-teal-500 p-3">
          <SectionHeader
            title={editId ? 'Edit Item Unit' : 'New Item Unit'}
            description="Define measurement units for your products (e.g., kg, piece, liter)."
            icon={<ItemUnitIcon className="h-5 w-5" />}
          />

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-2 md:grid-cols-[280px_minmax(0,420px)]">
              <Field label="Unit Name" required hint="Example: Piece, Kg, Liter">
                <input
                  type="text"
                  value={form.unit_name}
                  onChange={(event) => setForm((current) => ({ ...current, unit_name: event.target.value }))}
                  placeholder="Enter unit name"
                  className="h-7 w-full max-w-xs rounded-md border border-slate-300 bg-white px-2 text-[11px] text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </Field>

              <Field label="Description" hint="Optional detail or abbreviation.">
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Short description"
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[11px] text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </Field>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-w-[120px] items-center justify-center rounded-xl bg-teal-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Saving...' : editId ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          </form>
        </Card>

        <Card className="p-3">
          <SectionHeader
            title="Item Unit List"
            description={`${units.length} defined units`}
            icon={<ListIcon className="h-5 w-5" />}
            action={
              <button
                type="button"
                onClick={fetchUnits}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Refresh
              </button>
            }
          />

          {loading ? (
            <TableState message="Loading units..." />
          ) : units.length === 0 ? (
            <TableState message="No item units found yet." />
          ) : (
            <div className="space-y-2 lg:max-h-[22rem] lg:overflow-y-auto">
              {units.map((unit, index) => (
                <div key={unit.id ?? index} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[12px] font-semibold text-slate-900">{unit.unit_name}</p>
                      </div>
                      {unit.description && <p className="mt-0.5 max-w-xs text-[11px] text-slate-500">{unit.description}</p>}
                    </div>
                    <div className="flex gap-1.5">
                      <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(unit)} />
                      <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(unit.id)} />
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

function ItemUnitIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
}

function ListIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
}