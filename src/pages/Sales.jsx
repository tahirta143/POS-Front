import { useEffect, useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, Field, PageShell, SectionHeader, TableState, ActionButton, StatusChip } from '../components/layout/PageShell.jsx'
import axiosInstance from '../services/axiosInstance'
import { MdAdd, MdRemove, MdArrowBack, MdReceipt, MdPerson, MdPhone, MdDescription, MdOutlineEdit, MdDeleteOutline } from 'react-icons/md'

const sectionStyles = {
  indigo: { accent: 'bg-indigo-500', header: 'border-indigo-100 bg-indigo-50/80' },
  emerald: { accent: 'bg-emerald-500', header: 'border-emerald-100 bg-emerald-50/80' },
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
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editId, setEditId] = useState(null)

  // Form state
  const [mobileNumber, setMobileNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerId, setCustomerId] = useState(null)
  const [invoiceItems, setInvoiceItems] = useState([createEmptyRow()])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [discount, setDiscount] = useState('')
  const [givenAmount, setGivenAmount] = useState('')
  const [description, setDescription] = useState('')
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
      toast.error('Failed to load initial data')
    }
  }

  async function fetchSales() {
    setLoading(true)
    try {
      const res = await axiosInstance.get('/sale-invoices')
      if (res.data) setSalesRecord(Array.isArray(res.data) ? res.data : res.data.data || [])
    } catch {
      setSalesRecord([])
    } finally {
      setLoading(false)
    }
  }

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

  const resetForm = () => {
    setEditId(null)
    setMobileNumber('')
    setCustomerName('')
    setCustomerId(null)
    setInvoiceItems([createEmptyRow()])
    setDiscount('')
    setGivenAmount('')
    setDescription('')
    setReceiptNo(generateReceiptNumber())
  }

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
        id: Date.now() + Math.random(),
        categoryId: item.category_id || '',
        itemId: item.item_id || '',
        price: item.sale_price || 0,
        quantity: item.qty || 1,
        total: item.total || 0,
      })))
    } else {
      setInvoiceItems([createEmptyRow()])
    }
    setIsFormOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
      setIsFormOpen(false)
      fetchSales()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save invoice.')
    } finally {
      setSubmitting(false)
    }
  }

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
    <PageShell>
      <div className="space-y-4">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between">
           <div>
            <h1 className="text-xl font-bold text-slate-900">Sales Invoice</h1>
            <p className="text-sm text-slate-500">Create and manage customer invoices.</p>
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
                <MdRemove className="h-5 w-5" /> Close Form
              </>
            ) : (
              <>
                <MdAdd className="h-5 w-5" /> New Sale
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
                  title={editId ? 'Modify Invoice' : 'Create New Invoice'}
                  description="Process a new customer order."
                  icon={<MdReceipt className="h-6 w-6 text-teal-600" />}
                />

                <form onSubmit={handleSubmit} className="space-y-3 mt-2">
                  <SectionCard color="teal" title="Customer Identification">
                    <div className="flex flex-wrap gap-4 items-end py-1">
                      <Field label="Mobile Number" required>
                        <div className="relative">
                          <input
                            type="tel"
                            value={mobileNumber}
                            onChange={handleMobileChange}
                            onFocus={() => { if (mobileNumber.length >= 4) setShowCustomerDropdown(true) }}
                            onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                            placeholder="Search or Enter Mobile"
                            className="h-8 w-52 rounded-md border border-slate-300 bg-white px-2.5 pr-8 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                          />
                          <MdPhone className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
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
                        <div className="relative">
                          <input
                            type="text"
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            placeholder="Full Name"
                            className={`h-8 w-64 rounded-md border text-[12px] outline-none transition px-2.5 pr-8 ${customerId
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-bold'
                                : 'border-slate-300 bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 shadow-sm'
                              }`}
                          />
                          <MdPerson className={`absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 ${customerId ? 'text-emerald-500' : 'text-slate-400'}`} />
                        </div>
                      </Field>
                    </div>
                  </SectionCard>

                  <SectionCard color="teal" title="Invoice Items">
                    <div className="space-y-2 mt-1">
                      <div className="hidden grid-cols-[180px_1fr_100px_80px_120px_50px] gap-3 px-2 sm:grid">
                         {['Category', 'Item Search', 'Unit Price', 'Qty', 'Subtotal', ''].map((h, i) => (
                           <div key={i} className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest ${i === 2 || i === 4 ? 'text-right' : i === 3 ? 'text-center' : ''}`}>{h}</div>
                         ))}
                      </div>

                      {invoiceItems.map(row => {
                        const catItems = items.filter(i => String(i.item_category_id) === String(row.categoryId))
                        return (
                          <div key={row.id} className="grid grid-cols-2 gap-2 sm:grid-cols-[180px_1fr_100px_80px_120px_50px] items-center bg-slate-50/50 p-2 sm:p-0 sm:bg-transparent rounded-xl border border-slate-200 sm:border-0">
                            <div className="col-span-2 sm:col-span-1">
                              <select value={row.categoryId}
                                onChange={e => updateRow(row.id, 'categoryId', e.target.value)}
                                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] outline-none border-t-0 border-x-0 sm:border-t sm:border-x">
                                <option value="">Category</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                              </select>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                              <select value={row.itemId}
                                onChange={e => updateRow(row.id, 'itemId', e.target.value)}
                                disabled={!row.categoryId}
                                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] outline-none disabled:bg-slate-50">
                                <option value="">Select Item</option>
                                {catItems.map(i => <option key={i.id} value={i.id}>{i.item_name}</option>)}
                              </select>
                            </div>
                            <input type="number" step="0.01" value={row.price}
                              onChange={e => updateRow(row.id, 'price', e.target.value)}
                              placeholder="0.00"
                              className="col-span-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] text-right focus:border-teal-400" />
                            <input type="number" min="1" value={row.quantity}
                              onChange={e => updateRow(row.id, 'quantity', e.target.value)}
                              className="col-span-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] text-center focus:border-teal-400" />
                            <div className="col-span-1 flex items-center justify-end font-bold text-slate-700 text-[12px]">
                              PKR {Number(row.total || 0).toLocaleString()}
                            </div>
                            <div className="col-span-1 flex justify-center">
                              <button type="button" onClick={() => removeRow(row.id)} className="text-rose-500 hover:text-rose-700 transition">
                                <MdDeleteOutline className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        )
                      })}

                      <div className="pt-2">
                        <button type="button" onClick={addRow}
                          className="inline-flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-2 text-[12px] font-bold text-teal-700 border border-teal-200 hover:bg-teal-100 transition">
                          <MdAdd className="h-4 w-4" /> Add Row
                        </button>
                      </div>
                    </div>
                  </SectionCard>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <SectionCard color="teal" title="Order Summary">
                       <div className="space-y-3 py-1">
                          <div className="flex justify-between items-center text-sm">
                             <span className="text-slate-500">Gross Total</span>
                             <span className="font-bold text-slate-800">PKR {subTotal.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className="text-slate-500 text-sm flex-1">Discount Amount</span>
                             <div className="relative">
                                <input type="number" step="0.01" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0.00" className="h-8 w-32 rounded border border-slate-300 text-right pr-6 px-2 text-[12px] focus:border-teal-400" />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">PKR</span>
                             </div>
                          </div>
                          <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                             <span className="font-bold text-slate-700 text-sm">Net Payable</span>
                             <span className="text-xl font-black text-teal-600 font-mono">PKR {payable.toLocaleString()}</span>
                          </div>
                       </div>
                    </SectionCard>

                    <SectionCard color="teal" title="Payment Control">
                       <div className="space-y-3 py-1">
                         <div className="space-y-1">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Customer Given Amount</p>
                           <input type="number" step="0.01" value={givenAmount} onChange={e => setGivenAmount(e.target.value)} className="h-10 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 text-lg font-black text-slate-800 focus:border-emerald-500 focus:bg-white transition outline-none" placeholder="0.00" />
                         </div>
                         {payable > 0 && givenAmount > 0 && (
                            <div className={`p-3 rounded-xl border-2 flex items-center justify-between ${isAllPaid ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                               <span className={`text-[11px] font-black uppercase tracking-widest ${isAllPaid ? 'text-emerald-700' : 'text-rose-700'}`}>
                                 {isAllPaid ? 'FULLY PAID' : 'REMAINING'}
                               </span>
                               <span className={`font-mono font-bold text-sm ${isAllPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                                 PKR {isAllPaid ? (Number(givenAmount) - payable).toLocaleString() : remaining.toLocaleString()}
                               </span>
                            </div>
                         )}
                       </div>
                    </SectionCard>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="text-[10px] text-slate-400 font-medium">
                        {editId ? <span>Ref ID: <span className="font-mono">#{editId}</span></span> : <span>RCP ID: <span className="font-mono">{receiptNo}</span></span>}
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => { resetForm(); setIsFormOpen(false) }} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 transition">Cancel</button>
                      <button type="submit" disabled={submitting || payable <= 0} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition disabled:opacity-50">
                        <MdReceipt className="h-5 w-5" /> {submitting ? 'Saving...' : editId ? 'Update & Print' : 'Confirm & Print'}
                      </button>
                    </div>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sales Log Table */}
        <Card className="mx-auto max-w-5xl p-0 overflow-hidden">
          <SectionHeader
            title="Sales Log"
            description="Recent invoices and customer transaction history."
            icon={<MdReceipt className="h-6 w-6 text-teal-600" />}
            action={
              <div className="p-4">
                <button type="button" onClick={fetchSales} className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50">Refresh Log</button>
              </div>
            }
          />

          {loading ? (
            <TableState message="Loading sales history..." />
          ) : salesRecord.length === 0 ? (
            <TableState message="No sales recorded yet." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">Receipt & Date</th>
                    <th className="px-5 py-3">Customer Info</th>
                    <th className="px-5 py-3 text-right">Payable</th>
                    <th className="px-5 py-3 text-right">Received</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {salesRecord.map((s) => (
                    <motion.tr 
                      key={s.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`group transition-colors hover:bg-teal-50/30 ${editId === s.id ? 'bg-teal-50/50' : ''}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                           <span className="font-mono text-[11px] font-bold text-slate-700">{s.receipt_no}</span>
                           <span className="text-[10px] text-slate-400 font-semibold">{s.created_at || 'Recently'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-[12px]">{s.customer_name || 'Walk-in Customer'}</span>
                          <span className="text-[10px] text-teal-600 font-bold tracking-tighter">{s.mobile || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                         <span className="text-[12px] font-bold text-slate-700">PKR {Number(s.payable || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                         <span className="text-[12px] font-bold text-emerald-600">PKR {Number(s.paid || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                          <StatusChip enabled={s.paid >= s.payable} labels={{ on: 'PAID', off: 'DUE' }} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                           <button onClick={() => handleEdit(s)} className="p-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition"><MdOutlineEdit className="h-4 w-4"/></button>
                           <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"><MdDeleteOutline className="h-4 w-4"/></button>
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