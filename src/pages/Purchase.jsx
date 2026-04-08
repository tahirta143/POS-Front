import { useEffect, useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import { Card, Field, PageShell, SectionHeader, TableState, ActionButton, StatusChip } from '../components/layout/PageShell.jsx'
import axiosInstance from '../services/axiosInstance'

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

function ArchiveBoxIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
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

function generateGRN() {
  const d = new Date()
  const yyyymmdd = d.toISOString().slice(0,10).replace(/-/g, '')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `GRN-${yyyymmdd}-${rand}`
}

function createEmptyRow() {
  return { id: Date.now() + Math.random(), category_id: '', item_id: '', purchase_price: '', sale_price: '', quantity: 1, total: 0 }
}

export default function PurchasePage() {
  const [suppliers, setSuppliers] = useState([])
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [purchasesRecord, setPurchasesRecord] = useState([])
  
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [grnNo, setGrnNo] = useState(generateGRN())
  const [grnDate, setGrnDate] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [purchaseItems, setPurchaseItems] = useState([createEmptyRow()])
  
  // Payment State
  const [discountPercent, setDiscountPercent] = useState('')
  const [discountAmount, setDiscountAmount] = useState('')
  const [givenAmount, setGivenAmount] = useState('')

  useEffect(() => {
    fetchInitialData()
    fetchPurchases()
    setGrnDate(new Date().toISOString().slice(0, 10))
  }, [])

  async function fetchInitialData() {
    try {
      const [supRes, catRes, itmRes] = await Promise.all([
        axiosInstance.get('/suppliers').catch(() => null),
        axiosInstance.get('/categories').catch(() => null),
        axiosInstance.get('/item-details').catch(() => null)
      ])
      if (supRes?.data) {
        const d = supRes.data
        setSuppliers(Array.isArray(d) ? d : d.data || [])
      }
      if (catRes?.data) {
        const d = catRes.data
        setCategories(Array.isArray(d) ? d : d.data || [])
      }
      if (itmRes?.data) {
        const d = itmRes.data
        setItems(Array.isArray(d) ? d : d.data || [])
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to load initial data')
    }
  }

  async function fetchPurchases() {
    try {
      const response = await axiosInstance.get('/purchases')
      if (response?.data) {
        const data = response.data
        setPurchasesRecord(Array.isArray(data) ? data : data.data || [])
      }
    } catch {
      // ignore
    }
  }

  // --- Calculations ---
  const subTotal = useMemo(() => {
    return purchaseItems.reduce((sum, row) => sum + (Number(row.total) || 0), 0)
  }, [purchaseItems])

  useEffect(() => {
    if (discountPercent !== '' && Number(discountPercent) >= 0) {
      const calcAmt = (subTotal * (Number(discountPercent) / 100)).toFixed(2)
      setDiscountAmount(calcAmt)
    }
  }, [discountPercent, subTotal])

  const payable = useMemo(() => {
    const disc = Number(discountAmount) || 0
    return Math.max(0, subTotal - disc)
  }, [subTotal, discountAmount])

  const remaining = useMemo(() => {
    const given = Number(givenAmount) || 0
    return Math.max(0, payable - given)
  }, [payable, givenAmount])

  const isAllPaid = payable > 0 && givenAmount >= payable

  // --- Handlers ---
  const addRow = () => setPurchaseItems([...purchaseItems, createEmptyRow()])
  
  const removeRow = (id) => {
    if (purchaseItems.length > 1) setPurchaseItems(purchaseItems.filter(r => r.id !== id))
  }

  const clearAllRows = () => {
    setPurchaseItems([createEmptyRow()])
  }

  const updateRow = (id, field, value) => {
    setPurchaseItems(prev => prev.map(row => {
      if (row.id === id) {
        const newRow = { ...row, [field]: value }
        
        if (field === 'item_id' && value) {
          const selectedItem = items.find(i => String(i.id) === String(value))
          if (selectedItem) {
            newRow.purchase_price = selectedItem.purchase_price || 0
            newRow.sale_price = selectedItem.sale_price || 0
          }
        }
        
        if (field === 'category_id') {
          newRow.item_id = ''
          newRow.purchase_price = ''
          newRow.sale_price = ''
        }

        const p = Number(newRow.purchase_price) || 0
        const q = Number(newRow.quantity) || 0
        newRow.total = p * q
        return newRow
      }
      return row
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!supplierId) {
      toast.error('Supplier selection is required.')
      return
    }
    
    const validItems = purchaseItems.filter(r => r.item_id && r.quantity > 0)
    if (validItems.length === 0) {
      toast.error('Add at least one item.')
      return
    }

    setSubmitting(true)

    const payload = {
      grn_no: grnNo,
      grn_date: grnDate,
      supplier_id: supplierId,
      invoice_number: invoiceNo,
      sub_total: subTotal,
      discount_percent: Number(discountPercent) || 0,
      discount_amount: Number(discountAmount) || 0,
      payable: payable,
      paid_amount: Number(givenAmount) || 0,
      items: validItems.map(r => ({
        item_id: r.item_id,
        purchase_price: r.purchase_price,
        sale_price: r.sale_price,
        quantity: r.quantity,
        total: r.total
      }))
    }

    try {
      await axiosInstance.post('/purchases', payload)
      
      toast.success('Purchase Order saved successfully!')
      setGrnNo(generateGRN())
      setSupplierId('')
      setInvoiceNo('')
      setPurchaseItems([createEmptyRow()])
      setDiscountPercent('')
      setDiscountAmount('')
      setGivenAmount('')
      fetchPurchases()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save purchase.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase record?')) return
    try {
      await axiosInstance.delete(`/purchases/${id}`)
      toast.success('Purchase deleted successfully')
      fetchPurchases()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete purchase')
    }
  }

  const handleEdit = (rec) => {
    // Basic skeleton: populate main fields
    setGrnNo(rec.grn_no)
    setGrnDate(rec.grn_date)
    setSupplierId(rec.supplier_id)
    setInvoiceNo(rec.invoice_no || '')
    
    // If items are included in the record, map them
    if (rec.items && rec.items.length > 0) {
      setPurchaseItems(rec.items.map(item => ({
        id: Math.random(),
        category_id: item.category_id || '',
        item_id: item.item_id,
        purchase_price: item.purchase_price,
        sale_price: item.sale_price,
        quantity: item.quantity,
        total: item.total
      })))
    }
    toast.info('Edit mode enabled for: ' + rec.grn_no)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <PageShell
      title="Purchase Entry"
      description="Record stock intake and supplier invoices."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-4">
        <Card className="mx-auto max-w-5xl border-l-[6px] border-l-teal-500 p-3">
          <SectionHeader
            title="New Purchase Entry"
            description="Log Goods Received Note (GRN) into inventory."
            icon={<ArchiveBoxIcon className="h-5 w-5" />}
          />

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Purchase Details Section */}
            <SectionCard title="Receipt Details">
              <div className="flex flex-wrap gap-3 items-end">
                <Field label="GRN No">
                  <input
                    type="text"
                    value={grnNo}
                    readOnly
                    className="h-7 w-40 rounded-md border border-slate-300 bg-slate-50 px-2 text-[11px] font-mono outline-none text-slate-500"
                  />
                </Field>
                <Field label="GRN Date" required>
                  <input
                    type="date"
                    value={grnDate}
                    onChange={(e) => setGrnDate(e.target.value)}
                    className="h-7 w-32 rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </Field>
                <Field label="Supplier" required>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="h-7 w-56 rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.supplier_name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Invoice Number">
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    placeholder="Enter Invoice #"
                    className="h-7 w-40 rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </Field>
              </div>
            </SectionCard>

            {/* Items Section */}
            <SectionCard title="Invoice Items">
              <div className="space-y-2">
                <div className="hidden grid-cols-[140px_1fr_80px_80px_60px_90px_40px] gap-2 px-1 sm:grid">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Category</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Item Name</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Purch.</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Sale</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Qty</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Total</div>
                  <div></div>
                </div>

                {purchaseItems.map((row) => {
                  const availableItemsForCat = items.filter(i => String(i.item_category_id) === String(row.category_id))
                  return (
                    <div key={row.id} className="grid grid-cols-2 gap-2 sm:grid-cols-[140px_1fr_80px_80px_60px_90px_40px] items-center bg-slate-50 p-1.5 sm:bg-transparent rounded-lg border sm:border-0 border-slate-200">
                      <div className="col-span-2 sm:col-span-1">
                        <select
                          value={row.category_id}
                          onChange={(e) => updateRow(row.id, 'category_id', e.target.value)}
                          className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400"
                        >
                          <option value="">Category</option>
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
                          className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 disabled:bg-slate-100"
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
                          value={row.purchase_price}
                          onChange={(e) => updateRow(row.id, 'purchase_price', e.target.value)}
                          placeholder="Price"
                          className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400"
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <input
                          type="number"
                          value={row.sale_price}
                          onChange={(e) => updateRow(row.id, 'sale_price', e.target.value)}
                          placeholder="Sale"
                          className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400"
                        />
                      </div>

                      <div className="col-span-1">
                         <input
                          type="number"
                          min="1"
                          value={row.quantity}
                          onChange={(e) => updateRow(row.id, 'quantity', e.target.value)}
                          placeholder="Qty"
                          className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400"
                        />
                      </div>

                      <div className="col-span-1 bg-white border border-slate-200 h-7 flex items-center px-2 rounded-md font-medium text-slate-700 text-[11px]">
                        PKR {Number(row.total || 0).toFixed(2)}
                      </div>

                      <div className="col-span-1 flex justify-end sm:justify-center">
                        <ActionButton
                          label="Delete"
                          tone="rose"
                          onClick={() => removeRow(row.id)}
                        />
                      </div>
                    </div>
                  )
                })}

                <div className="pt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={addRow}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-teal-300 bg-teal-50 px-3 py-1.5 text-[11px] font-semibold text-teal-700 hover:bg-teal-100 transition"
                  >
                    <PlusIcon className="h-3.5 w-3.5" /> Add Item
                  </button>
                  <button
                    type="button"
                    onClick={clearAllRows}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </SectionCard>

            {/* Order Summary */}
            <SectionCard title="Order Summary">
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between p-1.5">
                
                <div className="flex bg-slate-50 p-3 rounded-xl border border-slate-200 w-full md:w-auto flex-col gap-2 min-w-[280px]">
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-slate-500">Subtotal:</span>
                    <span className="font-semibold text-slate-800">PKR {subTotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-[12px] gap-2">
                    <span className="text-slate-500">Discount:</span>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="number"
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(e.target.value)}
                          placeholder="%"
                          className="h-6 w-14 rounded border border-slate-300 px-1.5 text-[11px] outline-none focus:border-teal-400 text-center"
                        />
                        <span className="absolute top-1/2 right-1.5 -translate-y-1/2 text-[9px] text-slate-400">%</span>
                      </div>
                      <span className="text-slate-300">-</span>
                      <div className="relative">
                        <span className="absolute top-1/2 left-1.5 -translate-y-1/2 text-[9px] text-slate-400">PKR</span>
                        <input
                          type="number"
                          value={discountAmount}
                          onChange={(e) => {
                            setDiscountAmount(e.target.value)
                            setDiscountPercent('')
                          }}
                          placeholder="Amount"
                          className="h-6 w-24 rounded border border-slate-300 pl-7 pr-1.5 text-[11px] text-right outline-none focus:border-teal-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-200 my-0.5 w-full" />
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="font-bold text-slate-700">Payable:</span>
                    <span className="font-bold text-teal-600">PKR {payable.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex flex-col w-full md:w-auto gap-2 flex-1 md:max-w-[350px]">
                  <div className="flex rounded-xl border border-slate-200 bg-white p-2">
                    <div className="flex-1 px-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Company Paid</p>
                      <input
                        type="number"
                        value={givenAmount}
                        onChange={(e) => setGivenAmount(e.target.value)}
                        placeholder="Amount Tendered"
                        className="h-7 w-full text-[12px] font-bold text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                  
                  {givenAmount > 0 && (
                    <div className={`p-2 rounded-lg border flex items-center justify-between ${isAllPaid ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                      <span className={`text-[11px] font-bold ${isAllPaid ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isAllPaid ? 'ALL PAID' : 'TO BE PAID'}
                      </span>
                      {isAllPaid ? (
                        <div className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                          <span>Change: PKR {(givenAmount - payable).toFixed(2)}</span>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                      ) : (
                        <span className="font-bold text-rose-600 font-mono text-[11px]">PKR {remaining.toFixed(2)}</span>
                      )}
                    </div>
                  )}
                </div>

              </div>
              
              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || payable === 0}
                  className="inline-flex min-w-[150px] items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2 text-[12px] font-bold text-white shadow-lg shadow-teal-400 hover:bg-teal-700 transition disabled:opacity-50 disabled:shadow-none"
                >
                  <ArchiveBoxIcon className="h-4 w-4" />
                  {submitting ? 'Saving...' : 'Save Purchase'}
                </button>
              </div>

            </SectionCard>
          </form>
        </Card>

        {/* Saved Purchases Table */}
        <Card className="mx-auto max-w-5xl p-3">
          <SectionHeader
            title="Recent Purchases"
            description="Log of recent stock arrivals and supplier GRNs."
            action={
              <button
                type="button"
                onClick={fetchPurchases}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Refresh
              </button>
            }
          />

          {purchasesRecord.length === 0 ? (
            <TableState message="No purchase records found." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="overflow-x-auto w-full">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      <th className="px-3 py-2.5 w-28">GRN No</th>
                      <th className="px-3 py-2.5">Supplier</th>
                      <th className="px-3 py-2.5">Invoice No</th>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5 text-right total-col">Total</th>
                      <th className="px-3 py-2.5 text-center status-col">Status</th>
                      <th className="px-3 py-2.5 text-right w-24 actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {purchasesRecord.map((s, idx) => (
                      <tr key={s.id || idx} className="text-[12px] border-t border-slate-50 transition hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-medium text-slate-900 font-mono text-[10px]">{s.grn_no}</td>
                        <td className="px-3 py-2 text-slate-600 font-semibold text-[12px]">
                          {(() => {
                            const sup = suppliers.find(su => String(su.id) === String(s.supplier_id))
                            return sup ? sup.supplier_name : s.supplier_id
                          })()}
                        </td>
                        <td className="px-3 py-2 text-slate-600 text-[12px]">{s.invoice_no || '-'}</td>
                        <td className="px-3 py-2 text-slate-600 text-[12px]">{s.grn_date}</td>
                        <td className="px-3 py-2 text-right font-bold text-slate-800 text-[12px]">PKR {Number(s.payable || s.total_amount || 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-center">
                           <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            (s.paid_amount >= s.payable) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                           }`}>
                              {(s.paid_amount >= s.payable) ? 'PAID' : 'PENDING'}
                           </span>
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
