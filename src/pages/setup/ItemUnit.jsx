import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [isFormOpen, setIsFormOpen] = useState(false)

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
      setIsFormOpen(false)
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
    setIsFormOpen(true)
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditId(null)
    setForm(createEmptyForm())
  }

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Unit Setup</h1>
            <p className="text-sm text-slate-500">Create and manage measurement units for your products.</p>
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
                Add New Unit
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
              <Card className="border-l-[6px] border-l-teal-500 p-3 mb-6">
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
                        className="h-8 w-full max-w-xs rounded-md border border-slate-300 bg-white px-2.5 text-[12px] text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                      />
                    </Field>

                    <Field label="Description" hint="Optional detail or abbreviation.">
                      <textarea
                        rows={2}
                        value={form.description}
                        onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                        placeholder="Short description"
                        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[12px] text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                      />
                    </Field>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex min-w-[120px] items-center justify-center rounded-xl bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? 'Saving...' : editId ? 'Update' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetForm()
                        setIsFormOpen(false)
                      }}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List card */}
        <Card className="p-0 overflow-hidden">
          <SectionHeader
            title="Item Unit List"
            description={`${units.length} defined units`}
            icon={<ListIcon className="h-5 w-5" />}
            action={
              <div className="p-4">
                <button
                  type="button"
                  onClick={fetchUnits}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Refresh
                </button>
              </div>
            }
          />

          {loading ? (
            <TableState message="Loading units..." />
          ) : units.length === 0 ? (
            <TableState message="No item units found yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3 w-12">#</th>
                    <th className="px-5 py-3">Unit Details</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {units.map((unit, index) => (
                    <motion.tr 
                      key={unit.id ?? index} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group transition-colors hover:bg-teal-50/30"
                    >
                      <td className="px-5 py-4 text-[11px] text-slate-400 font-mono">{index + 1}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-slate-800">{unit.unit_name}</span>
                          {unit.description && <span className="mt-0.5 text-[10px] text-slate-500">{unit.description}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(unit)} />
                          <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(unit.id)} />
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

function ItemUnitIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
}

function ListIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
}