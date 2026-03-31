import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Card, Field, PageShell, SectionHeader, StatusAlert, TableState, ActionButton } from '../../components/layout/PageShell.jsx'
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

function SelectField({ label, required = false, value, onChange, options, placeholder }) {
  return (
    <Field label={label} required={required}>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full appearance-none rounded-md border border-slate-300 bg-white px-3 pr-8 text-[13px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50 disabled:opacity-75"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </Field>
  )
}

function DocumentIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function createEmptyForm() {
  return {
    date: new Date().toISOString().split('T')[0],
    expenseHeadId: '',
    details: '',
    amount: '',
  }
}

export default function ExpenseVoucherPage() {
  const [form, setForm] = useState(createEmptyForm)
  const [heads, setHeads] = useState([])
  const [vouchers, setVouchers] = useState([])
  const [loadingHeads, setLoadingHeads] = useState(false)
  const [loadingVouchers, setLoadingVouchers] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    fetchHeads()
    fetchVouchers()
  }, [])

  async function fetchHeads() {
    setLoadingHeads(true)
    try {
      const response = await axiosInstance.get('/expense-heads')
      const data = response.data
      setHeads(Array.isArray(data) ? data : data.data || [])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to load Expense Heads. Ensure the module is configured.')
    } finally {
      setLoadingHeads(false)
    }
  }

  async function fetchVouchers() {
    setLoadingVouchers(true)
    try {
      const response = await axiosInstance.get('/expense-vouchers')
      const data = response.data
      setVouchers(Array.isArray(data) ? data : data.data || [])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to load Expense Vouchers.')
    } finally {
      setLoadingVouchers(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.expenseHeadId) {
      toast.error('Please select an Expense Head.')
      return
    }

    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) {
      toast.error('Please enter a valid amount.')
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        voucher_date: form.date,
        head_id: Number(form.expenseHeadId),
        details: form.details.trim(),
        amount: parseFloat(form.amount),
      }

      if (editId) {
        await axiosInstance.put(`/expense-vouchers/${editId}`, payload)
        toast.success('Voucher updated successfully.')
      } else {
        await axiosInstance.post('/expense-vouchers', payload)
        toast.success('Expense Voucher recorded successfully.')
      }

      resetForm()
      fetchVouchers()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to record voucher.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this expense voucher?')) return

    try {
      await axiosInstance.delete(`/expense-vouchers/${id}`)
      toast.success('Voucher deleted successfully.')
      fetchVouchers()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete voucher.')
    }
  }

  function handleEdit(v) {
    setEditId(v.id)
    setForm({
      date: v.voucher_date ? new Date(v.voucher_date).toISOString().split('T')[0] : '',
      expenseHeadId: v.head_id || '',
      details: v.details || '',
      amount: v.amount || '',
    })
    toast.dismiss()
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
      title="Expense Voucher"
      description="Record operational costs against specific expense heads."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-5">
        <Card className="mx-auto max-w-4xl border-l-[6px] border-l-teal-500 p-3.5">
          <SectionHeader
            title={editId ? 'Edit Voucher' : 'Issue Voucher'}
            description="Log an expense entry to deduct from your accounts."
            icon={<DocumentIcon className="h-6 w-6" />}
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            <SectionCard color="teal" title="Transaction Details">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Voucher Date" required>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] outline-none transition focus:border-teal-400 focus:ring-3 focus:ring-teal-100"
                  />
                </Field>

                <div className="sm:col-span-1 lg:col-span-2">
                  <SelectField
                    label="Expense Head"
                    required
                    value={form.expenseHeadId}
                    onChange={(v) => updateField('expenseHeadId', v)}
                    placeholder={loadingHeads ? 'Loading...' : 'Select Head...'}
                    options={heads.map((h) => ({
                      value: h.id,
                      label: h.head,
                    }))}
                  />
                </div>

                <Field label="Description / Details" className="sm:col-span-2 lg:col-span-2">
                  <textarea
                    rows={2}
                    value={form.details}
                    onChange={(e) => updateField('details', e.target.value)}
                    placeholder="Short description of the transaction"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[13px] outline-none transition focus:border-teal-400 focus:ring-3 focus:ring-teal-100"
                  />
                </Field>

                <Field label="Amount" required className="sm:col-span-2 lg:col-span-1">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={form.amount}
                      onChange={(e) => updateField('amount', e.target.value)}
                      placeholder="0.00"
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 pr-12 text-[13px] outline-none transition focus:border-teal-400 focus:ring-3 focus:ring-teal-100"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      PKR
                    </span>
                  </div>
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
                {submitting ? 'Saving...' : editId ? 'Update Voucher' : 'Save Voucher'}
              </button>
            </div>
          </form>
        </Card>

        {/* List Card */}
        <Card className="mx-auto max-w-4xl">
          <SectionHeader
            title="Voucher Log"
            description={`${vouchers.length} vouchers recorded in system`}
            icon={<DocumentIcon className="h-6 w-6" />}
            action={
              <button
                type="button"
                onClick={fetchVouchers}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Refresh
              </button>
            }
          />

          {loadingVouchers ? (
            <TableState message="Loading vouchers..." />
          ) : vouchers.length === 0 ? (
            <TableState message="No vouchers recorded yet." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="overflow-x-auto lg:max-h-[500px] lg:overflow-y-auto w-full">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      <th className="px-4 py-4 w-28">Date</th>
                      <th className="px-4 py-4">Expense Head</th>
                      <th className="px-4 py-4">Details</th>
                      <th className="px-4 py-4 text-right">Amount</th>
                      <th className="px-4 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {vouchers.map((v) => (
                      <tr key={v.id} className="text-sm border-t border-slate-50 transition hover:bg-slate-50/50">
                        <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                          {new Date(v.voucher_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-900">
                          {v.head_name || v.head?.name || `Head #${v.head_id}`}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {v.details ? <div className="max-w-[200px] truncate">{v.details}</div> : '-'}
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-slate-700">
                          PKR {parseFloat(v.amount).toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex justify-end gap-2">
                            <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(v)} />
                            <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(v.id)} />
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