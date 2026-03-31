import { useEffect, useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import { Card, Field, PageShell, SectionHeader, StatusAlert, TableState, ActionButton } from '../components/layout/PageShell.jsx'
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
    <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm shadow-slate-100/50">
      <div className={`mb-3 flex items-center gap-2.5 rounded-md border px-2.5 py-1.5 ${style.header}`}>
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
          className="h-8 w-full appearance-none rounded-md border border-slate-300 bg-white px-2.5 pr-8 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
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

function InvoiceIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function TrashIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
  return { id: Date.now() + Math.random(), category_id: '', item_id: '', price: '', quantity: 1, total: 0 }
}

export default function Sales() {
  // Master Data
  const [customers, setCustomers] = useState([])
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [salesRecord, setSalesRecord] = useState([])
  
  // Lookup states
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [mobileNumber, setMobileNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerId, setCustomerId] = useState(null)
  const [invoiceItems, setInvoiceItems] = useState([createEmptyRow()])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  
  // Payment State
  const [discount, setDiscount] = useState('')
  const [givenAmount, setGivenAmount] = useState('')

  useEffect(() => {
    fetchInitialData()
    fetchSales()
  }, [])

  async function fetchInitialData() {
    setLoadingInitial(true)
    try {
      const [cusRes, catRes, itmRes] = await Promise.all([
        axiosInstance.get('/customers').catch(() => ({ ok: false })),
        axiosInstance.get('/categories').catch(() => ({ ok: false })),
        axiosInstance.get('/item-details').catch(() => ({ ok: false }))
      ])

      if (cusRes.data) {
        const cusData = cusRes.data
        setCustomers(Array.isArray(cusData) ? cusData : cusData.data || [])
      }
      if (catRes.data) {
        const catData = catRes.data
        setCategories(Array.isArray(catData) ? catData : catData.data || [])
      }
      if (itmRes.data) {
        const itmData = itmRes.data
        setItems(Array.isArray(itmData) ? itmData : itmData.data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingInitial(false)
    }
  }

  async function fetchSales() {
    try {
      const response = await axiosInstance.get('/sale-invoices')
      if (response.data) {
        const data = response.data
        setSalesRecord(Array.isArray(data) ? data : data.data || [])
      }
    } catch {
      // ignore
    }
  }

  // --- Customer Autofill Logic ---
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
    // If user starts typing after selecting, clear the linked ID because it's modified
    if (customerId) setCustomerId(null)
  }

  const handleSelectCustomer = (customer) => {
    setMobileNumber(customer.mobile_number)
    setCustomerName(customer.customer_name)
    setCustomerId(customer.id)
    setShowCustomerDropdown(false)
  }

  // --- Calculations ---
  const subTotal = useMemo(() => {
    return invoiceItems.reduce((sum, row) => sum + (Number(row.total) || 0), 0)
  }, [invoiceItems])

  const payable = useMemo(() => {
    const disc = Number(discount) || 0
    return Math.max(0, subTotal - disc)
  }, [subTotal, discount])

  const remaining = useMemo(() => {
    const given = Number(givenAmount) || 0
    return Math.max(0, payable - given)
  }, [payable, givenAmount])

  const isAllPaid = payable > 0 && givenAmount >= payable

  // --- Handlers ---
  const addRow = () => {
    setInvoiceItems([...invoiceItems, createEmptyRow()])
  }

  const removeRow = (id) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter(r => r.id !== id))
    }
  }

  const updateRow = (id, field, value) => {
    setInvoiceItems(prev => prev.map(row => {
      if (row.id === id) {
        const newRow = { ...row, [field]: value }
        
        // Auto-fill price if item is selected
        if (field === 'item_id' && value) {
          const selectedItem = items.find(i => String(i.id) === String(value))
          if (selectedItem) {
            newRow.price = selectedItem.sale_price || 0
          }
        }
        
        // Reset item if category changes
        if (field === 'category_id') {
          newRow.item_id = ''
          newRow.price = ''
        }

        // Recalculate total
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
      toast.error('Customer Mobile & Name are required.')
      return
    }

    const validItems = invoiceItems.filter(r => r.item_id && r.quantity > 0)
    if (validItems.length === 0) {
      toast.error('Please add at least one valid item to the invoice.')
      return
    }

    setSubmitting(true)

    const payload = {
      customerId: customerId,
      items: validItems.map(r => ({
        id: r.item_id,
        item_id: r.item_id,
        price: r.price,
        qty: r.quantity,
        total: r.total
      })),
      discount: Number(discount) || 0,
      givenAmount: Number(givenAmount) || 0
    }

    try {
      const res = await axiosInstance.post('/sale-invoices', payload)
      
      toast.success('Invoice saved successfully!')
      // Reset Form
      setMobileNumber('')
      setCustomerName('')
      setCustomerId(null)
      setInvoiceItems([createEmptyRow()])
      setDiscount('')
      setGivenAmount('')
      fetchSales()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save invoice.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell
      title="Sales Invoice"
      description="Create a new sale and print invoice."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-6">
        <Card className="mx-auto max-w-5xl border-l-[6px] border-l-teal-500 p-4">
          <SectionHeader
            title="Create New Invoice"
            description="Process a new customer order."
            icon={<InvoiceIcon className="h-6 w-6" />}
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer Search Section */}
            <SectionCard color="teal" title="Customer Details">
              <div className="flex flex-wrap gap-5 items-start">
                <Field label="Mobile Number" required>
                  <div className="relative">
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={handleMobileChange}
                      onFocus={() => { if (mobileNumber.length >= 4) setShowCustomerDropdown(true) }}
                      onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                      placeholder="e.g. 03001234567"
                      className="h-8 w-48 rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 relative z-10"
                    />
                    {showCustomerDropdown && matchingCustomers.length > 0 && (
                      <ul className="absolute left-0 top-full mt-1 max-h-48 w-64 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl z-50">
                        {matchingCustomers.map(c => (
                          <li
                            key={c.id}
                            onClick={() => handleSelectCustomer(c)}
                            className="block w-full cursor-pointer px-3 py-2 text-left hover:bg-teal-50 transition"
                          >
                            <p className="text-[13px] font-semibold text-slate-800">{c.customer_name}</p>
                            <p className="text-[11px] text-slate-500">{c.mobile_number}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Field>
                <Field label="Customer Name" required hint={customerId ? "Auto-filled from registry" : "New walk-in customer"}>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className={`h-8 w-72 rounded-md border text-[12px] outline-none transition px-2.5 ${
                      customerId 
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800' 
                      : 'border-slate-300 bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100'
                    }`}
                  />
                </Field>
              </div>
            </SectionCard>

            {/* Invoice Items Section */}
            <SectionCard color="teal" title="Invoice Items">
              <div className="space-y-3">
                {/* Headers (desktop only) */}
                <div className="hidden grid-cols-[200px_1fr_100px_80px_120px_40px] gap-3 px-1 sm:grid">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Category</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Search Item</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Price</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Qty</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total</div>
                  <div></div>
                </div>

                {/* Rows */}
                {invoiceItems.map((row) => {
                  const availableItemsForCat = items.filter(i => String(i.item_category_id) === String(row.category_id))
                  return (
                    <div key={row.id} className="grid grid-cols-2 gap-3 sm:grid-cols-[200px_1fr_100px_80px_120px_40px] items-center bg-slate-50 p-2 sm:bg-transparent rounded-lg border sm:border-0 border-slate-200">
                      <div className="col-span-2 sm:col-span-1">
                        <select
                          value={row.category_id}
                          onChange={(e) => updateRow(row.id, 'category_id', e.target.value)}
                          className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400"
                        >
                          <option value="">Select Category</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.category_name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <select
                          value={row.item_id}
                          onChange={(e) => updateRow(row.id, 'item_id', e.target.value)}
                          disabled={!row.category_id}
                          className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 disabled:bg-slate-100"
                        >
                          <option value="">Select Item</option>
                          {availableItemsForCat.map(i => (
                            <option key={i.id} value={i.id}>{i.item_name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-1">
                        <input
                          type="number"
                          value={row.price}
                          onChange={(e) => updateRow(row.id, 'price', e.target.value)}
                          placeholder="Price"
                          className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400"
                        />
                      </div>

                      <div className="col-span-1">
                         <input
                          type="number"
                          min="1"
                          value={row.quantity}
                          onChange={(e) => updateRow(row.id, 'quantity', e.target.value)}
                          placeholder="Qty"
                          className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400"
                        />
                      </div>

                      <div className="col-span-1 bg-white border border-slate-200 h-8 flex items-center px-2.5 rounded-md font-medium text-slate-700 text-[12px]">
                        PKR {Number(row.total || 0).toFixed(2)}
                      </div>

                      <div className="col-span-1 flex justify-end sm:justify-center">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 transition"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={addRow}
                    className="inline-flex items-center gap-2 rounded-lg border border-dashed border-teal-300 bg-teal-50/50 px-4 py-2 text-[13px] font-semibold text-teal-700 hover:bg-teal-50 transition"
                  >
                    <PlusIcon className="h-4 w-4" /> Add Row
                  </button>
                </div>
              </div>
            </SectionCard>

            {/* Order Summary */}
            <SectionCard color="teal" title="Order Summary">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between p-2">
                
                <div className="flex bg-slate-50 p-4 rounded-xl border border-slate-200 w-full md:w-auto flex-col gap-3 min-w-[280px]">
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-slate-500">Subtotal:</span>
                    <span className="font-semibold text-slate-800">PKR {subTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[13px] gap-4">
                    <span className="text-slate-500 shrink-0">Discount:</span>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0.00"
                      className="h-7 w-20 rounded border border-slate-300 px-1.5 text-[12px] text-right outline-none focus:border-teal-400"
                    />
                  </div>
                  <div className="h-px bg-slate-200 my-1 w-full" />
                  <div className="flex justify-between items-center text-[15px]">
                    <span className="font-bold text-slate-700">Payable:</span>
                    <span className="font-bold text-teal-600">PKR {payable.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex flex-col w-full md:w-auto gap-3 flex-1 md:max-w-[400px]">
                  <div className="flex items-center gap-3 bg-white border border-slate-200 p-2 rounded-xl">
                    <div className="flex-1 px-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Customer Given</p>
                      <input
                        type="number"
                        value={givenAmount}
                        onChange={(e) => setGivenAmount(e.target.value)}
                        placeholder="Amount tendered"
                        className="h-8 w-full text-base font-bold text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                  
                  {givenAmount > 0 && (
                    <div className={`p-3 rounded-lg border flex items-center justify-between ${isAllPaid ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                      <span className={`text-[13px] font-bold ${isAllPaid ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isAllPaid ? 'ALL PAID' : 'TO BE PAID'}
                      </span>
                      {isAllPaid ? (
                        <div className="flex items-center gap-2 text-emerald-600 font-bold">
                          <span>Change: PKR {(givenAmount - payable).toFixed(2)}</span>
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                      ) : (
                        <span className="font-bold text-rose-600 font-mono">PKR {remaining.toFixed(2)}</span>
                      )}
                    </div>
                  )}
                </div>

              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || payable === 0}
                  className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-teal-400 hover:bg-teal-700 transition disabled:opacity-50 disabled:shadow-none"
                >
                  <InvoiceIcon className="h-5 w-5" />
                  {submitting ? 'Saving...' : 'Save Invoice'}
                </button>
              </div>

            </SectionCard>
          </form>
        </Card>

        {/* Saved Invoices Table */}
        <Card className="mx-auto max-w-5xl">
          <SectionHeader
            title="Recent Sales"
            description="Log of recent invoices generated today."
            action={
              <button
                type="button"
                onClick={fetchSales}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
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
                    <tr className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      <th className="px-4 py-4 w-20">Inv ID</th>
                      <th className="px-4 py-4">Customer</th>
                      <th className="px-4 py-4">Mobile</th>
                      <th className="px-4 py-4 text-right">Total</th>
                      <th className="px-4 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {salesRecord.map((s, idx) => (
                      <tr key={s.id || idx} className="text-sm border-t border-slate-50 transition hover:bg-slate-50/50">
                        <td className="px-4 py-3.5 font-medium text-slate-900">#{(s.id || idx).toString().slice(-4)}</td>
                        <td className="px-4 py-3.5 text-slate-600">{s.customer_name}</td>
                        <td className="px-4 py-3.5 text-slate-600">{s.mobile}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-slate-800">PKR {Number(s.payable || 0).toFixed(2)}</td>
                        <td className="px-4 py-3.5 text-center">
                           <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            (s.given_amount >= s.payable) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                           }`}>
                             {(s.given_amount >= s.payable) ? 'PAID' : 'PENDING'}
                           </span>
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