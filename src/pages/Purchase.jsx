import { useEffect, useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, Field, PageShell, SectionHeader, TableState, ActionButton, StatusChip } from '../components/layout/PageShell.jsx'
import axiosInstance from '../services/axiosInstance'
import { MdAdd, MdRemove, MdRefresh, MdInventory, MdShoppingBag } from 'react-icons/md'

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
      if (supRes?.data) setSuppliers(Array.isArray(supRes.data) ? supRes.data : supRes.data.data || [])
      if (catRes?.data) setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data.data || [])
      if (itmRes?.data) setItems(Array.isArray(itmRes.data) ? itmRes.data : itmRes.data.data || [])
    } catch (e) {
      toast.error('Failed to load initial data')
    }
  }

  async function fetchPurchases() {
    setLoading(true)
    try {
      const response = await axiosInstance.get('/purchases')
      if (response?.data) setPurchasesRecord(Array.isArray(response.data) ? response.data : response.data.data || [])
    } catch {
      setPurchasesRecord([])
    } finally {
      setLoading(false)
    }
  }

  const subTotal = useMemo(() =>
    purchaseItems.reduce((sum, row) => sum + (Number(row.total) || 0), 0),
    [purchaseItems]
  )

  useEffect(() => {
    if (discountPercent !== '' && Number(discountPercent) >= 0) {
      const calcAmt = (subTotal * (Number(discountPercent) / 100)).toFixed(2)
      setDiscountAmount(calcAmt)
    }
  }, [discountPercent, subTotal])

  const payable = useMemo(() =>
    Math.max(0, subTotal - (Number(discountAmount) || 0)),
    [subTotal, discountAmount]
  )
  const remaining = useMemo(() =>
    Math.max(0, payable - (Number(givenAmount) || 0)),
    [payable, givenAmount]
  )

  const addRow = () => setPurchaseItems([...purchaseItems, createEmptyRow()])
  const removeRow = (id) => {
    if (purchaseItems.length > 1) setPurchaseItems(purchaseItems.filter(r => r.id !== id))
  }

  const updateRow = (id, field, value) => {
    setPurchaseItems(prev => prev.map(row => {
      if (row.id === id) {
        const newRow = { ...row, [field]: value }
        if (field === 'item_id' && value) {
          const found = items.find(i => String(i.id) === String(value))
          if (found) {
            newRow.purchase_price = found.purchase_price || found.cost || 0
            newRow.sale_price = found.sale_price || 0
          }
        }
        if (field === 'category_id') { newRow.item_id = ''; newRow.purchase_price = ''; newRow.sale_price = '' }
        newRow.total = (Number(newRow.purchase_price) || 0) * (Number(newRow.quantity) || 0)
        return newRow
      }
      return row
    }))
  }

  const resetForm = () => {
    setEditId(null)
    setGrnNo(generateGRN())
    setGrnDate(new Date().toISOString().slice(0, 10))
    setSupplierId('')
    setInvoiceNo('')
    setPurchaseItems([createEmptyRow()])
    setDiscountPercent('')
    setDiscountAmount('')
    setGivenAmount('')
  }

  const handleEdit = (rec) => {
    setEditId(rec.id)
    setGrnNo(rec.grn_no || '')
    setGrnDate(rec.grn_date || '')
    setSupplierId(rec.supplier_id || '')
    setInvoiceNo(rec.invoice_no || '')
    setDiscountAmount(rec.discount_amount || rec.discount || '')
    setGivenAmount(rec.paid_amount || rec.paid || '')

    if (rec.items && rec.items.length > 0) {
      setPurchaseItems(rec.items.map(i => ({
        id: Date.now() + Math.random(),
        category_id: i.category_id || '',
        item_id: i.item_id || '',
        purchase_price: i.purchase_price || 0,
        sale_price: i.sale_price || 0,
        quantity: i.quantity || i.qty || 1,
        total: (i.purchase_price || 0) * (i.quantity || i.qty || 1)
      })))
    } else {
      setPurchaseItems([createEmptyRow()])
    }
    setIsFormOpen(true)
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase record?')) return
    try {
      await axiosInstance.delete(`/purchases/${id}`)
      toast.success('Purchase record deleted')
      if (editId === id) resetForm()
      fetchPurchases()
    } catch {
      toast.error('Failed to delete purchase record.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!supplierId || !grnNo) { toast.error('Supplier & GRN No required.'); return }
    const validItems = purchaseItems.filter(r => r.item_id && r.quantity > 0)
    if (validItems.length === 0) { toast.error('Add at least one item.'); return }

    setSubmitting(true)
    const payload = {
      supplier_id: supplierId,
      grn_no: grnNo,
      grn_date: grnDate,
      invoice_no: invoiceNo,
      items: validItems.map(i => ({
        item_id: i.item_id,
        quantity: i.quantity,
        purchase_price: i.purchase_price,
        sale_price: i.sale_price,
      })),
      sub_total: subTotal,
      discount_amount: Number(discountAmount) || 0,
      payable: payable,
      paid_amount: Number(givenAmount) || 0,
    }

    try {
      if (editId) {
        await axiosInstance.put(`/purchases/${editId}`, payload)
        toast.success('Purchase updated successfully!')
      } else {
        await axiosInstance.post('/purchases', payload)
        toast.success('Purchase saved successfully!')
      }
      resetForm()
      setIsFormOpen(false)
      fetchPurchases()
    } catch {
      toast.error('Failed to save purchase.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
           <div>
            <h1 className="text-xl font-bold text-slate-900">Inventory Acquisitions</h1>
            <p className="text-sm text-slate-500">Log Goods Receipt Notes (GRN) and restock inventory.</p>
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
                <MdAdd className="h-5 w-5" /> New Acquisition
              </>
            )}
          </button>
        </div>

        {/* Form */}
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
                <SectionHeader title={editId ? 'View/Edit Acquisition' : 'Create New GRN'} description="Log supplier shipments and update warehouse stock." icon={<MdInventory className="h-6 w-6 text-teal-600" />} />

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                     <SectionCard title="Vendor & Receipt Info">
                        <div className="flex flex-wrap gap-4 py-1">
                           <Field label="Supplier / Vendor" required className="flex-1 min-w-[200px]">
                              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none">
                                 <option value="">Select Supplier...</option>
                                 {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplier_name}</option>)}
                              </select>
                           </Field>
                           <Field label="Supplier Invoice #" className="flex-1 min-w-[200px]">
                              <input type="text" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="Invoice Identifier" className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none" />
                           </Field>
                        </div>
                     </SectionCard>
                     <SectionCard title="GRN Metadata">
                        <div className="flex gap-4 py-1">
                           <Field label="GRN Code" className="flex-1">
                              <input type="text" value={grnNo} readOnly className="h-8 w-full rounded-md border border-slate-100 bg-slate-50 px-2.5 text-[12px] font-mono font-bold text-slate-500" />
                           </Field>
                           <Field label="Processing Date" className="flex-1">
                              <input type="date" value={grnDate} onChange={(e) => setGrnDate(e.target.value)} className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none" />
                           </Field>
                        </div>
                     </SectionCard>
                  </div>

                  <SectionCard title="Items Received">
                     <div className="space-y-2">
                        <div className="hidden grid-cols-[140px_1fr_90px_90px_80px_100px_40px] gap-2 px-2 sm:grid uppercase tracking-widest text-[9px] font-bold text-slate-400">
                           <div>Category</div><div>Product</div><div>Cost</div><div>Sales P.</div><div className="text-center">Qty</div><div className="text-right">Total</div><div></div>
                        </div>
                        {purchaseItems.map(row => {
                           const availableItems = items.filter(i => String(i.item_category_id) === String(row.category_id))
                           return (
                             <div key={row.id} className="grid grid-cols-2 gap-2 sm:grid-cols-[140px_1fr_90px_90px_80px_100px_40px] items-center bg-slate-50/50 p-2 sm:p-0 sm:bg-transparent rounded-xl border border-slate-200 sm:border-0">
                                <select value={row.category_id} onChange={(e) => updateRow(row.id, 'category_id', e.target.value)} className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px]"><option value="">Category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}</select>
                                <select value={row.item_id} onChange={(e) => updateRow(row.id, 'item_id', e.target.value)} disabled={!row.category_id} className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] disabled:bg-slate-100"><option value="">Select Item</option>{availableItems.map(i => <option key={i.id} value={i.id}>{i.item_name}</option>)}</select>
                                <input type="number" step="0.01" value={row.purchase_price} onChange={(e) => updateRow(row.id, 'purchase_price', e.target.value)} placeholder="Cost" className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] text-right" />
                                <input type="number" step="0.01" value={row.sale_price} onChange={(e) => updateRow(row.id, 'sale_price', e.target.value)} placeholder="Sale" className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] text-right" />
                                <input type="number" min="1" value={row.quantity} onChange={(e) => updateRow(row.id, 'quantity', e.target.value)} className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-center text-[11px] font-bold" />
                                <div className="text-right font-black text-slate-800 text-[11px]">PKR {(Number(row.total) || 0).toLocaleString()}</div>
                                <button type="button" onClick={() => removeRow(row.id)} className="text-rose-400 hover:text-rose-600 transition-colors flex justify-center" title="Remove Item">
                                   <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                     <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                   </svg>
                                </button>
                             </div>
                           )
                        })}
                        <div className="pt-2"><button type="button" onClick={addRow} className="inline-flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-2 text-[12px] font-bold text-teal-700 border border-teal-200 hover:bg-teal-100 transition"><MdAdd className="h-4 w-4" /> Add Item Line</button></div>
                     </div>
                  </SectionCard>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                     <SectionCard title="Payment Terms">
                        <div className="space-y-3 py-1 text-sm">
                           <div className="flex justify-between items-center text-slate-500"><span>Sub-Total Gross</span><span className="font-bold text-slate-800">PKR {subTotal.toLocaleString()}</span></div>
                           <div className="flex items-center gap-3"><span className="text-slate-500 flex-1">Custom Discount</span><input type="number" step="0.01" value={discountAmount} onChange={(e) => { setDiscountAmount(e.target.value); setDiscountPercent('') }} placeholder="0.00" className="h-8 w-32 rounded border border-slate-300 text-right px-2 text-[12px] focus:border-teal-400" /></div>
                           <div className="pt-2 border-t border-slate-200 flex justify-between items-center"><span className="font-bold text-slate-700">NET PAYABLE</span><span className="text-xl font-black text-teal-600 font-mono">PKR {payable.toLocaleString()}</span></div>
                        </div>
                     </SectionCard>
                     <SectionCard title="Cash Settlement">
                        <div className="space-y-4 py-1">
                           <div className="space-y-1"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Amount Settled Now</p><input type="number" value={givenAmount} onChange={(e) => setGivenAmount(e.target.value)} placeholder="0.00" className="h-10 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 text-lg font-black text-emerald-700 outline-none focus:border-emerald-500 focus:bg-white transition" /></div>
                           {payable > 0 && givenAmount > 0 && (
                            <div className={`p-3 rounded-xl border-2 flex items-center justify-between ${Number(givenAmount) >= payable ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                               <span className={`text-[11px] font-black uppercase tracking-widest ${Number(givenAmount) >= payable ? 'text-emerald-700' : 'text-rose-700'}`}>{Number(givenAmount) >= payable ? 'CLEAR' : 'REMAINING DUE'}</span>
                               <span className={`font-mono font-black text-lg ${Number(givenAmount) >= payable ? 'text-emerald-600' : 'text-rose-600'}`}>PKR {Math.abs(Number(givenAmount) - payable).toLocaleString()}</span>
                            </div>
                           )}
                        </div>
                     </SectionCard>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => { resetForm(); setIsFormOpen(false) }} className="rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 transition">Discard</button>
                    <button type="submit" disabled={submitting || payable <= 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-10 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition disabled:opacity-50">
                       <MdShoppingBag className="h-5 w-5" /> {submitting ? 'Authenticating...' : editId ? 'Update GRN' : 'Finalize GRN'}
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        <Card className="mx-auto max-w-6xl p-0 overflow-hidden">
          <SectionHeader title="GRN Registry & History" description="Official record of inventory receipts and vendor invoices." icon={<MdInventory className="h-6 w-6 text-teal-600" />} action={<div className="p-4"><button type="button" onClick={fetchPurchases} className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50">Refresh Log</button></div>} />
          {loading ? <TableState message="Syncing records..." /> : purchasesRecord.length === 0 ? <TableState message="No registration found." /> : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">GRN & Date</th><th className="px-5 py-4">Supplier / Invoice</th><th className="px-5 py-4 text-right">Payable</th><th className="px-5 py-4 text-right">Settled</th><th className="px-5 py-4 text-center">Status</th><th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {purchasesRecord.map((s) => {
                     const statusPayload = s.paid_amount >= s.payable 
                      ? { label: 'PAID', tone: 'emerald' } 
                      : (s.paid_amount > 0 ? { label: 'PARTIAL', tone: 'amber' } : { label: 'DUE', tone: 'rose' })
                     return (
                      <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`group transition-colors hover:bg-teal-50/20 ${editId === s.id ? 'bg-teal-50/50' : ''}`}>
                        <td className="px-5 py-4"><div className="flex flex-col"><span className="font-mono text-[11px] font-bold text-slate-700 uppercase tracking-tighter">{s.grn_no}</span><span className="text-[10px] text-slate-400 font-semibold">{s.grn_date}</span></div></td>
                        <td className="px-5 py-4"><div className="flex flex-col"><span className="font-bold text-slate-800 text-[12px]">{suppliers.find(su => String(su.id) === String(s.supplier_id))?.supplier_name || 'Vendor'}</span><span className="text-[10px] text-teal-600 font-bold uppercase tracking-tighter">{s.invoice_no || 'NO EXTERNAL ID'}</span></div></td>
                        <td className="px-5 py-4 text-right"><span className="text-[12px] font-bold text-slate-700">PKR {Number(s.payable || 0).toLocaleString()}</span></td>
                        <td className="px-5 py-4 text-right"><span className="text-[12px] font-bold text-emerald-600">PKR {Number(s.paid_amount || 0).toLocaleString()}</span></td>
                        <td className="px-5 py-4 text-center"><StatusChip label={statusPayload.label} tone={statusPayload.tone} /></td>
                        <td className="px-5 py-4 text-right"><div className="flex justify-end gap-2"><ActionButton label="Edit" tone="teal" onClick={() => handleEdit(s)} /><ActionButton label="Delete" tone="rose" onClick={() => handleDelete(s.id)} /></div></td>
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
