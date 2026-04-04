import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Card, Field, PageShell, SectionHeader } from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance'

function createEmptyForm() {
  return {
    shelf_name_code: '',
    description: '',
  }
}

export default function ItemShelvePage() {
  const [form, setForm] = useState(createEmptyForm)
  const [shelves, setShelves] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    fetchShelves()
  }, [])

  async function fetchShelves() {
    setLoading(true)
    try {
      const response = await axiosInstance.get('/shelve-locations')
      const data = response.data
      setShelves(Array.isArray(data) ? data : data.data || [])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load shelve locations.')
      setShelves([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.shelf_name_code.trim()) {
      toast.error('Shelf Name/Code is required.')
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        shelfNameCode: form.shelf_name_code.trim(),
        description: form.description.trim(),
      }
      
      if (editId) {
        await axiosInstance.put(`/shelve-locations/${editId}`, payload)
        toast.success('Shelve location updated successfully.')
      } else {
        await axiosInstance.post('/shelve-locations', payload)
        toast.success('Shelve location created successfully.')
      }

      resetForm()
      fetchShelves()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save shelve location.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this shelve location?')) return

    try {
      await axiosInstance.delete(`/shelve-locations/${id}`)
      toast.success('Shelve location deleted successfully.')
      fetchShelves()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete shelve location.')
    }
  }

  function handleEdit(shelf) {
    setEditId(shelf.id)
    setForm({
      shelf_name_code: shelf.shelf_name_code || '',
      description: shelf.description || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditId(null)
    setForm(createEmptyForm())
  }

  return (
    <PageShell
      title="Shelve Locations"
      description="Create and manage warehouse or display locations for products."
      accent="from-emerald-700 via-teal-700 to-cyan-800"
    >
      <div className="space-y-4">
        <Card className="border-l-[6px] border-l-teal-500 p-3">
          <SectionHeader
            title={editId ? 'Edit Shelve Location' : 'New Shelve Location'}
            description="Identify where physical inventory is stored (e.g., A1-04, Rack 22)."
            icon={<MapPinIcon className="h-5 w-5" />}
          />

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-2 md:grid-cols-[280px_minmax(0,420px)]">
              <Field label="Shelf Name/Code" required hint="Example: A1-Top, Showcase 3">
                <input
                  type="text"
                  value={form.shelf_name_code}
                  onChange={(event) => setForm((current) => ({ ...current, shelf_name_code: event.target.value }))}
                  placeholder="Enter shelf code"
                  className="h-7 w-full max-w-xs rounded-md border border-slate-300 bg-white px-2 text-[11px] text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </Field>

              <Field label="Description" hint="Optional details about the location zone.">
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
            title="Shelve Locations List"
            description={`${shelves.length} mapped locations`}
            icon={<ListIcon className="h-5 w-5" />}
            action={
              <button
                type="button"
                onClick={fetchShelves}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Refresh
              </button>
            }
          />

          {loading ? (
            <TableState message="Loading locations..." />
          ) : shelves.length === 0 ? (
            <TableState message="No shelve locations found yet." />
          ) : (
            <div className="space-y-2 lg:max-h-[22rem] lg:overflow-y-auto w-full">
              {shelves.map((shelf, index) => (
                <div key={shelf.id ?? index} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[12px] font-semibold text-slate-900">{shelf.shelf_name_code}</p>
                      </div>
                      {shelf.description && <p className="mt-0.5 max-w-xs text-[11px] text-slate-500">{shelf.description}</p>}
                    </div>
                    <div className="flex gap-1.5">
                      <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(shelf)} />
                      <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(shelf.id)} />
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
  return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-[11px] text-slate-500">{message}</div>
}

function ActionButton({ label, tone, onClick }) {
  const tones = {
    teal: 'bg-teal-50 text-teal-700 hover:bg-teal-100',
    rose: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
  }

  return (
    <button type="button" onClick={onClick} className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition ${tones[tone]}`}>
      {label}
    </button>
  )
}

function MapPinIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}

function ListIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
}