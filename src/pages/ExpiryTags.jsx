import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { Card, Field, PageShell, SectionHeader, TableState, ActionButton } from '../components/layout/PageShell.jsx'
import axiosInstance from '../services/axiosInstance'

const sectionStyles = {
  teal: { accent: 'bg-teal-500', header: 'border-teal-100 bg-teal-50/80' },
}

function SectionCard({ title, children }) {
  const style = sectionStyles.teal
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

function TagIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 7h.01M3 11l8.586 8.586a2 2 0 002.828 0L21 13.414a2 2 0 000-2.828L12.414 2H5a2 2 0 00-2 2v7z"
      />
    </svg>
  )
}

function toOptionArray(payload) {
  if (Array.isArray(payload)) return payload
  return payload?.data ?? []
}

function safeNumber(val) {
  if (val === '' || val === null || val === undefined) return ''
  const n = Number(val)
  return Number.isFinite(n) ? n : ''
}

function normalizeItemCode(item) {
  return item?.barcode ?? item?.item_code ?? item?.code ?? item?.id ?? ''
}

export default function ExpiryTagsPage() {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [expiryTags, setExpiryTags] = useState([])

  const [loading, setLoading] = useState(false)
  const [loadingTags, setLoadingTags] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [receiptNumber, setReceiptNumber] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [itemId, setItemId] = useState('')
  const [itemCode, setItemCode] = useState('')
  const [price, setPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [supplier, setSupplier] = useState('')
  const [manufacturerDate, setManufacturerDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    fetchLookups()
    fetchExpiryTags()
  }, [])

  const filteredItems = useMemo(() => {
    if (!categoryId) return items
    return items.filter((i) => String(i.item_category_id) === String(categoryId))
  }, [items, categoryId])

  function resetForm() {
    setReceiptNumber('')
    setCategoryId('')
    setItemId('')
    setItemCode('')
    setPrice('')
    setSalePrice('')
    setManufacturer('')
    setSupplier('')
    setManufacturerDate('')
    setExpiryDate('')
    setEditId(null)
  }

  async function fetchLookups() {
    setLoading(true)
    try {
      const [catRes, itmRes] = await Promise.all([
        axiosInstance.get('/categories').catch(() => null),
        axiosInstance.get('/item-details').catch(() => null),
      ])

      if (catRes?.data) {
        setCategories(toOptionArray(catRes.data))
      }

      if (itmRes?.data) {
        setItems(toOptionArray(itmRes.data))
      }
    } catch {
      toast.error('Unable to load dropdown options. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchExpiryTags() {
    setLoadingTags(true)
    try {
      const res = await axiosInstance.get('/expiry-tags').catch(() => null)
      if (res?.data) {
        setExpiryTags(toOptionArray(res.data))
      } else {
        setExpiryTags([])
      }
    } catch {
      setExpiryTags([])
    } finally {
      setLoadingTags(false)
    }
  }

  function handleEdit(tag) {
    setEditId(tag.id)
    setReceiptNumber(tag.receipt_number || tag.receipt || '')
    setCategoryId(tag.category_id || tag.categoryId || '')
    setItemId(tag.item_id || tag.itemId || '')
    setItemCode(tag.item_code || tag.code || '')
    setPrice(tag.price || '')
    setSalePrice(tag.sale_price || '')
    setManufacturer(tag.manufacturer || '')
    setSupplier(tag.supplier || '')
    setManufacturerDate(tag.manufacturer_date || tag.mfg_date || '')
    setExpiryDate(tag.expiry_date || tag.exp_date || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this expiry tag?')) return
    try {
      await axiosInstance.delete(`/expiry-tags/${id}`)
      toast.success('Expiry tag deleted successfully.')
      if (editId === id) resetForm()
      fetchExpiryTags()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete expiry tag.')
    }
  }

  function handleSelectItem(nextItemId) {
    setItemId(nextItemId)
    const selected = items.find((i) => String(i.id) === String(nextItemId))
    if (!selected) return
    setItemCode(normalizeItemCode(selected))
    setPrice(safeNumber(selected.purchase_price ?? selected.price ?? ''))
    setSalePrice(safeNumber(selected.sale_price ?? selected.salePrice ?? ''))
    setManufacturer(selected.manufacturer_name ?? '')
    setSupplier(selected.supplier_name ?? '')
  }

  function handleCategoryChange(nextCategoryId) {
    setCategoryId(nextCategoryId)
    setItemId('')
    setItemCode('')
    setPrice('')
    setSalePrice('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!receiptNumber.trim()) {
      toast.error('Receipt Number is required.')
      return
    }
    if (!categoryId) {
      toast.error('Category selection is required.')
      return
    }
    if (!itemId) {
      toast.error('Item selection is required.')
      return
    }
    if (!expiryDate) {
      toast.error('Expiry Date is required.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        receipt_number: receiptNumber.trim(),
        category_id: categoryId,
        item_id: itemId,
        item_code: itemCode?.toString().trim(),
        price: Number(price) || 0,
        sale_price: Number(salePrice) || 0,
        manufacturer: manufacturer?.toString().trim(),
        supplier: supplier?.toString().trim(),
        manufacturer_date: manufacturerDate || null,
        expiry_date: expiryDate,
      }

      if (editId) {
        await axiosInstance.put(`/expiry-tags/${editId}`, payload)
        toast.success('Expiry tag updated successfully.')
      } else {
        await axiosInstance.post('/expiry-tags', payload)
        toast.success('Expiry tag saved successfully.')
      }
      resetForm()
      fetchExpiryTags()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save expiry tag.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell title="Expiry Tags" description="Track manufacturer and expiry dates for inventory." accent="from-teal-600 via-emerald-600 to-cyan-700">
      <div className="space-y-6">
        <Card className="mx-auto max-w-5xl border-l-[6px] border-l-teal-500 p-4">
          <SectionHeader
            title="Expiry Tags"
            description="Register expiry tracking tags for items."
            icon={<TagIcon className="h-6 w-6" />}
            action={
              <button
                type="button"
                onClick={() => {
                  fetchLookups()
                  fetchExpiryTags()
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Refresh
              </button>
            }
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            <SectionCard title="Add Expiry Tag">
              <div className="grid gap-4 lg:grid-cols-4">
                <Field label="Receipt Number" required>
                  <input
                    type="text"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="e.g. RCPT-0001"
                    className="h-8 w-full max-w-[12rem] rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </Field>

                <Field label={`Category (${categories.length})`} required>
                  <select
                    value={categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    disabled={loading}
                    className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.category_name ?? c.name ?? c.id}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label={`Item Name (${filteredItems.length})`} required>
                  <select
                    value={itemId}
                    onChange={(e) => handleSelectItem(e.target.value)}
                    disabled={!categoryId || loading}
                    className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50"
                  >
                    <option value="">Select Item</option>
                    {filteredItems.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.item_name ?? i.name ?? i.id}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Item Code">
                  <input
                    type="text"
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value)}
                    placeholder="Barcode / code"
                    className="h-8 w-full max-w-[14rem] rounded-md border border-slate-300 bg-white px-2.5 text-[12px] font-mono outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </Field>

                <Field label="Price">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="h-8 w-full max-w-[10rem] rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </Field>

                <Field label="Sale Price">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="0.00"
                    className="h-8 w-full max-w-[10rem] rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </Field>

                <Field label="Manufacturer">
                  <input
                    type="text"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    placeholder="e.g. Unilever"
                    className="h-8 w-full max-w-[14rem] rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </Field>

                <Field label="Supplier">
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="e.g. Metro Supplier"
                    className="h-8 w-full max-w-[14rem] rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </Field>

                <Field label="Manufacturer Date">
                  <input
                    type="date"
                    value={manufacturerDate}
                    onChange={(e) => setManufacturerDate(e.target.value)}
                    className="h-8 w-full max-w-[12rem] rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </Field>

                <Field label="Expiry Date" required>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="h-8 w-full max-w-[12rem] rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </Field>
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex min-w-[130px] items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-w-[170px] items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : editId ? 'Update Expiry Tag' : 'Save Expiry Tag'}
                </button>
              </div>
            </SectionCard>
          </form>
        </Card>

        <Card className="mx-auto max-w-5xl">
          <SectionHeader
            title="Expiry Tags List"
            description={`${expiryTags.length} tags recorded`}
            icon={<TagIcon className="h-6 w-6" />}
            action={
              <button
                type="button"
                onClick={fetchExpiryTags}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Refresh
              </button>
            }
          />

          {loadingTags ? (
            <TableState message="Loading expiry tags..." />
          ) : expiryTags.length === 0 ? (
            <TableState message="No expiry tags found yet." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="overflow-x-auto w-full">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-[12px] font-bold uppercase tracking-widest text-slate-500">
                      <th className="px-4 py-4 w-12 text-center">#</th>
                      <th className="px-4 py-4">RECEIPT</th>
                      <th className="px-4 py-4">CATEGORY</th>
                      <th className="px-4 py-4">ITEM</th>
                      <th className="px-4 py-4">CODE</th>
                      <th className="px-4 py-4 text-right">PRICE</th>
                      <th className="px-4 py-4 text-right">SALE PRICE</th>
                      <th className="px-4 py-4">MANUFACTURER</th>
                      <th className="px-4 py-4">SUPPLIER</th>
                      <th className="px-4 py-4">MFG DATE</th>
                      <th className="px-4 py-4 whitespace-nowrap">EXPIRY DATE</th>
                      <th className="px-4 py-4 whitespace-nowrap">ADDED</th>
                      <th className="px-4 py-4 text-right w-24">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {expiryTags.map((t, idx) => (
                      <tr key={t.id || idx} className="text-[12px] transition hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{t.receipt_number ?? t.receipt ?? '-'}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {(() => {
                            const catId = t.category_id ?? t.categoryId
                            const cat = categories.find((c) => String(c.id) === String(catId))
                            return cat?.category_name ?? t.category_name ?? '-'
                          })()}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {(() => {
                            const id = t.item_id ?? t.itemId
                            const itm = items.find((i) => String(i.id) === String(id))
                            return itm?.item_name ?? t.item_name ?? '-'
                          })()}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono">{t.item_code ?? t.code ?? '-'}</td>
                        <td className="px-4 py-3 text-right font-semibold text-teal-600">Rs {Number(t.price || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-teal-600">Rs {Number(t.sale_price || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-slate-600">{t.manufacturer || '-'}</td>
                        <td className="px-4 py-3 text-slate-600">{t.supplier || '-'}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{t.manufacturer_date ?? t.mfg_date ?? '-'}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{t.expiry_date ?? t.exp_date ?? '-'}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {t.created_at
                            ? new Date(t.created_at)
                                .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                .replace(/ /g, '-')
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(t)} />
                            <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(t.id)} />
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
