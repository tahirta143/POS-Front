import { useEffect, useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, Field, PageShell, SectionHeader, StatusAlert, TableState, ActionButton, StatusChip } from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance'
import { MdAdd, MdRemove, MdRefresh, MdEventAvailable, MdHistory, MdPayment, MdSearch } from 'react-icons/md'

const sectionStyles = {
  teal: { accent: 'bg-teal-500', header: 'border-teal-100 bg-teal-50/80' },
}

function SectionCard({ title, children }) {
  const style = sectionStyles.teal
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

function createEmptyRow() {
  return { id: Date.now() + Math.random(), category_id: '', item_id: '', price: '', quantity: 1, total: 0 }
}

export default function Bookings() {
  const [customers, setCustomers] = useState([])
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [bookingsRecord, setBookingsRecord] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editId, setEditId] = useState(null)

  // Form State
  const [mobileNumber, setMobileNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerId, setCustomerId] = useState(null)
  const [address, setAddress] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [invoiceItems, setInvoiceItems] = useState([createEmptyRow()])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [discount, setDiscount] = useState('')
  const [givenAmount, setGivenAmount] = useState('')

  useEffect(() => {
    fetchInitialData()
    fetchBookings()
  }, [])

  async function fetchInitialData() {
    try {
      const [cusRes, catRes, itmRes] = await Promise.all([
        axiosInstance.get('/customers').catch(() => ({ ok: false })),
        axiosInstance.get('/categories').catch(() => ({ ok: false })),
        axiosInstance.get('/item-details').catch(() => ({ ok: false }))
      ])
      if (cusRes.data) {
        const d = cusRes.data
        setCustomers(Array.isArray(d) ? d : d.data || [])
      }
      if (catRes.data) {
        const d = catRes.data
        setCategories(Array.isArray(d) ? d : d.data || [])
      }
      if (itmRes.data) {
        const d = itmRes.data
        setItems(Array.isArray(d) ? d : d.data || [])
      }
    } catch (e) {
      toast.error('Failed to load dependency data')
    }
  }

  async function fetchBookings() {
    setLoading(true)
    try {
      const response = await axiosInstance.get('/bookings')
      if (response.data) {
        const data = response.data
        setBookingsRecord(Array.isArray(data) ? data : data.data || [])
      }
    } catch {
      setBookingsRecord([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this booking?')) return
    try {
      await axiosInstance.delete(`/bookings/${id}`)
      toast.success('Booking deleted successfully')
      if (editId === id) resetForm()
      fetchBookings()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete booking')
    }
  }

  const handleEdit = (rec) => {
    setEditId(rec.id)
    setMobileNumber(rec.mobile_number || '')
    setCustomerName(rec.customer_name || '')
    setCustomerId(rec.customer_id)
    setAddress(rec.address || '')
    setBookingDate(rec.booking_date || '')
    setBookingTime(rec.booking_time || '')
    setDiscount(rec.discount || '')
    setGivenAmount(rec.paid || '')
    setPaymentMethod(rec.payment_method || 'Cash')

    if (rec.items && rec.items.length > 0) {
      setInvoiceItems(rec.items.map(item => ({
        id: Date.now() + Math.random(),
        category_id: item.category_id || '',
        item_id: item.item_id,
        price: item.price || 0,
        quantity: item.qty || 1,
        total: (item.price || 0) * (item.qty || 1)
      })))
    } else {
      setInvoiceItems([createEmptyRow()])
    }
    setIsFormOpen(true)
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
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
    if (val.length >= 4) {
      setShowCustomerDropdown(true)
    } else {
      setShowCustomerDropdown(false)
      setCustomerName('')
      setCustomerId(null)
    }
    if (customerId) setCustomerId(null)
  }

  const handleSelectCustomer = (customer) => {
    setMobileNumber(customer.mobile_number)
    setCustomerName(customer.customer_name)
    setCustomerId(customer.id)
    if (customer.address) setAddress(customer.address)
    setShowCustomerDropdown(false)
  }

  const subTotal = useMemo(() => {
    return invoiceItems.reduce((sum, row) => sum + (Number(row.total) || 0), 0)
  }, [invoiceItems])

  const payable = useMemo(() => {
    const disc = Number(discount) || 0
    return Math.max(0, subTotal - disc)
  }, [subTotal, discount])

  const remaining = useMemo(() => {
    const given = Number(givenAmount) || 0
    // If it's overpaid, remaining is 0
    return Math.max(0, payable - given)
  }, [payable, givenAmount])

  const isAllPaid = payable > 0 && Number(givenAmount) >= payable
  const isPartiallyPaid = payable > 0 && Number(givenAmount) > 0 && Number(givenAmount) < payable

  const addRow = () => setInvoiceItems([...invoiceItems, createEmptyRow()])
  const removeRow = (id) => {
    if (invoiceItems.length > 1) setInvoiceItems(invoiceItems.filter(r => r.id !== id))
  }

  const updateRow = (id, field, value) => {
    setInvoiceItems(prev => prev.map(row => {
      if (row.id === id) {
        const newRow = { ...row, [field]: value }
        if (field === 'item_id' && value) {
          const selectedItem = items.find(i => String(i.id) === String(value))
          if (selectedItem) newRow.price = selectedItem.sale_price || 0
        }
        if (field === 'category_id') {
          newRow.item_id = ''
          newRow.price = ''
        }
        const p = Number(newRow.price) || 0
        const q = Number(newRow.quantity) || 0
        newRow.total = p * q
        return newRow
      }
      return row
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!mobileNumber || !customerName) {
      toast.error('Customer Mobile & Name required.')
      return
    }

    const validItems = invoiceItems.filter(r => r.item_id && r.quantity > 0)
    if (validItems.length === 0) {
      toast.error('Add at least one item.')
      return
    }

    setSubmitting(true)

    const payload = {
      customer_id: customerId,
      items: validItems.map(r => ({
        item_id: r.item_id,
        qty: r.quantity,
      })),
      sub_total: subTotal,
      discount: Number(discount) || 0,
      payable: payable,
      paid: Number(givenAmount) || 0,
      to_be_paid: remaining,
      payment_method: paymentMethod,
      booking_date: bookingDate,
      booking_time: bookingTime,
      status: editId ? undefined : (isAllPaid ? 'Paid' : isPartiallyPaid ? 'Partially Paid' : 'Pending')
    }

    try {
      if (editId) {
        await axiosInstance.put(`/bookings/${editId}`, payload)
        toast.success('Booking updated successfully!')
      } else {
        await axiosInstance.post('/bookings', payload)
        toast.success('Booking saved successfully!')
      }
      resetForm()
      setIsFormOpen(false)
      fetchBookings()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save booking.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setEditId(null)
    setMobileNumber('')
    setCustomerName('')
    setCustomerId(null)
    setAddress('')
    setBookingDate('')
    setBookingTime('')
    setInvoiceItems([createEmptyRow()])
    setDiscount('')
    setGivenAmount('')
    setPaymentMethod('Cash')
  }

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between">
           <div>
            <h1 className="text-xl font-bold text-slate-900">Customer Bookings</h1>
            <p className="text-sm text-slate-500">Record advance orders and booking deposits.</p>
          </div>
          <button
            onClick={() => {
              if (isFormOpen && editId) {
                resetForm()
                document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
              } else {
                const opening = !isFormOpen
                setIsFormOpen(opening)
                if (opening) {
                  resetForm()
                  document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
                }
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
                <MdAdd className="h-5 w-5" /> New Booking
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
              <Card className="mx-auto max-w-6xl border-l-[6px] border-l-teal-500 p-6 mb-6">
                <SectionHeader
                  title={editId ? 'View/Edit Booking' : 'New Advance Booking'}
                  description="Register a new customer appointment or order."
                  icon={<MdEventAvailable className="h-6 w-6 text-teal-600" />}
                />

                <form onSubmit={handleSubmit} className="space-y-3 mt-2">
                  <SectionCard title="Customer & Appointment">
                    <div className="flex flex-wrap gap-4 items-end py-1">
                      <Field label="Mobile Number" required>
                        <div className="relative">
                          <input
                            type="tel"
                            value={mobileNumber}
                            onChange={handleMobileChange}
                            onFocus={() => { if (mobileNumber.length >= 4) setShowCustomerDropdown(true) }}
                            onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                            placeholder="Search Mobile"
                            className="h-8 w-44 rounded-md border border-slate-300 bg-white px-2.5 pr-8 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 relative z-10"
                          />
                          <MdSearch className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 z-10" />
                          {showCustomerDropdown && matchingCustomers.length > 0 && (
                            <ul className="absolute left-0 top-full mt-1 max-h-48 w-64 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl z-50">
                              {matchingCustomers.map(c => (
                                <li key={c.id} onClick={() => handleSelectCustomer(c)} className="block w-full cursor-pointer px-3 py-1.5 text-left hover:bg-teal-50 transition">
                                  <p className="text-[12px] font-semibold text-slate-800">{c.customer_name}</p>
                                  <p className="text-[10px] text-slate-500">{c.mobile_number}</p>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </Field>
                      <Field label="Customer Name" required >
                        <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full Name" className={`h-8 w-60 rounded-md border text-[12px] outline-none transition px-2.5 ${customerId ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-bold' : 'border-slate-300 bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100'}`} />
                      </Field>
                      <Field label="Booking Date" required>
                        <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="h-8 w-36 rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
                      </Field>
                      <Field label="Time" required>
                        <input type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} className="h-8 w-28 rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
                      </Field>
                    </div>
                  </SectionCard>

                  <SectionCard title="Booked Items">
                    <div className="space-y-2 mt-1">
                      <div className="hidden grid-cols-[180px_1fr_100px_80px_120px_50px] gap-3 px-2 sm:grid uppercase tracking-widest text-[10px] font-bold text-slate-400">
                        <div>Category</div>
                        <div>Select Item</div>
                        <div className="text-right">Price</div>
                        <div className="text-center">Qty</div>
                        <div className="text-right">Subtotal</div>
                        <div></div>
                      </div>

                      {invoiceItems.map((row) => {
                        const availableItems = items.filter(i => String(i.item_category_id) === String(row.category_id))
                        return (
                          <div key={row.id} className="grid grid-cols-2 gap-2 sm:grid-cols-[180px_1fr_100px_80px_120px_50px] items-center bg-slate-50/50 p-2 sm:p-0 sm:bg-transparent rounded-xl border border-slate-200 sm:border-0">
                            <div className="col-span-2 sm:col-span-1">
                              <select value={row.category_id} onChange={(e) => updateRow(row.id, 'category_id', e.target.value)} className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] outline-none">
                                <option value="">Category</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                              </select>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                              <select value={row.item_id} onChange={(e) => updateRow(row.id, 'item_id', e.target.value)} disabled={!row.category_id} className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] outline-none disabled:bg-slate-50">
                                <option value="">Select Item</option>
                                {availableItems.map(i => <option key={i.id} value={i.id}>{i.item_name}</option>)}
                              </select>
                            </div>
                            <input type="number" step="0.01" value={row.price} onChange={(e) => updateRow(row.id, 'price', e.target.value)} className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] text-right" placeholder="0.00" />
                            <input type="number" min="1" value={row.quantity} onChange={(e) => updateRow(row.id, 'quantity', e.target.value)} className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] text-center" />
                            <div className="flex items-center justify-end font-bold text-slate-700 text-[12px]">PKR {Number(row.total || 0).toLocaleString()}</div>
                            <div className="flex justify-center">
                              <button type="button" onClick={() => removeRow(row.id)} className="text-rose-400 hover:text-rose-600 transition-colors" title="Remove Item">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )
                      })}

                      <div className="pt-2">
                        <button type="button" onClick={addRow} className="inline-flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-2 text-[12px] font-bold text-teal-700 border border-teal-200 hover:bg-teal-100 transition"><MdAdd className="h-4 w-4" /> Add Line</button>
                      </div>
                    </div>
                  </SectionCard>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <SectionCard title="Payment & Financials">
                      <div className="space-y-3 py-1">
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Subtotal</span>
                            <span className="font-bold text-slate-800">PKR {subTotal.toLocaleString()}</span>
                         </div>
                         <div className="flex items-center gap-3">
                            <span className="text-slate-500 text-sm flex-1">Discount</span>
                            <input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0.00" className="h-8 w-32 rounded border border-slate-300 text-right px-2 text-[12px] focus:border-teal-400" />
                         </div>
                         <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                            <span className="font-bold text-slate-700 text-sm">Payable Amount</span>
                            <span className="text-xl font-black text-teal-600 font-mono">PKR {payable.toLocaleString()}</span>
                         </div>
                      </div>
                    </SectionCard>

                    <SectionCard title="Advance Deposit">
                       <div className="space-y-4 py-1">
                         <div className="flex gap-3">
                           <div className="flex-1 space-y-1">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Method</p>
                             <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="h-10 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-3 text-[12px] font-bold outline-none focus:border-teal-500 transition">
                                <option value="Cash">Cash</option>
                                <option value="Online">Online</option>
                                <option value="Card">Card</option>
                                <option value="COD">COD</option>
                             </select>
                           </div>
                           <div className="flex-1 space-y-1">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Amount Paid</p>
                             <input type="number" value={givenAmount} onChange={(e) => setGivenAmount(e.target.value)} className="h-10 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 text-lg font-black text-slate-800 focus:border-emerald-500 focus:bg-white transition outline-none" placeholder="0.00" />
                           </div>
                         </div>
                         {payable > 0 && givenAmount > 0 && (
                            <div className={`p-3 rounded-xl border-2 flex items-center justify-between ${isAllPaid ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                               <span className={`text-[11px] font-black uppercase tracking-widest ${isAllPaid ? 'text-emerald-700' : 'text-rose-700'}`}>{isAllPaid ? 'FULL DEPOSIT' : 'PARTIAL'}</span>
                               <span className={`font-mono font-bold text-sm ${isAllPaid ? 'text-emerald-600' : 'text-rose-600'}`}>PKR {isAllPaid ? (givenAmount - payable).toLocaleString() : remaining.toLocaleString()}</span>
                            </div>
                         )}
                       </div>
                    </SectionCard>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => { resetForm(); setIsFormOpen(false) }} className="rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 transition">Cancel</button>
                    <button type="submit" disabled={submitting || payable <= 0} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition disabled:opacity-50">
                       <MdEventAvailable className="h-5 w-5" /> {submitting ? 'Saving...' : editId ? 'Update Booking' : 'Confirm Booking'}
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bookings List Table */}
        <Card className="mx-auto max-w-6xl p-0 overflow-hidden">
          <SectionHeader
            title="Booking Registry"
            description="Log of upcoming customer appointments and orders."
            icon={<MdHistory className="h-6 w-6 text-teal-600" />}
            action={
              <div className="p-4">
                <button type="button" onClick={fetchBookings} className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50">Refresh Log</button>
              </div>
            }
          />

          {loading ? (
            <TableState message="Loading booking records..." />
          ) : bookingsRecord.length === 0 ? (
            <TableState message="No booking records found." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">Booking ID</th>
                    <th className="px-5 py-3">Customer Info</th>
                    <th className="px-5 py-3">Date & Time</th>
                    <th className="px-5 py-3 text-right">Payable</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {bookingsRecord.map((s) => {
                    const statusPayload = s.paid >= s.payable 
                      ? { label: 'PAID', tone: 'emerald' } 
                      : (s.paid > 0 ? { label: 'PARTIAL', tone: 'amber' } : { label: 'PENDING', tone: 'rose' })
                    
                    return (
                      <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`group transition-colors hover:bg-teal-50/30 ${editId === s.id ? 'bg-teal-50/50' : ''}`}>
                        <td className="px-5 py-4 font-mono text-[11px] font-bold text-slate-400">#BK-{String(s.id).slice(-4)}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                             <span className="font-bold text-slate-800 text-[12px]">{s.customer_name}</span>
                             <span className="text-[10px] text-teal-600 font-bold uppercase tracking-tighter">{s.mobile_number || 'No Contact'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                             <span className="text-[12px] font-semibold text-slate-600">{s.booking_date}</span>
                             <span className="text-[10px] text-slate-400">{s.booking_time || 'No time set'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                           <span className="text-[12px] font-bold text-slate-700">PKR {Number(s.payable || 0).toLocaleString()}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                           <StatusChip label={statusPayload.label} tone={statusPayload.tone} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-2">
                             <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(s)} />
                             <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(s.id)} />
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  )
}
