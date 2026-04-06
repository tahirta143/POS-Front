import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { Card, PageShell, TableState } from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance'

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

function DownloadIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v10m0 0l4-4m-4 4l-4-4M4 17v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
    </svg>
  )
}

function PrinterIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V4h12v5M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v6H6v-6z" />
    </svg>
  )
}

function SaveIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  )
}

function MetricCard({ title, value, valueColor }) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  )
}

function toLocalYMD(d) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function downloadCsv(filename, rows) {
  const csv = rows
    .map((r) => r.map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function ClosingStock() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Editable adjustments per item
  const [adjustmentById, setAdjustmentById] = useState({})

  // Filters
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [dateFilter, setDateFilter] = useState(() => toLocalYMD(new Date()))
  const today = useMemo(() => toLocalYMD(new Date()), [])

  useEffect(() => {
    fetchData()
  }, [dateFilter])

  async function fetchData() {
    setLoading(true)
    try {
      const [itmRes, catRes, supRes, reportRes] = await Promise.all([
        axiosInstance.get('/item-details').catch(() => null),
        axiosInstance.get('/categories').catch(() => null),
        axiosInstance.get('/suppliers').catch(() => null),
        axiosInstance.get(`/reports/stock?date=${dateFilter}`).catch(() => null),
      ])

      let nextItems = []
      let nextCategories = []
      let nextSuppliers = []
      let reportData = []

      if (itmRes?.data) {
        const d = itmRes.data
        nextItems = Array.isArray(d) ? d : d.data || []
      }
      if (catRes?.data) {
        const d = catRes.data
        nextCategories = Array.isArray(d) ? d : d.data || []
      }
      if (supRes?.data) {
        const d = supRes.data
        nextSuppliers = Array.isArray(d) ? d : d.data || []
      }
      if (reportRes?.data) {
        reportData = reportRes.data
      }

      // Merge report data into items
      const nextAdjustments = {}
      const merged = nextItems.map(item => {
        const report = reportData.find(r => r.id === item.id)
        if (report?.adjustment) {
          nextAdjustments[item.id] = report.adjustment
        }
        return {
          ...item,
          opening_stock_val: report?.opening_stock ?? item.stock ?? 0,
          purchases_in: report?.total_purchases ?? 0,
          sales_out: report?.total_sales ?? 0,
          current_stock: report?.current_stock ?? item.stock ?? 0,
          is_snapshot: report?.is_snapshot ?? false
        }
      })

      setItems(merged)
      setAdjustmentById(nextAdjustments)
      setCategories(nextCategories)
      setSuppliers(nextSuppliers)

    } catch (e) {
      console.error(e)
      toast.error('Unable to load stock data.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveSnapshot() {
    if (!window.confirm(`Save stock snapshot for ${dateFilter}? This will freeze the daily balances.`)) return
    
    setSaving(true)
    try {
      const payload = {
        closing_date: dateFilter,
        items: enrichedItems.map(i => ({
          id: i.id,
          opening_stock: i.opening_stock_val,
          total_purchases: i.purchases_in,
          total_sales: i.sales_out,
          adjustment: i.adjustment,
          calc_closing: i.closing_stock,
          purchase_price: i.purchase_price,
          sale_price: i.sale_price
        }))
      }

      await axiosInstance.post('/reports/snapshot', payload)
      toast.success('Snapshot saved successfully!')
      fetchData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save snapshot.')
    } finally {
      setSaving(false)
    }
  }

  const getCategoryName = (id) => {
    const c = categories.find((cat) => String(cat.id) === String(id))
    return c ? c.category_name : 'Uncategorized'
  }

  // Build enriched rows with calculated closing stock
  const enrichedItems = useMemo(() => {
    return items.map((item) => {
      const adjustment = Number(adjustmentById[item.id] ?? item.adjustment ?? 0) || 0
      const closingStock = item.opening_stock_val + item.purchases_in - item.sales_out + adjustment

      return {
        ...item,
        adjustment,
        closing_stock: closingStock,
      }
    })
  }, [items, adjustmentById])


  // Apply filters
  const filteredItems = useMemo(() => {
    return enrichedItems.filter((item) => {
      const s = search.toLowerCase()
      const matchesSearch =
        !s ||
        item.item_name?.toLowerCase().includes(s) ||
        item.barcode?.toLowerCase().includes(s) ||
        item.supplier?.toLowerCase().includes(s) ||
        item.supplier_name?.toLowerCase().includes(s)

      const matchesCat = !categoryFilter || String(item.category_id) === String(categoryFilter)
      const supplierTokens = [item.supplier, item.supplier_name, item.supplier_id]
        .filter(Boolean)
        .map(String)
      const matchesSup = !supplierFilter || supplierTokens.includes(String(supplierFilter))
      // Backend now handles the date balancing, we show all items.
      // const matchesDate = !dateFilter || (item.created_at || '').includes(dateFilter)

      return matchesSearch && matchesCat && matchesSup
    })
  }, [enrichedItems, search, categoryFilter, supplierFilter, dateFilter])

  // Metrics
  const totalItems = enrichedItems.length
  const totalClosingStock = enrichedItems.reduce((sum, i) => sum + i.closing_stock, 0)
  const costValue = enrichedItems.reduce(
    (sum, i) => sum + i.closing_stock * (Number(i.purchase_price) || 0),
    0,
  )
  const retailValue = enrichedItems.reduce(
    (sum, i) => sum + i.closing_stock * (Number(i.sale_price) || 0),
    0,
  )

  function handleAdjustmentChange(itemId, value) {
    setAdjustmentById((prev) => ({ ...prev, [itemId]: value === '' ? '' : value }))
  }

  function exportCsv() {
    const rows = [
      ['#', 'Item Name', 'Category', 'Unit', 'Opening Stock', 'Purchases', 'Sales', 'Adjustment', 'Closing Stock', 'Purchase Price', 'Sale Price'],
      ...filteredItems.map((item, idx) => [
        idx + 1,
        item.item_name,
        getCategoryName(item.category_id),
        item.item_unit || '-',
        item.opening_stock_val,
        item.purchases_in,
        item.sales_out,
        item.adjustment,
        item.closing_stock,
        Number(item.purchase_price || 0).toFixed(2),
        Number(item.sale_price || 0).toFixed(2),
      ]),
    ]
    downloadCsv(`closing-stock-${dateFilter || today}.csv`, rows)
  }

  return (
    <PageShell
      title="Closing Stock"
      description="End-of-period stock snapshot with calculated balances."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-6 w-full mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-teal-600">Closing Stock</h1>
            <p className="text-sm text-slate-500">
              End-of-period stock balances — Opening + Purchases − Sales ± Adjustments
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              <DownloadIcon className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              <PrinterIcon className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={handleSaveSnapshot}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-[12px] font-bold text-teal-700 shadow-sm hover:bg-teal-100 transition disabled:opacity-50"
            >
              <SaveIcon className="h-4 w-4" />
              Save Snapshot
            </button>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              <RefreshIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Items"
            value={totalItems.toLocaleString()}
            valueColor="text-teal-500"
          />
          <MetricCard
            title="Closing Stock (Units)"
            value={totalClosingStock.toLocaleString()}
            valueColor="text-teal-500"
          />
          <MetricCard
            title="Stock Value (Cost)"
            value={`Rs ${costValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            valueColor="text-teal-600"
          />
          <MetricCard
            title="Stock Value (Retail)"
            value={`Rs ${retailValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            valueColor="text-teal-600"
          />
        </div>

        {/* Filter Section */}
        <Card className="p-4 border-l-[6px] border-l-teal-500">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-4 w-1 bg-teal-500 rounded-full block"></span>
            <h2 className="text-[13px] font-bold text-slate-800 tracking-wide uppercase">
              Filter Stock
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Search
              </label>
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name, category, supplier, barcode..."
                  className="h-8 w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Category ({categories.length})
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Supplier ({suppliers.length})
              </label>
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              >
                <option value="">All Suppliers</option>
                {suppliers.length > 0
                  ? suppliers.map((s) => (
                      <option key={s.id} value={s.supplier_name || s.id}>
                        {s.supplier_name || s.id}
                      </option>
                    ))
                  : [...new Set(items.map((i) => i.supplier).filter(Boolean))].map((s, idx) => (
                      <option key={idx} value={s}>
                        {s}
                      </option>
                    ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Closing Date
              </label>
              <input
                type="date"
                max={today}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-100">
            <p className="text-[12px] text-slate-500">
              Showing <strong className="text-slate-800">{filteredItems.length}</strong> of{' '}
              <strong className="text-slate-800">{enrichedItems.length}</strong> items
            </p>
            <button
              onClick={() => {
                setSearch('')
                setCategoryFilter('')
                setSupplierFilter('')
                setDateFilter(today)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              <RefreshIcon className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        </Card>

        {/* Data Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-[#f8fafc]">
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-2 py-3 w-8 text-center border-b border-slate-200">#</th>
                      <th className="px-2 py-3 min-w-[140px] border-b border-slate-200">ITEM NAME</th>
                      <th className="px-2 py-3 border-b border-slate-200">CATEGORY</th>
                      <th className="px-2 py-3 border-b border-slate-200">UNIT</th>
                      <th className="px-2 py-3 text-center border-b border-slate-200">
                        <span className="inline-flex items-center gap-1">
                          OPENING
                          <span className="text-[9px] text-slate-400 font-normal normal-case">(SOH)</span>
                        </span>
                      </th>
                      <th className="px-2 py-3 text-center border-b border-slate-200">
                        <span className="inline-flex items-center gap-1 text-teal-600">
                          PURCHASES
                          <span className="text-[9px] font-normal normal-case">(+)</span>
                        </span>
                      </th>
                      <th className="px-2 py-3 text-center border-b border-slate-200">
                        <span className="inline-flex items-center gap-1 text-teal-600">
                          SALES
                          <span className="text-[9px] font-normal normal-case">(−)</span>
                        </span>
                      </th>
                      <th className="px-2 py-3 text-center border-b border-slate-200">
                        <span className="inline-flex items-center gap-1 text-teal-600">
                          ADJUST
                          <span className="text-[9px] font-normal normal-case">(±)</span>
                        </span>
                      </th>
                      <th className="px-2 py-3 text-center border-b border-slate-200">
                        <span className="inline-flex items-center gap-1 text-teal-700 font-extrabold">
                          CLOSING
                        </span>
                      </th>
                      <th className="px-2 py-3 text-right border-b border-slate-200">COST</th>
                      <th className="px-2 py-3 text-right border-b border-slate-200">RETAIL</th>
                    </tr>
                  </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="11" className="p-4">
                      <TableState message="Loading stock data..." />
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="p-4">
                      <TableState message="No items match the current filters." />
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, idx) => {
                    const closingPositive = item.closing_stock > 0
                    const closingZero = item.closing_stock === 0
                    const closingNegative = item.closing_stock < 0

                    return (
                      <tr
                        key={item.id || idx}
                        className={`text-[11px] transition hover:bg-slate-50/50 ${closingNegative ? 'bg-teal-50/30' : ''}`}
                      >
                        <td className="px-2 py-2 text-center text-slate-400 border-b border-slate-50">{idx + 1}</td>
                        <td className="px-2 py-2 border-b border-slate-50">
                          <div className="font-bold text-slate-800 leading-tight truncate max-w-[120px]" title={item.item_name}>
                            {item.item_name}
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5 max-w-[100px] truncate">
                            {item.barcode || item.id}
                          </div>
                        </td>
                        <td className="px-2 py-2 border-b border-slate-50">
                          <span className="inline-flex items-center rounded-full bg-teal-50 border border-teal-100 px-1.5 py-0.5 text-[9px] font-semibold text-teal-700 truncate max-w-[80px]">
                            {getCategoryName(item.item_category_id)}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-slate-600 border-b border-slate-50">{item.unit_name || '-'}</td>

                        {/* Opening Stock — read-only */}
                        <td className="px-2 py-2 text-center border-b border-slate-50">
                          <span className="inline-flex items-center justify-center rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[11px] font-bold text-slate-700 min-w-[36px]">
                            {item.opening_stock_val}
                          </span>
                        </td>

                        {/* Purchases — read-only */}
                        <td className="px-2 py-2 text-center border-b border-slate-50">
                          <span className="inline-flex items-center justify-center rounded bg-teal-50 border border-teal-200 px-1.5 py-0.5 text-[11px] font-bold text-teal-700 min-w-[36px]">
                            +{item.purchase_price}
                          </span>
                        </td>

                        {/* Sales — read-only */}
                        <td className="px-2 py-2 text-center border-b border-slate-50">
                          <span className="inline-flex items-center justify-center rounded bg-teal-50 border border-teal-100 px-1.5 py-0.5 text-[11px] font-bold text-teal-700 min-w-[36px]">
                            −{item.sale_price}
                          </span>
                        </td>

                        {/* Adjustment — editable */}
                        <td className="px-2 py-2 text-center border-b border-slate-50">
                          <div className="relative inline-block">
                            <input
                              type="number"
                              value={adjustmentById[item.id] ?? item.adjustment ?? 0}
                              onChange={(e) =>
                                handleAdjustmentChange(item.id, e.target.value)
                              }
                              className="h-6 w-12 rounded bg-teal-50 border border-teal-200 text-teal-800 font-bold text-center outline-none transition focus:border-teal-400 focus:bg-teal-100 focus:ring-2 focus:ring-teal-200/50 hover:bg-teal-100 cursor-text text-[11px]"
                            />
                          </div>
                        </td>

                        {/* Closing Stock — calculated, bold highlight */}
                        <td className="px-2 py-2 text-center border-b border-slate-50">
                          <span
                            className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-[11px] font-extrabold min-w-[40px] border ${
                              closingNegative
                                ? 'bg-teal-50 border-teal-200 text-teal-600'
                                : closingZero
                                  ? 'bg-slate-100 border-slate-300 text-slate-600'
                                  : 'bg-teal-100 border-teal-300 text-teal-800'
                            }`}
                          >
                            {item.closing_stock}
                          </span>
                        </td>

                        {/* Cost Value */}
                        <td className="px-2 py-2 text-right font-semibold text-teal-600 border-b border-slate-50 whitespace-nowrap">
                          { (item.closing_stock * (Number(item.purchase_price) || 0)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }
                        </td>

                        {/* Retail Value */}
                        <td className="px-2 py-2 text-right font-semibold text-teal-600 border-b border-slate-50 whitespace-nowrap">
                          { (item.closing_stock * (Number(item.sale_price) || 0)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>

              {/* Table Footer — Totals row */}
              {filteredItems.length > 0 && (
                <tfoot className="bg-slate-50 border-t-2 border-teal-200">
                  <tr className="text-[11px] font-bold text-slate-700">
                    <td className="px-2 py-3" colSpan="4" />
                    <td className="px-2 py-3 text-center">
                      {filteredItems.reduce((s, i) => s + i.opening_stock_val, 0)}
                    </td>
                    <td className="px-2 py-3 text-center text-teal-700">
                      +{filteredItems.reduce((s, i) => s + i.purchases_in, 0)}
                    </td>
                    <td className="px-2 py-3 text-center text-teal-700">
                      −{filteredItems.reduce((s, i) => s + i.sales_out, 0)}
                    </td>
                    <td className="px-2 py-3 text-center text-teal-700">
                      {filteredItems.reduce((s, i) => s + i.adjustment, 0)}
                    </td>
                    <td className="px-2 py-3 text-center text-teal-800 text-[12px] font-extrabold">
                      {filteredItems.reduce((s, i) => s + i.closing_stock, 0)}
                    </td>
                    <td className="px-2 py-3 text-right text-teal-700 whitespace-nowrap">
                      {filteredItems
                        .reduce((s, i) => s + i.closing_stock * (Number(i.purchase_price) || 0), 0)
                        .toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-2 py-3 text-right text-teal-700 whitespace-nowrap">
                      {filteredItems
                        .reduce((s, i) => s + i.closing_stock * (Number(i.sale_price) || 0), 0)
                        .toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      </div>
    </PageShell>
  )
}