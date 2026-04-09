import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [isFormOpen, setIsFormOpen] = useState(false)

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
      setIsFormOpen(false)
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
    setIsFormOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditId(null)
    setForm(createEmptyForm())
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const inputCls = "h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Customers</h1>
            <p className="text-sm text-slate-500">Register and manage clients for detailed billing and history.</p>
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
                Add Customer
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
              <Card className="mx-auto max-w-5xl border-l-[6px] border-l-teal-500 p-3 mb-6">
                <SectionHeader
                  title={editId ? 'Edit Customer' : 'Customer Registration'}
                  description="Manage client personal and payment details."
                  icon={<UserIcon className="h-5 w-5" />}
                />

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid gap-3 lg:grid-cols-2">
                    <SectionCard color="teal" title="Personal Details">
                      <div className="grid gap-3">
                        <Field label="Customer Name" required>
                          <input
                            type="text"
                            value={form.customerName}
                            onChange={(e) => updateField('customerName', e.target.value)}
                            placeholder="Full name"
                            className={inputCls}
                          />
                        </Field>
                        <Field label="Mobile No / WhatsApp">
                          <input
                            type="tel"
                            value={form.mobileNumber}
                            onChange={(e) => updateField('mobileNumber', e.target.value)}
                            placeholder="e.g. 0300-1234567"
                            className={inputCls}
                          />
                        </Field>
                        <Field label="Address">
                          <textarea
                            value={form.address}
                            onChange={(e) => updateField('address', e.target.value)}
                            placeholder="Current residential or billing address"
                            className={`${inputCls} h-16 py-1.5`}
                          />
                        </Field>
                      </div>
                    </SectionCard>

                    <SectionCard color="emerald" title="Accounting & Area">
                      <div className="grid gap-3">
                        <Field label="Opening Balance" hint="Positive for debit, negative for credit">
                          <input
                            type="number"
                            value={form.previousBalance}
                            onChange={(e) => updateField('previousBalance', e.target.value)}
                            placeholder="0.00"
                            className={`${inputCls} font-bold text-teal-700`}
                          />
                        </Field>
                        <Field label="Nearby Landmark">
                          <input
                            type="text"
                            value={form.nearby}
                            onChange={(e) => updateField('nearby', e.target.value)}
                            placeholder="e.g. Near Metro Station"
                            className={inputCls}
                          />
                        </Field>
                        <Field label="Preferred Payment">
                          <select
                            value={form.paymentMethod}
                            onChange={(e) => updateField('paymentMethod', e.target.value)}
                            className={inputCls}
                          >
                            <option value="Cash">Cash Basis</option>
                            <option value="Credit">Credit / Ledger</option>
                            <option value="Gift">Gift Card</option>
                          </select>
                        </Field>
                      </div>
                    </SectionCard>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        resetForm()
                        setIsFormOpen(false)
                      }}
                      className="inline-flex min-w-[100px] items-center justify-center rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex min-w-[120px] items-center justify-center rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm shadow-teal-100"
                    >
                      {submitting ? 'Saving...' : editId ? 'Update' : 'Save'}
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Customer List Card */}
        <Card className="mx-auto max-w-5xl p-0 overflow-hidden">
          <SectionHeader
            title="Customer Registry"
            description={`${customers.length} registered clients`}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            }
            action={
              <div className="p-4">
                <button
                  type="button"
                  onClick={fetchCustomers}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Refresh
                </button>
              </div>
            }
          />

          {loading ? (
            <TableState message="Loading customers..." />
          ) : customers.length === 0 ? (
            <TableState message="No customers found yet." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Contact Details</th>
                    <th className="px-5 py-3">Address & Area</th>
                    <th className="px-5 py-3 text-right">Balance</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {customers.map((c) => (
                    <motion.tr 
                      key={c.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group transition-colors hover:bg-teal-50/30"
                    >
                      <td className="px-5 py-4 font-bold text-slate-800">{c.customer_name}</td>
                      <td className="px-5 py-4">
                         <span className="text-[12px] font-medium text-slate-600">{c.mobile_number || '-'}</span>
                         <span className="block text-[10px] text-slate-400 font-bold tracking-tighter uppercase">{c.payment_method}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {c.address ? <div className="max-w-[200px] truncate text-[12px]">{c.address}</div> : '-'}
                        {c.nearby && <span className="mt-0.5 block text-[10px] font-bold text-teal-600 uppercase tracking-tighter">Near: {c.nearby}</span>}
                      </td>
                      <td className="px-5 py-4 text-right">
                         <span className={`text-[12px] font-black ${parseFloat(c.previous_balance) > 0 ? 'text-teal-600' : 'text-slate-700'}`}>
                           PKR {parseFloat(c.previous_balance || 0).toLocaleString()}
                         </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(c)} />
                          <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(c.id)} />
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