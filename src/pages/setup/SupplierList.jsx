import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Card, Field, PageShell, SectionHeader, Toggle, TableState, StatusChip, ActionButton } from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance'

const sectionStyles = {
  emerald: { accent: 'bg-emerald-500', header: 'border-emerald-100 bg-emerald-50/80' },
  teal: { accent: 'bg-teal-500', header: 'border-teal-100 bg-teal-50/80' },
  cyan: { accent: 'bg-cyan-500', header: 'border-cyan-100 bg-cyan-50/80' },
}

function SectionCard({ color, title, children }) {
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

function SelectField({ label, required = false, value, onChange, options, placeholder }) {
  return (
    <Field label={label} required={required}>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-7 w-full appearance-none rounded-md border border-slate-300 bg-white px-2 pr-7 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </Field>
  )
}

function TruckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l3 5v6H8m12-11V5H3v13h2m0 0a2 2 0 104 0m-4 0a2 2 0 114 0m7 0a2 2 0 104 0m-4 0a2 2 0 114 0M8 7H3" />
    </svg>
  )
}

function createEmptyForm() {
  return {
    supplierName: '',
    contactPerson: '',
    designation: '',
    phone: '',
    email: '',
    address: '',
    ntn: '',
    gstNumber: '',
    paymentTerms: 'Cash',
    creditLimit: '',
    status: true,
  }
}

