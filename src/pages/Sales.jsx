import { useEffect, useState, useMemo, useRef } from 'react'
import { toast } from 'react-toastify'
import { Card, Field, PageShell, SectionHeader, TableState, ActionButton, StatusChip } from '../components/layout/PageShell.jsx'
import axiosInstance from '../services/axiosInstance'

const sectionStyles = {
  indigo: { accent: 'bg-indigo-500', header: 'border-indigo-100 bg-indigo-50/80' },
  emerald: { accent: 'bg-emerald-500', header: 'border-emerald-100 bg-emerald-50/80' },
  amber: { accent: 'bg-amber-500', header: 'border-amber-100 bg-amber-50/80' },
  teal: { accent: 'bg-teal-500', header: 'border-teal-100 bg-teal-50/80' },
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

function InvoiceIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}

function createEmptyRow() {
  return { id: Date.now() + Math.random(), categoryId: '', itemId: '', price: '', quantity: 1, total: 0 }
}

const generateReceiptNumber = () => {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `RCP-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${rand}`
}

export default function Sales() {
  const [customers, setCustomers] = useState([])
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [salesRecord, setSalesRecord] = useState([])
  const [submitting, setSubmitting] = useState(false)

  // ── Edit tracking ─────────────────────────────────────────────────────────
  const [editId, setEditId] = useState(null)

  // ── Form state ────────────────────────────────────────────────────────────
  const [mobileNumber, setMobileNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerId, setCustomerId] = useState(null)
  const [invoiceItems, setInvoiceItems] = useState([createEmptyRow()])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [discount, setDiscount] = useState('')
  const [givenAmount, setGivenAmount] = useState('')
  const [description, setDescription] = useState('')

  // ── Receipt number — regenerate only for new invoices ────────────────────
  const [receiptNo, setReceiptNo] = useState(generateReceiptNumber)

  useEffect(() => {
    fetchInitialData()
    fetchSales()
  }, [])

  async function fetchInitialData() {
    try {
      const [cusRes, catRes, itmRes] = await Promise.all([
        axiosInstance.get('/customers').catch(() => ({ data: null })),
        axiosInstance.get('/categories').catch(() => ({ data: null })),
        axiosInstance.get('/item-details').catch(() => ({ data: null })),
      ])
      if (cusRes.data) setCustomers(Array.isArray(cusRes.data) ? cusRes.data : cusRes.data.data || [])
      if (catRes.data) setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data.data || [])
      if (itmRes.data) setItems(Array.isArray(itmRes.data) ? itmRes.data : itmRes.data.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  async function fetchSales() {
    try {
      const res = await axiosInstance.get('/sale-invoices')
      if (res.data) setSalesRecord(Array.isArray(res.data) ? res.data : res.data.data || [])
    } catch { /* silent */ }
  }

  // ── Customer autocomplete ─────────────────────────────────────────────────
  const matchingCustomers = useMemo(() => {
    if (mobileNumber.length < 4) return []
    return customers.filter(c =>
      c.mobile_number?.toLowerCase().includes(mobileNumber.toLowerCase()) ||
      c.customer_name?.toLowerCase().includes(mobileNumber.toLowerCase())
    )
  }, [mobileNumber, customers])

  const handleMobileChange = (e) => {
    const val = e.target.value
    setMobileNumber(val)
    setShowCustomerDropdown(val.length >= 4)
    if (val.length < 4) { setCustomerName(''); setCustomerId(null) }
    if (customerId) setCustomerId(null)
  }

  const handleSelectCustomer = (c) => {
    setMobileNumber(c.mobile_number)
    setCustomerName(c.customer_name)
    setCustomerId(c.id)
    setShowCustomerDropdown(false)
  }

  // ── Calculations ──────────────────────────────────────────────────────────
  const subTotal = useMemo(() =>
    invoiceItems.reduce((sum, r) => sum + (Number(r.total) || 0), 0),
    [invoiceItems]
  )
  const payable = useMemo(() =>
    Math.max(0, subTotal - (Number(discount) || 0)),
    [subTotal, discount]
  )
  const remaining = useMemo(() =>
    Math.max(0, payable - (Number(givenAmount) || 0)),
    [payable, givenAmount]
  )
  const isAllPaid = payable > 0 && Number(givenAmount) >= payable

  // ── Row handlers ──────────────────────────────────────────────────────────
  const addRow = () => setInvoiceItems(prev => [...prev, createEmptyRow()])
  const removeRow = (id) => {
    if (invoiceItems.length > 1)
      setInvoiceItems(prev => prev.filter(r => r.id !== id))
  }

  const updateRow = (id, field, value) => {
    setInvoiceItems(prev => prev.map(row => {
      if (row.id !== id) return row
      const newRow = { ...row, [field]: value }
      if (field === 'itemId' && value) {
        const found = items.find(i => String(i.id) === String(value))
        if (found) newRow.price = found.sale_price || 0
      }
      if (field === 'categoryId') { newRow.itemId = ''; newRow.price = '' }
      newRow.total = (Number(newRow.price) || 0) * (Number(newRow.quantity) || 0)
      return newRow
    }))
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setEditId(null)
    setMobileNumber('')
    setCustomerName('')
    setCustomerId(null)
    setInvoiceItems([createEmptyRow()])
    setDiscount('')
    setGivenAmount('')
    setDescription('')
    setReceiptNo(generateReceiptNumber())   // fresh receipt no for next new invoice
  }

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleEdit = (rec) => {
    setEditId(rec.id)
    setMobileNumber(rec.mobile || '')
    setCustomerName(rec.customer_name || '')
    setCustomerId(rec.customer_id || null)
    setDescription(rec.description || '')
    setDiscount(rec.discount || '')
    setGivenAmount(rec.paid || '')

    if (rec.items && rec.items.length > 0) {
      setInvoiceItems(rec.items.map(item => ({
        id: Date.now() + Math.random(),   // unique key for React
        categoryId: item.category_id || '',
        itemId: item.item_id || '',
        price: item.sale_price || 0,
        quantity: item.qty || 1,
        total: item.total || 0,
      })))
    } else {
      setInvoiceItems([createEmptyRow()])
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!mobileNumber || !customerName) {
      toast.error('Customer Mobile & Name are required.')
      return
    }

    const validItems = invoiceItems.filter(r => r.itemId && Number(r.quantity) > 0)
    if (validItems.length === 0) {
      toast.error('Please add at least one valid item.')
      return
    }

    setSubmitting(true)

    const itemsPayload = validItems.map(r => ({
      itemId: parseInt(r.itemId),
      quantity: parseInt(r.quantity),
      price: parseFloat(r.price),
      total: parseFloat(r.total),
    }))

    try {
      if (editId) {
        // ── UPDATE ──────────────────────────────────────────────────────────
        await axiosInstance.put(`/sale-invoices/${editId}`, {
          customerId: customerId || null,
          customerName,
          mobileNumber,
          description: description || null,
          discount: Number(discount) || 0,
          givenAmount: Number(givenAmount) || 0,
          subTotal,
          payable,
          toBePaid: remaining,
          returnAmount: 0,
          returnDescription: null,
          items: itemsPayload,
        })
        toast.success('Invoice updated successfully!')
      } else {
        // ── CREATE ──────────────────────────────────────────────────────────
        await axiosInstance.post('/sale-invoices', {
          customerId: customerId || null,
          customerName,
          mobileNumber,
          receiptNo,
          description: description || null,
          discount: Number(discount) || 0,
          givenAmount: Number(givenAmount) || 0,
          subTotal,
          payable,
          toBePaid: remaining,
          returnAmount: 0,
          returnDescription: null,
          items: itemsPayload,
        })
        toast.success('Invoice saved successfully!')
      }

      resetForm()
      fetchSales()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save invoice.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sales record?')) return
    try {
      await axiosInstance.delete(`/sale-invoices/${id}`)
      toast.success('Sale deleted successfully')
      if (editId === id) resetForm()
      fetchSales()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete invoice')
    }
  }

  return (
    <PageShell
      title="Sales Invoice"
      description="Create a new sale and print invoice."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-4">
        <Card className="mx-auto max-w-5xl border-l-[6px] border-l-teal-500 p-3">

          {/* ── Header ── */}
          <SectionHeader
            title={editId ? 'Edit Invoice' : 'Create New Invoice'}
            description={editId ? `Editing Invoice #${editId}` : 'Process a new customer order.'}
            icon={<InvoiceIcon className="h-5 w-5" />}
            action={editId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel Edit
              </button>
            )}
          />

          <form onSubmit={handleSubmit} className="space-y-3">

            {/* ── Customer ── */}
            <SectionCard color="teal" title="Customer Details">
              <div className="flex flex-wrap gap-3 items-end">
                <Field label="Mobile Number" required>
                  <div className="relative">
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={handleMobileChange}
                      onFocus={() => { if (mobileNumber.length >= 4) setShowCustomerDropdown(true) }}
                      onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                      placeholder="e.g. 03001234567"
                      className="h-7 w-48 rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                    />
                    {showCustomerDropdown && matchingCustomers.length > 0 && (
                      <ul className="absolute left-0 top-full mt-1 max-h-48 w-64 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl z-50">
                        {matchingCustomers.map(c => (
                          <li key={c.id} onClick={() => handleSelectCustomer(c)}
                            className="block w-full cursor-pointer px-3 py-1.5 text-left hover:bg-teal-50 transition">
                            <p className="text-[12px] font-semibold text-slate-800">{c.customer_name}</p>
                            <p className="text-[10px] text-slate-500">{c.mobile_number}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Field>
                <Field label="Customer Name" required>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className={`h-7 w-64 rounded-md border text-[11px] outline-none transition px-2 ${customerId
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-slate-300 bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100'
                      }`}
                  />
                </Field>
              </div>
            </SectionCard>

            {/* ── Items ── */}
            <SectionCard color="teal" title="Invoice Items">
              <div className="space-y-2">
                <div className="hidden grid-cols-[180px_1fr_90px_70px_100px_40px] gap-2 px-1 sm:grid">
                  {['Category', 'Search Item', 'Price', 'Qty', 'Total', ''].map((h, i) => (
                    <div key={i} className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{h}</div>
                  ))}
                </div>

                {invoiceItems.map(row => {
                  const catItems = items.filter(i => String(i.item_category_id) === String(row.categoryId))
                  return (
                    <div key={row.id} className="grid grid-cols-2 gap-2 sm:grid-cols-[180px_1fr_90px_70px_100px_40px] items-center bg-slate-50 p-1.5 sm:bg-transparent rounded-lg border sm:border-0 border-slate-200">
                      <div className="col-span-2 sm:col-span-1">
                        <select value={row.categoryId}
                          onChange={e => updateRow(row.id, 'categoryId', e.target.value)}
                          className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none focus:border-teal-400">
                          <option value="">Select Category</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <select value={row.itemId}
                          onChange={e => updateRow(row.id, 'itemId', e.target.value)}
                          disabled={!row.categoryId}
                          className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none focus:border-teal-400 disabled:bg-slate-100">
                          <option value="">Select Item</option>
                          {catItems.map(i => <option key={i.id} value={i.id}>{i.item_name}</option>)}
                        </select>
                      </div>
                      <input type="number" step="0.01" value={row.price}
                        onChange={e => updateRow(row.id, 'price', e.target.value)}
                        placeholder="Price"
                        className="col-span-1 h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none focus:border-teal-400" />
                      <input type="number" min="1" value={row.quantity}
                        onChange={e => updateRow(row.id, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="col-span-1 h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none focus:border-teal-400" />
                      <div className="col-span-1 bg-white border border-slate-200 h-7 flex items-center px-2 rounded-md font-medium text-slate-700 text-[11px]">
                        PKR {Number(row.total || 0).toFixed(2)}
                      </div>
                      <div className="col-span-1 flex justify-end sm:justify-center">
                        <ActionButton label="Delete" tone="rose" onClick={() => removeRow(row.id)} />
                      </div>
                    </div>
                  )
                })}

                <div className="pt-1">
                  <button type="button" onClick={addRow}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-teal-300 bg-teal-50/50 px-3 py-1.5 text-[11px] font-semibold text-teal-700 hover:bg-teal-50 transition">
                    <PlusIcon className="h-3.5 w-3.5" /> Add Row
                  </button>
                </div>
              </div>
            </SectionCard>

            {/* ── Notes ── */}
            <SectionCard color="teal" title="Additional Information">
              <Field label="Invoice Description / Notes">
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Enter any additional notes..." rows="2"
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[11px] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
              </Field>
              <div className="mt-1 text-[10px] text-slate-400">
                {editId
                  ? <span>Editing Invoice <span className="font-mono font-medium">#{editId}</span></span>
                  : <>Receipt No: <span className="font-mono font-medium">{receiptNo}</span></>
                }
              </div>
            </SectionCard>

            {/* ── Summary ── */}
            <SectionCard color="teal" title="Order Summary">
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between p-1.5">
                <div className="flex bg-slate-50 p-3 rounded-xl border border-slate-200 w-full md:w-auto flex-col gap-2 min-w-[260px]">
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-slate-500">Subtotal:</span>
                    <span className="font-semibold text-slate-800">PKR {subTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[12px] gap-3">
                    <span className="text-slate-500 shrink-0">Discount:</span>
                    <input type="number" step="0.01" value={discount}
                      onChange={e => setDiscount(e.target.value)} placeholder="0.00"
                      className="h-6 w-20 rounded border border-slate-300 px-1.5 text-[11px] text-right outline-none focus:border-teal-400" />
                  </div>
                  <div className="h-px bg-slate-200 my-0.5 w-full" />
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="font-bold text-slate-700">Payable:</span>
                    <span className="font-bold text-teal-600">PKR {payable.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex flex-col w-full md:w-auto gap-2 flex-1 md:max-w-[350px]">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
                    <div className="flex-1 px-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Customer Given</p>
                      <input type="number" step="0.01" value={givenAmount}
                        onChange={e => setGivenAmount(e.target.value)} placeholder="Amount tendered"
                        className="h-7 w-full text-[12px] font-bold text-slate-800 outline-none" />
                    </div>
                  </div>
                  {Number(givenAmount) > 0 && (
                    <div className={`p-2 rounded-lg border flex items-center justify-between ${isAllPaid ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                      <span className={`text-[11px] font-bold ${isAllPaid ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isAllPaid ? 'ALL PAID' : 'TO BE PAID'}
                      </span>
                      {isAllPaid ? (
                        <div className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                          <span>Change: PKR {(Number(givenAmount) - payable).toFixed(2)}</span>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                      ) : (
                        <span className="font-bold text-rose-600 font-mono text-[11px]">PKR {remaining.toFixed(2)}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end gap-2">
                {editId && (
                  <button type="button" onClick={resetForm}
                    className="inline-flex min-w-[110px] items-center justify-center rounded-xl border border-slate-200 px-5 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition">
                    Cancel
                  </button>
                )}
                <button type="submit" disabled={submitting || payable === 0}
                  className="inline-flex min-w-[140px] items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2 text-[12px] font-bold text-white shadow-lg shadow-teal-400 hover:bg-teal-700 transition disabled:opacity-50 disabled:shadow-none">
                  <InvoiceIcon className="h-4 w-4" />
                  {submitting ? 'Saving...' : editId ? 'Update Invoice' : 'Save Invoice'}
                </button>
              </div>
            </SectionCard>
          </form>
        </Card>

        {/* ── Table ── */}
        <Card className="mx-auto max-w-5xl p-3">
          <SectionHeader
            title="Recent Sales"
            description="Log of recent invoices."
            action={
              <button type="button" onClick={fetchSales}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50">
                Refresh
              </button>
            }
          />
          {salesRecord.length === 0 ? (
            <TableState message="No sales records found." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="overflow-x-auto w-full">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      <th className="px-3 py-2.5">Inv ID</th>
                      <th className="px-3 py-2.5">Receipt No</th>
                      <th className="px-3 py-2.5">Customer</th>
                      <th className="px-3 py-2.5">Mobile</th>
                      <th className="px-3 py-2.5 text-right">Total</th>
                      <th className="px-3 py-2.5 text-right">Paid</th>
                      <th className="px-3 py-2.5 text-center">Status</th>
                      <th className="px-3 py-2.5 text-right w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {salesRecord.map((s, idx) => (
                      <tr key={s.id || idx}
                        className={`text-[12px] transition hover:bg-slate-50/50 ${editId === s.id ? 'bg-teal-50/40' : ''}`}>
                        <td className="px-3 py-2 font-medium text-slate-900">#{s.id}</td>
                        <td className="px-3 py-2 font-mono text-[10px] text-slate-500">{s.receipt_no || '—'}</td>
                        <td className="px-3 py-2 text-slate-600">{s.customer_name || '—'}</td>
                        <td className="px-3 py-2 text-slate-600">{s.mobile || '—'}</td>
                        <td className="px-3 py-2 text-right font-bold text-slate-800">PKR {Number(s.payable || 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-slate-600">PKR {Number(s.paid || 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-center">
                          <StatusChip
                            enabled={s.status === 'paid'}
                            label={s.status.replace('_', ' ').toUpperCase()}
                            colorClass={
                              s.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700'
                                : s.status === 'partially_paid'
                                  ? 'bg-yellow-50 text-yellow-700'
                                  : 'bg-amber-50 text-amber-700'
                            }
                          />
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