import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Card, Field, PageShell, SectionHeader, TableState, ActionButton } from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance'

const sectionStyles = {
  teal: { accent: 'bg-teal-500', header: 'border-teal-100 bg-teal-50/80' },
  emerald: { accent: 'bg-emerald-500', header: 'border-emerald-100 bg-emerald-50/80' },
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

function UserIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

function createEmptyForm() {
  return {
    customerName: '',
    address: '',
    mobileNumber: '',
    previousBalance: '',
    nearby: '',
    paymentMethod: 'Cash',
  }
}

export default function CustomerPage() {
  const [form, setForm] = useState(createEmptyForm)
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  async function fetchCustomers() {
    setLoading(true)
    try {
      const response = await axiosInstance.get('/customers')
      const data = response.data
      setCustomers(Array.isArray(data) ? data : data.data || [])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load customers.')
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.customerName.trim()) {
      toast.error('Customer name is required.')
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        customerName: form.customerName.trim(),
        address: form.address.trim(),
        mobileNumber: form.mobileNumber.trim(),
        previousBalance: parseFloat(form.previousBalance) || 0,
        nearby: form.nearby.trim(),
        paymentMethod: form.paymentMethod,
      }

      if (editId) {
        await axiosInstance.put(`/customers/${editId}`, payload)
        toast.success('Customer updated successfully.')
      } else {
        await axiosInstance.post('/customers', payload)
        toast.success('Customer created successfully.')
      }

      resetForm()
      fetchCustomers()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to save the customer.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this customer?')) return

    try {
      await axiosInstance.delete(`/customers/${id}`)
      toast.success('Customer deleted successfully.')
      fetchCustomers()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete customer.')
    }
  }

  function handleEdit(customer) {
    setEditId(customer.id)
    setForm({
      customerName: customer.customer_name || '',
      address: customer.address || '',
      mobileNumber: customer.mobile_number || '',
      previousBalance: customer.previous_balance || '',
      nearby: customer.nearby || '',
      paymentMethod: customer.payment_method || 'Cash',
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
      title="Customer Management"
      description="Register and manage clients for billing"
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-4">
        <Card className="mx-auto max-w-5xl border-l-[6px] border-l-teal-500 p-3">
          <SectionHeader
            title={editId ? 'Edit Customer' : 'Customer Registration'}
            description="Manage client personal and payment details."
            icon={<UserIcon className="h-5 w-5" />}
          />

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 lg:grid-cols-[1fr_minmax(0,1fr)]">
              <SectionCard color="teal" title="Personal Details">
                <div className="grid gap-3">
                  <Field label="Customer Name" required>
                    <input
                      type="text"
                      value={form.customerName}
                      onChange={(e) => updateField('customerName', e.target.value)}
                      placeholder="Full name"
                      className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                    />
                  </Field>
                  <Field label="Mobile No / WhatsApp">
                    <input
                      type="tel"
                      value={form.mobileNumber}
                      onChange={(e) => updateField('mobileNumber', e.target.value)}
                      placeholder="e.g. 0300-1234567"
                      className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                    />
                  </Field>
                  <Field label="Address">
                    <textarea
                      rows={2}
                      value={form.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="Home or shipping address"
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                    />
                  </Field>
                </div>
              </SectionCard>

              <div className="flex flex-col gap-3">
                <SectionCard color="emerald" title="Financial & Location">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Nearby Landmark / Area">
                      <input
                        type="text"
                        value={form.nearby}
                        onChange={(e) => updateField('nearby', e.target.value)}
                        placeholder="e.g. Main Market"
                        className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                      />
                    </Field>
                    <SelectField
                      label="Payment Method"
                      required
                      value={form.paymentMethod}
                      onChange={(v) => updateField('paymentMethod', v)}
                      options={[
                        { value: 'Cash', label: 'Cash' },
                        { value: 'Card', label: 'Credit Card' },
                        { value: 'Online', label: 'Online/Bank' },
                      ]}
                    />
                    <Field label="Previous Balance" className="sm:col-span-2">
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={form.previousBalance}
                          onChange={(e) => updateField('previousBalance', e.target.value)}
                          placeholder="0.00"
                          className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 pr-10 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                          PKR
                        </span>
                      </div>
                    </Field>
                  </div>
                </SectionCard>

                <SectionCard color="cyan" title="Actions">
                  <div className="flex justify-center gap-2 pt-1">
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
                      className="inline-flex min-w-[120px] items-center justify-center rounded-lg bg-teal-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? 'Saving...' : editId ? 'Update' : 'Save'}
                    </button>
                  </div>
                </SectionCard>
              </div>
            </div>
          </form>
        </Card>

        {/* Customer List Card */}
        <Card className="mx-auto max-w-5xl p-3">
          <SectionHeader
            title="Customer Registry"
            description={`${customers.length} registered clients`}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            }
            action={
              <button
                type="button"
                onClick={fetchCustomers}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Refresh
              </button>
            }
          />

          {loading ? (
            <TableState message="Loading customers..." />
          ) : customers.length === 0 ? (
            <TableState message="No customers found yet." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="overflow-x-auto lg:max-h-[500px] lg:overflow-y-auto w-full">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      <th className="px-3 py-2.5">Name</th>
                      <th className="px-3 py-2.5">Mobile Number</th>
                      <th className="px-3 py-2.5">Address & Area</th>
                      <th className="px-3 py-2.5 text-right">Balance</th>
                      <th className="px-3 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {customers.map((c) => (
                      <tr key={c.id} className="text-[12px] border-t border-slate-50 transition hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-medium text-slate-900">{c.customer_name}</td>
                        <td className="px-3 py-2 text-slate-600">{c.mobile_number || '-'}</td>
                        <td className="px-3 py-2 text-slate-600">
                          {c.address ? <div className="max-w-[150px] truncate text-[11px]">{c.address}</div> : '-'}
                          {c.nearby && <span className="mt-0.5 block text-[9px] text-teal-600">Near: {c.nearby}</span>}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-700 text-[11px]">
                          {c.previous_balance ? `PKR ${parseFloat(c.previous_balance).toFixed(2)}` : '0.00'}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1.5">
                            <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(c)} />
                            <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(c.id)} />
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