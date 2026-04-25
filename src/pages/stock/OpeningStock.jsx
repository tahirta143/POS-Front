import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { Card, PageShell, TableState } from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance'
import { usePermissions } from '../../hooks/usePermissions'
import { MdLock } from 'react-icons/md'

function RefreshIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

function SearchIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

// Custom specialized Metric Card
function MetricCard({ title, value, valueColor }) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-sm ring-1 ring-white/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:ring-slate-800/80">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] dark:text-teal-400">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${valueColor} dark:text-slate-100`}>{value}</p>
    </div>
  )
}

function toLocalYMD(d) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function OpeningStockPage() {
  const { canRead, canUpdate, isAdmin } = usePermissions()
  const MODULE_NAME = "Items"

  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)
  const [stockSaveError, setStockSaveError] = useState('')

  // Tracks last persisted values so we can revert on save failure.
  const originalStockByIdRef = useRef(new Map())

  // Filters
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const today = useMemo(() => toLocalYMD(new Date()), [])

  // Permission checks
  const canReadStock = isAdmin || canRead(MODULE_NAME)
  const canUpdateStock = isAdmin || canUpdate(MODULE_NAME)

  async function fetchData() {
    if (!canReadStock) return
    
    setLoading(true)
    setStockSaveError('')
    try {
      const [itmRes, catRes, supRes] = await Promise.all([
        axiosInstance.get('/item-details').catch(() => null),
        axiosInstance.get('/categories').catch(() => null),
        axiosInstance.get('/suppliers').catch(() => null),
      ])

      let nextItems = []
      let nextCategories = []
      let nextSuppliers = []

      if (itmRes?.data) {
        nextItems = Array.isArray(itmRes.data) ? itmRes.data : itmRes.data.data || []
      }
      if (catRes?.data) {
        nextCategories = Array.isArray(catRes.data) ? catRes.data : catRes.data.data || []
      }
      if (supRes?.data) {
        nextSuppliers = Array.isArray(supRes.data) ? supRes.data : supRes.data.data || []
      }

      setItems(nextItems)
      setCategories(nextCategories)
      setSuppliers(nextSuppliers)

      originalStockByIdRef.current = new Map(
        nextItems.map((i) => [i.id, Number(i.stock) || 0]),
      )
    } catch (error) {
      console.error(error)
      toast.error('Failed to load opening stock data')
    }

    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (canReadStock) {
        fetchData()
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [canReadStock])

  const handleStockInputChange = (itemId, newStockRaw) => {
    if (!canUpdateStock) return
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, stock: newStockRaw } : i)),
    )
  }

  async function commitStockChange(itemId, newStockRaw) {
    if (!canUpdateStock) {
      toast.error("You don't have permission to update stock.")
      return
    }
    
    const lastSaved = originalStockByIdRef.current.get(itemId) ?? 0
    const nextNumber = newStockRaw === '' ? 0 : Number(newStockRaw)
    if (Number.isNaN(nextNumber)) return
    if (nextNumber === lastSaved) return

    setStockSaveError('')
    try {
      await axiosInstance.put(`/item-details/${itemId}`, { stock: nextNumber })

      originalStockByIdRef.current.set(itemId, nextNumber)
      toast.success('Stock updated successfully')
    } catch {
      // Revert UI to last persisted value.
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, stock: lastSaved } : i)))
      setStockSaveError('Failed to save stock change. Please try again.')
      toast.error('Failed to save stock change')
    }
  }

  // Map categories to names seamlessly
  const getCategoryName = (id) => {
    const c = categories.find(cat => String(cat.id) === String(id))
    return c ? c.category_name : 'Uncategorized'
  }

  // Apply Filters
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Name/Barcode/Supplier universal search
      const s = search.toLowerCase()
      const categoryName = getCategoryName(item.item_category_id).toLowerCase()

      const matchesSearch = !s ||
                            item.item_name?.toLowerCase().includes(s) ||
                            item.barcode?.toLowerCase().includes(s) ||
                            item.label_barcode?.toLowerCase().includes(s) ||
                            String(item.id).toLowerCase().includes(s) ||
                            item.supplier?.toLowerCase().includes(s) ||
                            item.supplier_name?.toLowerCase().includes(s) ||
                            categoryName.includes(s)

      const matchesCat = !categoryFilter || String(item.item_category_id) === String(categoryFilter)
      const supplierTokens = [item.supplier, item.supplier_name, item.supplier_id].filter(Boolean).map(String)
      const matchesSup = !supplierFilter || supplierTokens.includes(String(supplierFilter))
      const matchesDate = !dateFilter || (item.created_at || '').includes(dateFilter)

      return matchesSearch && matchesCat && matchesSup && matchesDate
    })
  }, [items, categories, search, categoryFilter, supplierFilter, dateFilter])

  // Derive Metrics from the loaded payload
  const totalItems = items.length
  const totalStock = items.reduce((sum, item) => sum + (Number(item.stock) || 0), 0)
  const purchaseValue = items.reduce((sum, item) => sum + ((Number(item.stock) || 0) * (Number(item.purchase_price) || 0)), 0)
  const saleValue = items.reduce((sum, item) => sum + ((Number(item.stock) || 0) * (Number(item.sale_price) || 0)), 0)

  // Access Denied
  if (!canReadStock) {
    return (
      <PageShell
        title="Access Denied"
        description="You don't have permission to view Opening Stock."
        accent="from-rose-600 to-red-700"
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-red-100">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdLock className="text-5xl text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
            <p className="text-slate-500 mb-4">
              You don't have permission to view Opening Stock.
            </p>
            <div className="bg-slate-50 rounded-lg p-3 text-left">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Required Permission:</p>
              <p className="text-[12px] font-mono text-slate-700">Read Items</p>
            </div>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Opening Stock"
      description="View and manage initial stock quantities."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="mx-auto max-w-[1400px] space-y-6">

        {/* Header Ribbon identical to UI Screenshot */}
        <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-white/70 bg-white/70 px-5 py-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.65)] ring-1 ring-slate-200/70 backdrop-blur sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900/60 dark:ring-slate-800/80">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-teal-600 dark:text-teal-400">Inventory Control</p>
            <h1 className="mt-1 text-2xl font-bold text-teal-600">Opening Stock</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">View and manage initial stock quantities</p>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* 4 Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total Items" value={totalItems.toLocaleString()} valueColor="text-teal-500" />
          <MetricCard title="Stock on Hand (SOH)" value={totalStock.toLocaleString()} valueColor="text-teal-500" />
          <MetricCard title="Purchase Value" value={`Rs ${purchaseValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueColor="text-teal-600" />
          <MetricCard title="Sale Value" value={`Rs ${saleValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueColor="text-teal-600" />
        </div>

        {/* Filter Stock */}
        <Card className="border-l-[6px] border-l-teal-500 p-0 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 dark:border-teal-500/50 dark:bg-teal-600 transition-colors">
            <span className="h-4 w-1 bg-teal-500 dark:bg-white rounded-full block"></span>
            <h2 className="text-[12px] font-bold uppercase tracking-wide text-slate-800 dark:text-white">Filter Stock</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start p-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-teal-400 uppercase tracking-wider mb-1.5">Search</label>
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Name, category, supplier, barcode..."
                  className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 pl-8 pr-3 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-teal-400 uppercase tracking-wider mb-1.5">Category ({categories.length})</label>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.category_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-teal-400 uppercase tracking-wider mb-1.5">Supplier ({suppliers.length})</label>
              <select
                value={supplierFilter}
                onChange={e => setSupplierFilter(e.target.value)}
                className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              >
                <option value="">All Suppliers</option>
                {suppliers.length > 0 ? (
                   suppliers.map(s => <option key={s.id} value={s.supplier_name || s.id}>{s.supplier_name || s.id}</option>)
                ) : (
                   [...new Set(items.map(i => i.supplier).filter(Boolean))].map((s, idx) => (
                      <option key={idx} value={s}>{s}</option>
                   ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-teal-400 uppercase tracking-wider mb-1.5">Date Added</label>
              <input
                type="date"
                max={today}
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>

          {stockSaveError ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-700">
              {stockSaveError}
            </div>
          ) : null}

          <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-100">
            <p className="text-[12px] text-slate-500">
              Showing <strong className="text-slate-800">{filteredItems.length}</strong> of <strong className="text-slate-800">{items.length}</strong> items
            </p>
            <button
              onClick={() => { setSearch(''); setCategoryFilter(''); setSupplierFilter(''); setDateFilter('') }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              <RefreshIcon className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        </Card>

        {/* Data Table */}
        <Card className="overflow-hidden">
          <div className="custom-scrollbar overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="sticky top-0 z-10 bg-[#f8fafc]/95 backdrop-blur dark:bg-slate-800/80">
                <tr className="text-[12px] font-bold uppercase tracking-widest text-slate-500 dark:text-teal-400">
                  <th className="px-4 py-4 w-12 text-center">#</th>
                  <th className="px-4 py-4 min-w-[180px]">ITEM NAME</th>
                  <th className="px-4 py-4">CATEGORY</th>
                  <th className="px-4 py-4">SUPPLIER</th>
                  <th className="px-4 py-4">SHELF</th>
                  <th className="px-4 py-4">UNIT</th>
                  <th className="px-4 py-4 text-right">PURCHASE PRICE</th>
                  <th className="px-4 py-4 text-right">SALE PRICE</th>
                  <th className="px-4 py-4 text-center">STOCK</th>
                  <th className="px-4 py-4">ADDED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="10">
                      <TableState message="No items match the current filters." />
                    </td>
                   </tr>
                ) : (
                  filteredItems.map((item, idx) => (
                    <tr key={item.id || idx} className="text-[12px] transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{item.item_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 max-w-[120px] truncate">{item.label_barcode || item.id}</div>
                       </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-teal-50 border border-teal-100 px-2.5 py-1 text-[12px] font-semibold text-teal-700">
                          {getCategoryName(item.item_category_id)}
                        </span>
                       </td>
                      <td className="px-4 py-3 text-slate-600 truncate max-w-[140px]">{item.supplier_name || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[12px] font-semibold text-slate-700">
                          {item.shelf_name_code || '-'}
                        </span>
                       </td>
                      <td className="px-4 py-3 text-slate-600">{item.unit_name || '-'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-teal-600">Rs {Number(item.purchase_price || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-teal-600">Rs {Number(item.sale_price || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="relative inline-block">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.stock ?? ''}
                            onChange={(e) => handleStockInputChange(item.id, e.target.value === '' ? '' : e.target.value)}
                            onBlur={(e) => commitStockChange(item.id, e.target.value)}
                            disabled={!canUpdateStock}
                            className={`h-8 w-24 rounded-full border border-teal-200 bg-teal-50 pr-7 text-center font-bold text-teal-900 outline-none transition hover:bg-teal-100 focus:border-teal-400 focus:bg-teal-100 focus:ring-2 focus:ring-teal-200/50 cursor-text ${
                              !canUpdateStock ? 'opacity-60 cursor-not-allowed' : ''
                            }`}
                          />
                          {canUpdateStock && (
                            <svg
                              className="absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-teal-500 opacity-70 pointer-events-none"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          )}
                        </div>
                       </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}
                       </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </PageShell>
  )
}