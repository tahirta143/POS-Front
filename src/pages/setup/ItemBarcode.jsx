import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, Field, PageShell, SectionHeader, TableState, ActionButton } from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance'

const sectionStyles = {
  teal: { accent: 'bg-teal-500', header: 'border-teal-100 bg-teal-50/80' },
}

function SectionCard({ color = 'teal', title, children }) {
  const style = sectionStyles[color]
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

function RefreshIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

function BarcodeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M3 8h18M3 12h18M3 16h18M3 20h18" />
    </svg>
  )
}

export default function ItemBarcodePage() {
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [barcodes, setBarcodes] = useState([])
  const [editId, setEditId] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  
  const [categories, setCategories] = useState([])
  const [manufacturers, setManufacturers] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [items, setItems] = useState([])
  const [units, setUnits] = useState([])

  const [form, setForm] = useState({
    code: '',
    category_id: '',
    manufacturer_id: '',
    supplier_id: '',
    item_id: '',
    unit_id: '',
    stock: '',
    reorder_level: '',
    sale_price: '',
  })

  useEffect(() => {
    fetchDropdownData()
    fetchBarcodes()
  }, [])

  async function fetchDropdownData() {
    setLoading(true)
    try {
      const [catRes, mfgRes, supRes, itmRes, unitRes] = await Promise.all([
        axiosInstance.get('/categories').catch(() => null),
        axiosInstance.get('/manufacturers').catch(() => null),
        axiosInstance.get('/suppliers').catch(() => null),
        axiosInstance.get('/item-details').catch(() => null),
        axiosInstance.get('/item-units').catch(() => null),
      ])

      if (catRes?.data) {
        const data = Array.isArray(catRes.data) ? catRes.data : catRes.data.data || []
        setCategories(data)
      }
      if (mfgRes?.data) {
        const data = Array.isArray(mfgRes.data) ? mfgRes.data : mfgRes.data.data || []
        setManufacturers(data)
      }
      if (supRes?.data) {
        const data = Array.isArray(supRes.data) ? supRes.data : supRes.data.data || []
        setSuppliers(data)
      }
      if (itmRes?.data) {
        const data = Array.isArray(itmRes.data) ? itmRes.data : itmRes.data.data || []
        setItems(data)
      }
      if (unitRes?.data) {
        const data = Array.isArray(unitRes.data) ? unitRes.data : unitRes.data.data || []
        setUnits(data)
      }
    } catch {
      toast.error('Failed to load dropdown data')
    } finally {
      setLoading(false)
    }
  }

  async function fetchBarcodes() {
    try {
      const res = await axiosInstance.get('/item-barcodes').catch(() => null)
      if (res?.data) {
        const data = Array.isArray(res.data) ? res.data : res.data.data || []
        setBarcodes(data)
      }
    } catch {
      setBarcodes([])
    }
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function resetForm() {
    setEditId(null)
    setForm({
      code: '',
      category_id: '',
      manufacturer_id: '',
      supplier_id: '',
      item_id: '',
      unit_id: '',
      stock: '',
      reorder_level: '',
      sale_price: '',
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.code.trim()) {
      toast.error('Barcode Code is required.')
      return
    }
    if (!form.category_id) {
      toast.error('Category is required.')
      return
    }
    if (!form.manufacturer_id) {
      toast.error('Manufacturer is required.')
      return
    }
    if (!form.item_id) {
      toast.error('Item Detail is required.')
      return
    }
    if (!form.unit_id) {
      toast.error('Unit is required.')
      return
    }
    if (!form.stock || Number(form.stock) < 0) {
      toast.error('Valid Stock quantity is required.')
      return
    }
    if (!form.reorder_level || Number(form.reorder_level) < 0) {
      toast.error('Valid Reorder Level is required.')
      return
    }
    if (!form.sale_price || Number(form.sale_price) <= 0) {
      toast.error('Valid Sale Price is required.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        code: form.code.trim(),
        category_id: form.category_id,
        manufacturer_id: form.manufacturer_id,
        supplier_id: form.supplier_id || null,
        item_id: form.item_id,
        unit_id: form.unit_id,
        stock: Number(form.stock),
        reorder_level: Number(form.reorder_level),
        sale_price: Number(form.sale_price),
      }

      if (editId) {
        await axiosInstance.put(`/item-barcodes/${editId}`, {
          code: payload.code,
          category: payload.category_id,
          manufacturer: payload.manufacturer_id,
          supplier: payload.supplier_id,
          itemDetail: payload.item_id,
          unit: payload.unit_id,
          stock: payload.stock,
          reorderLevel: payload.reorder_level,
          salePrice: payload.sale_price,
        })
        toast.success('Barcode updated successfully.')
      } else {
        await axiosInstance.post('/item-barcodes', payload)
        toast.success('Barcode created successfully.')
      }
      resetForm()
      setIsFormOpen(false)
      fetchBarcodes()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save barcode.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this barcode?')) return
    try {
      await axiosInstance.delete(`/item-barcodes/${id}`)
      toast.success('Barcode deleted successfully.')
      fetchBarcodes()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete barcode.')
    }
  }

  function handleEdit(barcode) {
    setEditId(barcode.id)
    setForm({
      code: barcode.code || '',
      category_id: barcode.category_id || '',
      manufacturer_id: barcode.manufacturer_id || '',
      supplier_id: barcode.supplier_id || '',
      item_id: barcode.item_detail_id || barcode.item_id || '',
      unit_id: barcode.unit_id || '',
      stock: barcode.stock ?? '',
      reorder_level: barcode.reorder_level ?? '',
      sale_price: barcode.sale_price ?? '',
    })
    setIsFormOpen(true)
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getItemName = (id) => {
    const item = items.find(i => String(i.id) === String(id))
    return item ? item.item_name : 'Unknown'
  }

  const getCategoryName = (id) => {
    const cat = categories.find(c => String(c.id) === String(id))
    return cat ? cat.category_name : 'Unknown'
  }

  const getManufacturerName = (id) => {
    const mfg = manufacturers.find(m => String(m.id) === String(id))
    return mfg ? mfg.manufacturer_name : 'Unknown'
  }

  const inputCls = "h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Item Barcodes</h1>
            <p className="text-sm text-slate-500">Create and manage item barcodes with stock and pricing details.</p>
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
                Add Barcode
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
                  title={editId ? 'Edit Barcode Registration' : 'New Barcode Registration'}
                  description="Enter barcode details and stock information."
                  icon={<BarcodeIcon className="h-5 w-5" />}
                />

                <form onSubmit={handleSubmit} className="space-y-3">
                  <SectionCard title="Barcode Information">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      <Field label="Code" required>
                        <input
                          type="text"
                          value={form.code}
                          onChange={(e) => updateField('code', e.target.value)}
                          placeholder="Enter barcode code"
                          className={inputCls}
                        />
                      </Field>

                      <Field label="Category" required>
                        <select
                          value={form.category_id}
                          onChange={(e) => updateField('category_id', e.target.value)}
                          className={inputCls}
                        >
                          <option value="">Select Category</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.category_name}</option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Manufacturer" required>
                        <select
                          value={form.manufacturer_id}
                          onChange={(e) => updateField('manufacturer_id', e.target.value)}
                          className={inputCls}
                        >
                          <option value="">Select Manufacturer</option>
                          {manufacturers.map((m) => (
                            <option key={m.id} value={m.id}>{m.manufacturer_name}</option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Supplier">
                        <select
                          value={form.supplier_id}
                          onChange={(e) => updateField('supplier_id', e.target.value)}
                          className={inputCls}
                        >
                          <option value="">Select Supplier (Optional)</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>{s.supplier_name}</option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Item Detail" required>
                        <select
                          value={form.item_id}
                          onChange={(e) => updateField('item_id', e.target.value)}
                          className={inputCls}
                        >
                          <option value="">Select Item</option>
                          {items.map((i) => (
                            <option key={i.id} value={i.id}>{i.item_name}</option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Unit" required>
                        <select
                          value={form.unit_id}
                          onChange={(e) => updateField('unit_id', e.target.value)}
                          className={inputCls}
                        >
                          <option value="">Select Unit</option>
                          {units.map((u) => (
                            <option key={u.id} value={u.id}>{u.unit_name}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </SectionCard>

                  <SectionCard title="Stock & Pricing">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      <Field label="Stock" required>
                        <input
                          type="number"
                          min="0"
                          value={form.stock}
                          onChange={(e) => updateField('stock', e.target.value)}
                          placeholder="0"
                          className={inputCls}
                        />
                      </Field>

                      <Field label="Reorder Level" required>
                        <input
                          type="number"
                          min="0"
                          value={form.reorder_level}
                          onChange={(e) => updateField('reorder_level', e.target.value)}
                          placeholder="0"
                          className={inputCls}
                        />
                      </Field>

                      <Field label="Sale Price" required>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-semibold">PKR</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.sale_price}
                            onChange={(e) => updateField('sale_price', e.target.value)}
                            placeholder="0.00"
                            className="h-8 w-full rounded-md border border-slate-300 bg-white pl-10 pr-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                          />
                        </div>
                      </Field>
                    </div>
                  </SectionCard>

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

        {/* List Card below form */}
        <Card className="mx-auto max-w-5xl p-0 overflow-hidden">
          <SectionHeader
            title="Barcode Registry"
            description={`${barcodes.length} registered barcodes`}
            icon={<BarcodeIcon className="h-5 w-5" />}
            action={
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => { fetchBarcodes(); fetchDropdownData() }}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                >
                   Refresh List
                </button>
              </div>
            }
          />
          {loading && barcodes.length === 0 ? (
            <TableState message="Loading barcodes..." />
          ) : barcodes.length === 0 ? (
            <TableState message="No barcodes registered yet." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">Item Details</th>
                    <th className="px-5 py-3 text-right">Stock</th>
                    <th className="px-5 py-3 text-right">Pricing</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {barcodes.map((barcode) => (
                    <motion.tr 
                      key={barcode.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group transition-colors hover:bg-teal-50/30"
                    >
                      <td className="px-5 py-4 font-mono text-[11px] text-slate-700 font-bold">{barcode.code}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-[12px]">{getItemName(barcode.item_detail_id)}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 tracking-wider">
                              {getCategoryName(barcode.category_id)}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium">{getManufacturerName(barcode.manufacturer_id)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`text-[12px] font-bold ${barcode.stock <= barcode.reorder_level ? 'text-rose-600' : 'text-slate-700'}`}>
                            {barcode.stock}
                          </span>
                          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Min: {barcode.reorder_level}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-[12px] font-black text-emerald-600">PKR {Number(barcode.sale_price).toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(barcode)} />
                          <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(barcode.id)} />
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
