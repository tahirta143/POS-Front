import { useEffect, useMemo, useState, memo } from 'react'
import { toast } from 'react-toastify'
import { Card, PageShell, SectionHeader, TableState } from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance'

function ReorderIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 12h10M7 17h10M5 7h.01M5 12h.01M5 17h.01" />
    </svg>
  )
}

function RefreshIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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

function DownloadIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v10m0 0l4-4m-4 4l-4-4M4 17v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
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

function StatusSpinner({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" />
      <path className="opacity-75" d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function toArray(payload) {
  if (Array.isArray(payload)) return payload
  return payload?.data ?? []
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

function MetricCard({ title, value, tone = 'teal' }) {
  const tones = {
    teal: 'bg-white',
    pending: 'bg-teal-50/60 border-teal-100',
    received: 'bg-teal-50/60 border-teal-100',
    value: 'bg-teal-50/60 border-teal-100',
  }
  const base = 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm'
  const cls = `${base} ${tones[tone] || ''}`
  return (
    <div className={cls}>
      <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-teal-700">{value}</p>
    </div>
  )
}

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'ordered', label: 'Ordered' },
  { id: 'received', label: 'Received' },
]

// ----------------------------------------------------
// Reorder Row Component
// ----------------------------------------------------
const ReorderRow = memo(function ReorderRow({ row, idx, onSave, onDelete, isSaving }) {
  const [qty, setQty] = useState(row.order_qty)
  const [status, setStatus] = useState(row.status)
  const [note, setNote] = useState(row.note)

  useEffect(() => {
    setQty(row.order_qty)
    setStatus(row.status)
    setNote(row.note)
  }, [row.order_qty, row.status, row.note])

  const stockTone = row.stock <= row.reorder_level ? 'bg-teal-50 text-teal-800 border-teal-100' : 'bg-teal-50 text-teal-800 border-teal-100'
  const statusTone = 'bg-teal-50 text-teal-700 border-teal-100'

  const isEdited = String(qty) !== String(row.order_qty) || status !== row.status || note !== row.note

  return (
    <tr className="text-[12px] transition hover:bg-slate-50/50">
      <td className="px-2 py-2 text-center text-slate-400">{idx + 1}</td>
      <td className="px-2 py-2">
        <div className="flex flex-col">
          <div className="font-semibold text-slate-800 truncate">{row.item_name}</div>
          {row.is_suggestion && (
            <span className="mt-0.5 inline-block w-fit rounded bg-amber-50 px-1 py-0.5 text-[9px] font-bold text-amber-600 border border-amber-100">
              Suggested
            </span>
          )}
        </div>
      </td>
      <td className="px-2 py-2 text-slate-600">
        <span className="inline-flex items-center rounded-md border border-teal-100 bg-teal-50 px-1.5 py-0.5 text-[11px] font-semibold text-teal-700 truncate">
          {row.category_name}
        </span>
      </td>
      <td className="px-2 py-2">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${stockTone}`}>
          {row.stock}
          <span className="text-[10px] font-semibold text-slate-500">{row.unit}</span>
        </span>
      </td>
      <td className="px-2 py-2 text-center text-slate-600">{row.reorder_level}</td>
      <td className="px-2 py-2 text-center">
        <input
          type="number"
          min="0"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="h-7 w-14 rounded-md border border-slate-300 bg-white px-1 text-[11px] text-center outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
        />
      </td>
      <td className="px-2 py-2 text-center">
        <div className="relative inline-flex items-center justify-center">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`h-7 rounded-full border px-2 text-[11px] font-semibold outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 ${statusTone}`}
          >
            <option value="pending">Pending</option>
            <option value="ordered">Ordered</option>
            <option value="received">Received</option>
          </select>
          <span className="pointer-events-none absolute right-2 text-slate-400">
            {status === 'ordered' ? <StatusSpinner className="h-3.5 w-3.5 animate-spin text-teal-500" /> : null}
          </span>
        </div>
      </td>
      <td className="px-2 py-2">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add notes..."
          className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
        />
      </td>
      <td className="px-2 py-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => onSave(row, qty, status, note)}
            disabled={isSaving || !isEdited}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-lg transition ${isEdited && !isSaving ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-300'}`}
            title="Save row changes"
          >
            {isSaving ? <StatusSpinner className="h-3.5 w-3.5 animate-spin" /> : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setQty(row.order_qty)
              setStatus(row.status)
              setNote(row.note)
            }}
            disabled={isSaving || !isEdited}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-lg transition ${isEdited && !isSaving ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-300'}`}
            title="Clear row edits"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {row.original_id && (
            <button
              type="button"
              onClick={() => onDelete(row)}
              disabled={isSaving}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 transition"
              title="Delete reorder"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </td>
    </tr>
  )
})

export default function ReOrderStock() {
  const [reorders, setReorders] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingStats, setLoadingStats] = useState(false)
  const [savingId, setSavingId] = useState(null)

  const [query, setQuery] = useState('')
  const [statusTab, setStatusTab] = useState('pending')

  useEffect(() => {
    fetchData()
    fetchStats()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await axiosInstance.get('/reorders')
      setReorders(toArray(res.data))
    } catch (err) {
      console.error('Fetch error:', err)
      toast.error('Unable to load reorder data.')
      setReorders([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    setLoadingStats(true)
    try {
      const res = await axiosInstance.get('/reorders/stats')
      setStats(res.data)
    } catch (err) {
      console.error('Stats error:', err)
    } finally {
      setLoadingStats(false)
    }
  }

  async function handleRowSave(row, newQty, newStatusRaw, newNotes) {
    const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : 'Pending';
    const nQty = Number(newQty) || 0;
    const nStatus = capitalize(newStatusRaw);

    if (nQty <= 0) {
      toast.warning('Please enter a valid reorder quantity.')
      return
    }

    if (!window.confirm(`Save changes for ${row.item_name} as ${nStatus}?`)) {
      return
    }

    setSavingId(row.key)
    try {
      if (row.original_id) {
        await axiosInstance.put(`/reorders/${row.original_id}`, {
          reorder_qty: nQty,
          status: nStatus,
          notes: newNotes
        })
      } else {
        await axiosInstance.post('/reorders', {
          item_id: row.item_id,
          reorder_qty: nQty,
          status: nStatus,
          notes: newNotes || ''
        })
      }
      toast.success(`${row.item_name} reorder updated.`)
      fetchData()
      fetchStats()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save changes.')
    } finally {
      setSavingId(null)
    }
  }

  async function handleDelete(row) {
    if (!row.original_id) return
    if (!window.confirm(`Delete reorder for ${row.item_name}?`)) return

    setSavingId(row.key)
    try {
      await axiosInstance.delete(`/reorders/${row.original_id}`)
      toast.success('Reorder deleted.')
      fetchData()
      fetchStats()
    } catch (err) {
      toast.error('Failed to delete reorder.')
    } finally {
      setSavingId(null)
    }
  }

  const enrichedRows = useMemo(() => {
    return reorders.map((r) => {
      const key = r.id ?? r.item_id
      const stock = Number(r.current_stock ?? 0) || 0
      const reorderLevel = Number(r.reorder_level ?? 0) || 0
      const normalizedStatus = String(r.status ?? '').toLowerCase()
      return {
        key,
        original_id: r.id, // Actual reorder DB id (null if suggestion)
        item_id: r.item_id, // Base item DB id
        item_name: r.item_name ?? '-',
        barcode: r.barcode ?? '',
        category_id: r.category_id,
        category_name: r.category ?? '-',
        stock,
        unit: r.unit ?? 'pcs',
        reorder_level: reorderLevel,
        purchase_price: Number(r.purchase_price ?? 0) || 0,
        sale_price: Number(r.sale_price ?? 0) || 0,
        order_qty: Number(r.reorder_qty ?? 0) || 0,
        status: normalizedStatus,
        note: r.notes ?? '',
        is_suggestion: !!r.is_suggestion
      }
    })
  }, [reorders])

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return enrichedRows.filter((r) => {
      const matchesQuery =
        !q ||
        r.item_name.toLowerCase().includes(q) ||
        r.category_name.toLowerCase().includes(q) ||
        r.barcode.toLowerCase().includes(q)
      const matchesStatus = statusTab === 'all' || r.status === statusTab
      return matchesQuery && matchesStatus
    })
  }, [enrichedRows, query, statusTab])

  const counts = useMemo(() => {
    const c = { all: enrichedRows.length, pending: 0, ordered: 0, received: 0 }
    enrichedRows.forEach((r) => {
      if (r.status === 'pending') c.pending += 1
      if (r.status === 'ordered') c.ordered += 1
      if (r.status === 'received') c.received += 1
    })
    return c
  }, [enrichedRows])

  const totalValue = useMemo(() => {
    return enrichedRows.reduce((sum, r) => sum + r.order_qty * r.purchase_price, 0)
  }, [enrichedRows])

  function exportCsv() {
    const rows = [
      ['Item', 'Category', 'Stock', 'Reorder Level', 'Order Qty', 'Status', 'Note'],
      ...filteredRows.map((r) => [
        r.item_name,
        r.category_name,
        r.stock,
        r.reorder_level,
        r.order_qty,
        r.status,
        r.note,
      ]),
    ]
    downloadCsv('reorder-management.csv', rows)
  }

  return (
    <PageShell title="Reorder Management" description="Reorders are auto-created when stock ≤ reorder level." accent="from-teal-600 via-emerald-600 to-cyan-700">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-teal-600">Reorder Management</h1>
            <p className="text-sm text-slate-500">Reorders are auto-created when stock ≤ reorder level</p>
          </div>
          <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <DownloadIcon className="h-4 w-4" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <PrinterIcon className="h-4 w-4" />
              Print
            </button>
            <button
              type="button"
              onClick={fetchData}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard title="Active Items" value={loadingStats ? '...' : (stats?.unique_items ?? 0)} tone="teal" />
          <MetricCard title="Pending" value={loadingStats ? '...' : (stats?.pending ?? 0)} tone="pending" />
          <MetricCard title="Ordered" value={loadingStats ? '...' : (stats?.ordered ?? 0)} tone="teal" />
          <MetricCard title="Received" value={loadingStats ? '...' : (stats?.received ?? 0)} tone="received" />
          <MetricCard title="Total Value" value={loadingStats ? '...' : `PKR ${(stats?.total_value ?? 0).toLocaleString()}`} tone="value" />
        </div>

        <Card className="border-l-[6px] border-l-teal-500 p-4">
          <SectionHeader
            title="Reorder List"
            description="Search, update order quantities, and manage statuses."
            icon={<ReorderIcon className="h-6 w-6" />}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-[420px]">
              <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by item name or category..."
                className="h-8 w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {STATUS_TABS.map((t) => {
                const active = statusTab === t.id
                let count = 0
                if (t.id === 'all') count = counts.all
                else if (t.id === 'pending') count = stats?.pending ?? 0
                else if (t.id === 'ordered') count = stats?.ordered ?? 0
                else if (t.id === 'received') count = stats?.received ?? 0

                const label = t.id === 'all' ? t.label : `${t.label} ${count}`

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setStatusTab(t.id)}
                    className={`h-8 rounded-md px-3 text-[12px] font-semibold transition ${active
                      ? 'bg-teal-600 text-white shadow-sm shadow-teal-200'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full divide-y divide-slate-100 text-left table-fixed">
              <thead className="bg-slate-50">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-2 py-3 w-[32px] text-center">#</th>
                  <th className="px-2 py-3">ITEM NAME</th>
                  <th className="px-2 py-3">CATEGORY</th>
                  <th className="px-2 py-3 w-[80px]">STOCK</th>
                  <th className="px-2 py-3 w-[65px] text-center">REORDER LVL</th>
                  <th className="px-2 py-3 w-[70px] text-center">ORDER QTY</th>
                  <th className="px-2 py-3 w-[90px] text-center">STATUS</th>
                  <th className="px-2 py-3">NOTES</th>
                  <th className="px-2 py-3 w-[70px] text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-4">
                      <TableState message="Loading reorder list..." />
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-4">
                      <TableState message="No rows match the current filters." />
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r, idx) => (
                    <ReorderRow
                      key={r.key}
                      row={r}
                      idx={idx}
                      onSave={handleRowSave}
                      onDelete={handleDelete}
                      isSaving={savingId === r.key}
                    />
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