export default function SupplierPage() {
  const [form, setForm] = useState(createEmptyForm)
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    fetchSuppliers()
  }, [])

  async function fetchSuppliers() {
    setLoading(true)
    try {
      const response = await axiosInstance.get('/suppliers')
      const data = response.data
      setSuppliers(Array.isArray(data) ? data : data.data || [])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load suppliers.')
      setSuppliers([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.supplierName.trim() || !form.paymentTerms) {
      toast.error('Supplier Name and Payment Terms are required.')
      return
    }

    if (form.paymentTerms === 'Credit' && (!form.creditLimit || parseFloat(form.creditLimit) <= 0)) {
      toast.error('A valid Credit Limit is required when Terms are Credit.')
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        supplierName: form.supplierName.trim(),
        contactPerson: form.contactPerson.trim(),
        designation: form.designation.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        ntn: form.ntn.trim(),
        gstNumber: form.gstNumber.trim(),
        paymentTerms: form.paymentTerms,
        creditLimit: form.paymentTerms === 'Credit' ? parseFloat(form.creditLimit) : null,
        status: form.status,
      }

      if (editId) {
        await axiosInstance.put(`/suppliers/${editId}`, payload)
        toast.success('Supplier updated successfully.')
      } else {
        await axiosInstance.post('/suppliers', payload)
        toast.success('Supplier saved successfully.')
      }

      resetForm()
      fetchSuppliers()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to save the supplier.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this supplier?')) return

    try {
      await axiosInstance.delete(`/suppliers/${id}`)
      toast.success('Supplier deleted successfully.')
      fetchSuppliers()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete supplier.')
    }
  }

  function handleEdit(s) {
    setEditId(s.id)
    setForm({
      supplierName: s.supplier_name || '',
      contactPerson: s.contact_person || '',
      designation: s.designation || '',
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      ntn: s.ntn || '',
      gstNumber: s.gst || '',
      paymentTerms: s.payment_terms || 'Cash',
      creditLimit: s.credit_limit || '',
      status: s.status === 1 || s.status === true,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditId(null)
    setForm(createEmptyForm())
  }

  function updateField(key, value) {
    setForm((current) => {
      const updated = { ...current, [key]: value }
      if (key === 'paymentTerms' && value === 'Cash') {
        updated.creditLimit = ''
      }
      return updated
    })
  }

  return (
    <PageShell
      title="Add Supplier"
      description="Register your warehouse or material suppliers to log product purchases."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-4">
        <Card className="mx-auto max-w-5xl border-l-[6px] border-l-teal-500 p-3">
          <SectionHeader
            title={editId ? 'Edit Supplier' : 'Supplier Registration'}
            description="Enter vendor contact, operation location, and commercial terms."
            icon={<TruckIcon className="h-5 w-5" />}
          />

          <form onSubmit={handleSubmit} className="space-y-3">
            <SectionCard color="teal" title="Business & Contact Details">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Supplier Name" required className="lg:col-span-3">
                  <input
                    type="text"
                    value={form.supplierName}
                    onChange={(e) => updateField('supplierName', e.target.value)}
                    placeholder="Official company or provider name"
                    className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </Field>
                <Field label="Contact Person">
                  <input
                    type="text"
                    value={form.contactPerson}
                    onChange={(e) => updateField('contactPerson', e.target.value)}
                    placeholder="Key account representative"
                    className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </Field>
                <Field label="Designation">
                  <input
                    type="text"
                    value={form.designation}
                    onChange={(e) => updateField('designation', e.target.value)}
                    placeholder="e.g. Distributor Manager"
                    className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </Field>
                <Field label="Phone/Mobile Number">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="Dial number"
                    className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </Field>
                <Field label="Email Address">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="supplier@domain.com"
                    className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </Field>
                <Field label="Commercial Address" className="sm:col-span-2">
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Operating address"
                    className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </Field>
              </div>
            </SectionCard>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.85fr)]">
              <SectionCard color="emerald" title="Financial & Tax">
                <div className="grid gap-2 sm:grid-cols-2">
                  <SelectField
                    label="Payment Terms"
                    required
                    value={form.paymentTerms}
                    onChange={(v) => updateField('paymentTerms', v)}
                    options={[
                      { value: 'Cash', label: 'Cash' },
                      { value: 'Credit', label: 'Credit' }
                    ]}
                  />
                  <Field label="Credit Limit" required={form.paymentTerms === 'Credit'}>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        disabled={form.paymentTerms === 'Cash'}
                        value={form.creditLimit}
                        onChange={(e) => updateField('creditLimit', e.target.value)}
                        placeholder="0.00"
                        className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 pr-10 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                        PKR
                      </span>
                    </div>
                  </Field>
                  <Field label="NTN">
                    <input
                      type="text"
                      value={form.ntn}
                      onChange={(e) => updateField('ntn', e.target.value)}
                      placeholder="National Tax Number"
                      className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                    />
                  </Field>
                  <Field label="GST Number">
                    <input
                      type="text"
                      value={form.gstNumber}
                      onChange={(e) => updateField('gstNumber', e.target.value)}
                      placeholder="Sales Tax Number"
                      className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                    />
                  </Field>
                </div>
              </SectionCard>

              <div className="flex flex-col gap-3">
                <SectionCard color="cyan" title="System Settings">
                  <Toggle
                    enabled={form.status}
                    onChange={(v) => updateField('status', v)}
                    label="Supplier Status"
                    description="Active suppliers can be invoiced."
                  />
                </SectionCard>

                <SectionCard color="teal" title="Actions">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex min-w-[100px] items-center justify-center rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex min-w-[110px] items-center justify-center rounded-lg bg-teal-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
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
        <Card className="mx-auto max-w-5xl p-3">
          <SectionHeader
            title="Supplier List"
            description={`${suppliers.length} vendors registered in system`}
            icon={<TruckIcon className="h-5 w-5" />}
            action={
              <button
                type="button"
                onClick={fetchSuppliers}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Refresh
              </button>
            }
          />
          {loading ? (
            <TableState message="Loading suppliers..." />
          ) : suppliers.length === 0 ? (
            <TableState message="No suppliers found yet." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="overflow-x-auto lg:max-h-[500px] lg:overflow-y-auto w-full">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      <th className="px-3 py-2.5">Name</th>
                      <th className="px-3 py-2.5">Contact Person</th>
                      <th className="px-3 py-2.5">Phone</th>
                      <th className="px-3 py-2.5">Payment Terms</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {suppliers.map((s) => (
                      <tr key={s.id} className="text-[12px] border-t border-slate-50 transition hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-medium text-slate-900">{s.supplier_name}</td>
                        <td className="px-3 py-2 text-slate-600">{s.contact_person || '-'}</td>
                        <td className="px-3 py-2 text-slate-600">{s.phone || '-'}</td>
                        <td className="px-3 py-2">
                          <StatusChip 
                            enabled={true} 
                            label={s.payment_terms} 
                            colorClass={s.payment_terms === 'Cash' ? 'bg-cyan-50 text-cyan-700' : 'bg-amber-50 text-amber-700'} 
                          />
                        </td>
                        <td className="px-3 py-2">
                          <StatusChip enabled={s.status === 1 || s.status === true} />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1.5">
                            <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(s)} />
                            <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(s.id)} />
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