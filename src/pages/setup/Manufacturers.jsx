import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Card, Field, PageShell, SectionHeader, StatusAlert, Toggle, TableState, StatusChip, ActionButton } from '../../components/layout/PageShell.jsx'
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

function FactoryIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
}

function createEmptyForm() {
  return {
    manufacturerId: '',
    manufacturerName: '',
    address: '',
    email: '',
    phone: '',
    contactPerson: '',
    mobileNumber: '',
    designation: '',
    ntn: '',
    gstNumber: '',
    status: true,
  }
}

export default function Manufacturers() {
  const [form, setForm] = useState(createEmptyForm)
  const [manufacturers, setManufacturers] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchManufacturers()
  }, [])

  async function fetchManufacturers() {
    setLoading(true)
    try {
      const response = await axiosInstance.get('/manufacturers')
      const data = response.data
      setManufacturers(Array.isArray(data) ? data : data.data || [])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load manufacturers.')
      setManufacturers([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.manufacturerId.trim() || !form.manufacturerName.trim()) {
      toast.error('Manufacturer ID and Name are required.')
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        manufacturerId: form.manufacturerId.trim(),
        manufacturerName: form.manufacturerName.trim(),
        contactPerson: form.contactPerson.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        mobileNumber: form.mobileNumber.trim(),
        designation: form.designation.trim(),
        ntn: form.ntn.trim(),
        gstNumber: form.gstNumber.trim(),
        status: form.status,
      }

      if (editId) {
        await axiosInstance.put(`/manufacturers/${editId}`, payload)
        toast.success('Manufacturer updated successfully.')
      } else {
        await axiosInstance.post('/manufacturers', payload)
        toast.success('Manufacturer saved successfully.')
      }

      resetForm()
      fetchManufacturers()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to save the manufacturer.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this manufacturer?')) return

    try {
      await axiosInstance.delete(`/manufacturers/${id}`)
      toast.success('Manufacturer deleted successfully.')
      fetchManufacturers()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete manufacturer.')
    }
  }

  function handleEdit(m) {
    setEditId(m.id)
    setForm({
      manufacturerId: m.manufacturer_id || '',
      manufacturerName: m.manufacturer_name || '',
      address: m.address || '',
      email: m.email || '',
      phone: m.phone || '',
      contactPerson: m.contact_person || '',
      mobileNumber: m.mobile || '',
      designation: m.designation || '',
      ntn: m.ntn || '',
      gstNumber: m.gst || '',
      status: m.status === 1 || m.status === true,
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
      title="Add Manufacturer"
      description="Register a new manufacturer to link with your products."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-5">
        <Card className="mx-auto max-w-5xl border-l-[6px] border-l-teal-500 p-3.5">
          <SectionHeader
            title={editId ? 'Edit Manufacturer' : 'Manufacturer Registration'}
            description="Enter primary, contact, and tax details for the new manufacturer."
            icon={<FactoryIcon className="h-6 w-6" />}
          />

          <form onSubmit={handleSubmit} className="space-y-3">
            <SectionCard color="teal" title="Primary Details">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Manufacturer ID" required>
                  <input
                    type="text"
                    value={form.manufacturerId}
                    onChange={(e) => updateField('manufacturerId', e.target.value)}
                    placeholder="e.g. MFG-001"
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] outline-none transition focus:border-teal-400 focus:ring-3 focus:ring-teal-100"
                  />
                </Field>
                <Field label="Manufacturer Name" required className="lg:col-span-2">
                  <input
                    type="text"
                    value={form.manufacturerName}
                    onChange={(e) => updateField('manufacturerName', e.target.value)}
                    placeholder="Full name of manufacturer"
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] outline-none transition focus:border-teal-400 focus:ring-3 focus:ring-teal-100"
                  />
                </Field>
              </div>
            </SectionCard>

            <SectionCard color="emerald" title="Contact & Personnel">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Contact Person">
                    <input
                      type="text"
                      value={form.contactPerson}
                      onChange={(e) => updateField('contactPerson', e.target.value)}
                      placeholder="Representative name"
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] outline-none transition focus:border-teal-400 focus:ring-3 focus:ring-teal-100"
                    />
                  </Field>
                  <Field label="Designation">
                    <input
                      type="text"
                      value={form.designation}
                      onChange={(e) => updateField('designation', e.target.value)}
                      placeholder="e.g. Sales Manager"
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] outline-none transition focus:border-teal-400 focus:ring-3 focus:ring-teal-100"
                    />
                  </Field>
                  <Field label="Email Address">
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="contact@manufacturer.com"
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] outline-none transition focus:border-teal-400 focus:ring-3 focus:ring-teal-100"
                    />
                  </Field>
                  <Field label="Phone/Landline">
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="Phone number"
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] outline-none transition focus:border-teal-400 focus:ring-3 focus:ring-teal-100"
                    />
                  </Field>
                  <Field label="Mobile Number">
                    <input
                      type="tel"
                      value={form.mobileNumber}
                      onChange={(e) => updateField('mobileNumber', e.target.value)}
                      placeholder="Mobile number"
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] outline-none transition focus:border-teal-400 focus:ring-3 focus:ring-teal-100"
                    />
                  </Field>
                </div>
                <div className="grid gap-4">
                  <Field label="Physical Address">
                    <textarea
                      rows={2}
                      value={form.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="Complete headquarters or factory address"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[13px] outline-none transition focus:border-teal-400 focus:ring-3 focus:ring-teal-100"
                    />
                  </Field>
                </div>
              </div>
            </SectionCard>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.85fr)]">
              <SectionCard color="cyan" title="Tax Information">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="NTN">
                    <input
                      type="text"
                      value={form.ntn}
                      onChange={(e) => updateField('ntn', e.target.value)}
                      placeholder="National Tax Number"
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] outline-none transition focus:border-teal-400 focus:ring-3 focus:ring-teal-100"
                    />
                  </Field>
                  <Field label="GST Number">
                    <input
                      type="text"
                      value={form.gstNumber}
                      onChange={(e) => updateField('gstNumber', e.target.value)}
                      placeholder="Sales Tax Number"
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] outline-none transition focus:border-teal-400 focus:ring-3 focus:ring-teal-100"
                    />
                  </Field>
                </div>
              </SectionCard>

              <div className="flex flex-col gap-3">
                <SectionCard color="teal" title="System Settings">
                  <Toggle
                    enabled={form.status}
                    onChange={(v) => updateField('status', v)}
                    label="Manufacturer Status"
                    description="Active manufacturers are selectable."
                  />
                </SectionCard>

                <SectionCard color="emerald" title="Actions">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex min-w-[120px] items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex min-w-[140px] items-center justify-center rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? 'Saving...' : editId ? 'Update' : 'Save'}
                    </button>
                  </div>
                </SectionCard>
              </div>
            </div>
          </form>
        </Card>

        {/* List Card below form */}
        <Card className="mx-auto max-w-5xl">
          <SectionHeader
            title="Manufacturer List"
            description={`${manufacturers.length} manufacturers registered in system`}
            icon={<FactoryIcon className="h-6 w-6" />}
            action={
              <button
                type="button"
                onClick={fetchManufacturers}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Refresh
              </button>
            }
          />
          {loading ? (
            <TableState message="Loading manufacturers..." />
          ) : manufacturers.length === 0 ? (
            <TableState message="No manufacturers found yet." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="overflow-x-auto lg:max-h-[500px] lg:overflow-y-auto w-full">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      <th className="px-4 py-4">MFG-ID</th>
                      <th className="px-4 py-4">Name</th>
                      <th className="px-4 py-4">Contact</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {manufacturers.map((m) => (
                      <tr key={m.id} className="text-sm border-t border-slate-50 transition hover:bg-slate-50/50">
                        <td className="px-4 py-3.5 font-semibold text-slate-700">{m.manufacturer_id}</td>
                        <td className="px-4 py-3.5 font-medium text-slate-900">{m.manufacturer_name}</td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {m.phone || m.mobile || '-'}
                          {m.contact_person && <span className="mt-1 block text-[11px] text-teal-600">{m.contact_person}</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusChip enabled={m.status === 1 || m.status === true} />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex justify-end gap-2">
                            <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(m)} />
                            <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(m.id)} />
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