import { useEffect, useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, Field, PageShell, SectionHeader, TableState, ActionButton, StatusChip } from '../components/layout/PageShell.jsx'
import axiosInstance from '../services/axiosInstance'
import { MdAdd, MdRemove, MdRefresh, MdInventory, MdShoppingBag, MdDeleteOutline, MdOutlineEdit } from 'react-icons/md'

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
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editId, setEditId] = useState(null)

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
      toast.error('Failed to load initial data')
    }
  }

  async function fetchPurchases() {
    setLoading(true)
    try {
      const response = await axiosInstance.get('/purchases')
      if (response?.data) {
        const data = response.data
        setPurchasesRecord(Array.isArray(data) ? data : data.data || [])
      }
    } catch {
      setPurchasesRecord([])
    } finally {
      setLoading(false)
    }
  }

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

  const isAllPaid = payable > 0 && Number(givenAmount) >= payable

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
      if (editId) {
        // await axiosInstance.put(`/purchases/${editId}`, payload)
        // toast.success('Purchase updated successfully!')
      } else {
        await axiosInstance.post('/purchases', payload)
        toast.success('Purchase Order saved successfully!')
      }
      
      resetForm()
      setIsFormOpen(false)
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
    setEditId(rec.id)
    setGrnNo(rec.grn_no)
    setGrnDate(rec.grn_date)
    setSupplierId(rec.supplier_id)
    setInvoiceNo(rec.invoice_no || '')
    
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
    } else {
      setPurchaseItems([createEmptyRow()])
    }
    setIsFormOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditId(null)
    setGrnNo(generateGRN())
    setSupplierId('')
    setInvoiceNo('')
    setPurchaseItems([createEmptyRow()])
    setDiscountPercent('')
    setDiscountAmount('')
    setGivenAmount('')
  }

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between">
           <div>
            <h1 className="text-xl font-bold text-slate-900">Purchase Entry</h1>
            <p className="text-sm text-slate-500">Record stock intake and supplier invoices.</p>
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
                <MdAdd className="h-5 w-5" /> New Purchase
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
                  title={editId ? 'View/Modify Purchase' : 'New Goods Receipt Note'}
                  description="Record inventory arrival into the system."
                  icon={<MdInventory className="h-6 w-6 text-teal-600" />}
                />

                <form onSubmit={handleSubmit} className="space-y-3 mt-2">
                  <SectionCard title="Receipt Details">
                    <div className="flex flex-wrap gap-4 items-end py-1">
                      <Field label="GRN No">
                        <input
                          type="text"
                          value={grnNo}
                          readOnly
                          className="h-8 w-40 rounded-md border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-mono font-bold text-slate-500"
                        />
                      </Field>
                      <Field label="GRN Date" required>
                        <input
                          type="date"
                          value={grnDate}
                          onChange={(e) => setGrnDate(e.target.value)}
                          className="h-8 w-36 rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                        />
                      </Field>
                      <Field label="Supplier" required>
                        <select
                          value={supplierId}
                          onChange={(e) => setSupplierId(e.target.value)}
                          className="h-8 w-60 rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
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
                          placeholder="e.g. INV-100"
                          className="h-8 w-40 rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                        />
                      </Field>
                    </div>
                  </SectionCard>

                  <SectionCard title="Inventory Items">
                    <div className="space-y-2 mt-1">
                      <div className="hidden grid-cols-[160px_1fr_100px_100px_80px_120px_50px] gap-3 px-2 sm:grid">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item Detail</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Purchase (Unit)</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Sale (Unit)</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Quantity</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Subtotal</div>
                        <div></div>
                      </div>

                      {purchaseItems.map((row) => {
                        const availableItems = items.filter(i => String(i.item_category_id) === String(row.category_id))
                        return (
                          <div key={row.id} className="grid grid-cols-2 gap-2 sm:grid-cols-[160px_1fr_100px_100px_80px_120px_50px] items-center bg-slate-50/50 p-2 sm:p-0 sm:bg-transparent rounded-xl border border-slate-200 sm:border-0">
                            <div className="col-span-2 sm:col-span-1">
                              <select
                                value={row.category_id}
                                onChange={(e) => updateRow(row.id, 'category_id', e.target.value)}
                                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] outline-none focus:border-teal-400"
                              >
                                <option value="">Category</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                              </select>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                              <select
                                value={row.item_id}
                                onChange={(e) => updateRow(row.id, 'item_id', e.target.value)}
                                disabled={!row.category_id}
                                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] outline-none focus:border-teal-400 disabled:bg-slate-50"
                              >
                                <option value="">Select Item</option>
                                {availableItems.map(i => <option key={i.id} value={i.id}>{i.item_name}</option>)}
                              </select>
                            </div>
                            <div className="col-span-1">
                               <input type="number" step="0.01" value={row.purchase_price} onChange={(e) => updateRow(row.id, 'purchase_price', e.target.value)} className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] text-right focus:border-teal-400 placeholder:text-slate-300" placeholder="0.00" />
                            </div>
                            <div className="col-span-1">
                               <input type="number" step="0.01" value={row.sale_price} onChange={(e) => updateRow(row.id, 'sale_price', e.target.value)} className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] text-right focus:border-teal-400 placeholder:text-slate-300" placeholder="0.00" />
                            </div>
                            <div className="col-span-1">
                               <input type="number" min="1" value={row.quantity} onChange={(e) => updateRow(row.id, 'quantity', e.target.value)} className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] text-center focus:border-teal-400" />
                            </div>
                            <div className="col-span-1 flex items-center justify-end font-bold text-slate-700 text-[12px]">
                               PKR {Number(row.total || 0).toLocaleString()}
                            </div>
                            <div className="col-span-1 flex justify-center">
                              <button type="button" onClick={() => removeRow(row.id)} className="text-rose-500 hover:text-rose-700 transition"><MdDeleteOutline className="h-5 w-5"/></button>
                            </div>
                          </div>
                        )
                      })}

                      <div className="pt-2 flex gap-3">
                         <button type="button" onClick={addRow} className="inline-flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-2 text-[12px] font-bold text-teal-700 border border-teal-200 hover:bg-teal-100 transition"><MdAdd className="h-4 w-4" /> Add Line Item</button>
                         <button type="button" onClick={clearAllRows} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-[12px] font-bold text-slate-500 border border-slate-200 hover:bg-slate-50 transition">Clear All</button>
                      </div>
                    </div>
                  </SectionCard>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <SectionCard title="Summary & Financials">
                      <div className="space-y-3 py-1">
                        <div className="flex justify-between items-center text-sm">
                           <span className="text-slate-500">Gross Total</span>
                           <span className="font-bold text-slate-800">PKR {subTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="text-slate-500 text-sm flex-1">Discount</span>
                           <div className="flex items-center gap-2">
                             <input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} placeholder="%" className="h-7 w-16 rounded border border-slate-300 text-center text-[12px] focus:border-teal-400" />
                             <span className="text-slate-400 text-xs">Or</span>
                             <input type="number" value={discountAmount} onChange={(e) => { setDiscountAmount(e.target.value); setDiscountPercent('') }} placeholder="Amount" className="h-7 w-28 rounded border border-slate-300 text-right px-2 text-[12px] focus:border-teal-400" />
                           </div>
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                           <span className="font-bold text-slate-700 text-sm">Net Payable</span>
                           <span className="text-xl font-black text-teal-600 font-mono">PKR {payable.toLocaleString()}</span>
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard title="Payment Status">
                       <div className="space-y-4 py-1">
                         <div className="space-y-1.5">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount Paid to Supplier</p>
                           <input type="number" value={givenAmount} onChange={(e) => setGivenAmount(e.target.value)} className="h-10 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 text-lg font-black text-slate-800 focus:border-teal-500 focus:bg-white transition outline-none" placeholder="0.00" />
                         </div>
                         {payable > 0 && (
                            <div className={`p-3 rounded-xl border-2 flex items-center justify-between ${isAllPaid ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                               <span className={`text-[11px] font-black uppercase tracking-widest ${isAllPaid ? 'text-emerald-700' : 'text-rose-700'}`}>
                                 {isAllPaid ? 'FULLY SETTLED' : 'OUTSTANDING'}
                               </span>
                               <span className={`font-mono font-bold text-sm ${isAllPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                                 PKR {isAllPaid ? (givenAmount - payable).toLocaleString() : remaining.toLocaleString()}
                               </span>
                            </div>
                         )}
                       </div>
                    </SectionCard>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => { resetForm(); setIsFormOpen(false) }} className="rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 transition">Cancel</button>
                    <button type="submit" disabled={submitting || payable <= 0} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition disabled:opacity-50">
                       <ArchiveBoxIcon className="h-5 w-5" /> {submitting ? 'Saving...' : 'Confirm & Save Purchase'}
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Purchases Table */}
        <Card className="mx-auto max-w-5xl p-0 overflow-hidden">
          <SectionHeader
            title="Recent Purchases"
            description="Log of recent stock arrivals and supplier GRNs."
            icon={<MdShoppingBag className="h-6 w-6 text-teal-600" />}
            action={
              <div className="p-4">
                <button
                  type="button"
                  onClick={fetchPurchases}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Refresh List
                </button>
              </div>
            }
          />

          {loading ? (
            <TableState message="Loading purchase records..." />
          ) : purchasesRecord.length === 0 ? (
            <TableState message="No purchase records found." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">GRN & Date</th>
                    <th className="px-5 py-4">Supplier / Invoice</th>
                    <th className="px-5 py-4 text-right">Payable</th>
                    <th className="px-5 py-4 text-right">Paid</th>
                    <th className="px-5 py-4 text-center">Settlement</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {purchasesRecord.map((s) => (
                    <motion.tr 
                      key={s.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group transition-colors hover:bg-teal-50/30"
                    >
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                           <span className="font-mono text-[11px] font-bold text-slate-700">{s.grn_no}</span>
                           <span className="text-[10px] text-slate-400 font-semibold">{s.grn_date}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-[12px]">
                            {suppliers.find(su => String(su.id) === String(s.supplier_id))?.supplier_name || 'Unknown'}
                          </span>
                          <span className="text-[10px] text-teal-600 font-bold uppercase tracking-tighter">{s.invoice_no || 'NO INVOICE'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                         <span className="text-[12px] font-bold text-slate-700">PKR {Number(s.payable || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                         <span className="text-[12px] font-bold text-emerald-600">PKR {Number(s.paid_amount || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                          <StatusChip enabled={s.paid_amount >= s.payable} labels={{ on: 'PAID', off: 'PENDING' }} />
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
