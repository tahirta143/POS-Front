import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
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
    } catch (err) {
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

      await axiosInstance.post('/item-barcodes', payload)
      toast.success('Barcode created successfully.')
      resetForm()
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

  return (
    <PageShell
      title="Item Barcode Management"
      description="Create and manage item barcodes with stock details."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-4">
        <Card className="mx-auto max-w-5xl border-l-[6px] border-l-teal-500 p-3">
          <SectionHeader
            title="New Barcode Registration"
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
                    className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </Field>

                <Field label="Category" required>
                  <select
                    value={form.category_id}
                    onChange={(e) => updateField('category_id', e.target.value)}
                    className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
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
                    className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
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
                    className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
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
                    className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
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
                    className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
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
                    placeholder="Enter stock quantity"
                    className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </Field>

                <Field label="Reorder Level" required>
                  <input
                    type="number"
                    min="0"
                    value={form.reorder_level}
                    onChange={(e) => updateField('reorder_level', e.target.value)}
                    placeholder="Enter reorder level"
                    className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </Field>

                <Field label="Sale Price" required>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">Rs</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.sale_price}
                      onChange={(e) => updateField('sale_price', e.target.value)}
                      placeholder="Enter sale price"
                      className="h-7 w-full rounded-md border border-slate-300 bg-white pl-7 pr-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                </Field>
              </div>
            </SectionCard>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-teal-600 px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-teal-700 transition disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Barcode'}
              </button>
            </div>
          </form>
        </Card>

        <Card className="mx-auto max-w-5xl p-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-800">Registered Barcodes</h3>
              <p className="text-[10px] text-slate-500">List of all item barcodes</p>
            </div>
            <button
              onClick={() => { fetchBarcodes(); fetchDropdownData() }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              <RefreshIcon className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {barcodes.length === 0 ? (
            <TableState message="No barcodes registered yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-2 text-left">Code</th>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-left">Category</th>
                    <th className="px-3 py-2 text-left">Manufacturer</th>
                    <th className="px-3 py-2 text-right">Stock</th>
                    <th className="px-3 py-2 text-right">Sale Price</th>
                    <th className="px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {barcodes.map((barcode) => (
                    <tr key={barcode.id} className="text-[11px] hover:bg-slate-50/50 transition">
                      <td className="px-3 py-2 font-mono text-slate-700">{barcode.code}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{getItemName(barcode.item_detail_id)}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center rounded-full bg-teal-50 px-1.5 py-0.5 text-[9px] font-medium text-teal-700">
                          {getCategoryName(barcode.category_id)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600 text-[10px]">{getManufacturerName(barcode.manufacturer_id)}</td>
                      <td className="px-3 py-2 text-right font-medium text-slate-700">{barcode.stock}</td>
                      <td className="px-3 py-2 text-right font-medium text-emerald-600">Rs {Number(barcode.sale_price).toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleDelete(barcode.id)}
                          className="inline-flex items-center justify-center rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
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

function TrashIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}