import { useCallback, useEffect, useState, useMemo } from 'react'
import { Card, PageShell, SectionHeader, TableState } from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance'
import { toast } from 'react-toastify'

function CalendarIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

const TYPE_STYLES = {
  SALE:     'bg-teal-100 text-teal-700',
  RECEIPT:  'bg-emerald-100 text-emerald-700',
  EXPENSE:  'bg-orange-100 text-orange-700',
  PURCHASE: 'bg-blue-100 text-blue-700',
  PAYMENT:  'bg-rose-100 text-rose-700',
  RETURN:   'bg-amber-100 text-amber-700',
  OPENING:  'bg-slate-100 text-slate-600',
  MANUAL:   'bg-purple-100 text-purple-700',
}

function TypeBadge({ type }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${TYPE_STYLES[type] || 'bg-slate-100 text-slate-600'}`}>
      {type}
    </span>
  )
}

function fmtTime(val) {
  if (!val) return '—'
  try { return new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  catch { return '—' }
}

export default function Daybook() {
  const [selectedDate, setSelectedDate]   = useState(() => new Date().toISOString().slice(0, 10))
  const [loading, setLoading]             = useState(false)
  const [transactions, setTransactions]   = useState([])
  const [openingBalance, setOpeningBalance] = useState(0)
  const [search, setSearch]               = useState('')

  // Opening balance modal state
  const [showObModal, setShowObModal]     = useState(false)
  const [obInput, setObInput]             = useState('')
  const [savingOb, setSavingOb]           = useState(false)

  const fetchDaybookData = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await axiosInstance.get(`/daybook?date=${selectedDate}`)
      const data = res.data || {}
      setTransactions(data.transactions   || [])
      setOpeningBalance(data.openingBalance || 0)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load daybook.')
      setTransactions([])
      setOpeningBalance(0)
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => { fetchDaybookData() }, [fetchDaybookData])

  async function handleSetOpeningBalance(e) {
    e.preventDefault()
    const amount = parseFloat(obInput)
    if (isNaN(amount) || amount < 0) { toast.error('Enter a valid amount.'); return }
    setSavingOb(true)
    try {
      await axiosInstance.post('/daybook/opening-balance', { amount, date: selectedDate })
      toast.success('Opening balance updated.')
      setShowObModal(false)
      setObInput('')
      fetchDaybookData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to set opening balance.')
    } finally {
      setSavingOb(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return transactions
    return transactions.filter(
      t => t.description?.toLowerCase().includes(q) || String(t.reference)?.toLowerCase().includes(q)
    )
  }, [transactions, search])

  const summary = useMemo(() => {
    const cashIn  = transactions.reduce((s, t) => s + (t.cashIn  || 0), 0)
    const cashOut = transactions.reduce((s, t) => s + (t.cashOut || 0), 0)
    const netFlow = cashIn - cashOut
    return { cashIn, cashOut, netFlow, closing: openingBalance + netFlow }
  }, [transactions, openingBalance])

  return (
    <PageShell title="Daybook" description="Chronological daily financial log." accent="from-teal-600 via-emerald-600 to-cyan-700">
      <div className="space-y-4 max-w-6xl mx-auto">

        {/* Header Controls */}
        <Card className="border-l-[6px] border-l-teal-500 p-4">
          <SectionHeader
            title="Daybook"
            description="All cash inflows and outflows for the selected date."
            icon={<CalendarIcon className="h-5 w-5" />}
          />
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="h-9 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-400"
            />
            <button
              onClick={fetchDaybookData}
              disabled={loading}
              className="h-9 px-4 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 disabled:opacity-50 transition"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={() => { setObInput(String(openingBalance)); setShowObModal(true) }}
              className="h-9 px-4 border border-teal-200 bg-teal-50 text-teal-700 rounded-lg text-sm font-bold hover:bg-teal-100 transition"
            >
              Set Opening Balance
            </button>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Opening Balance', value: openingBalance, color: 'bg-slate-50',   text: 'text-slate-700' },
            { label: 'Cash In',         value: summary.cashIn,  color: 'bg-teal-50/50', text: 'text-teal-700'  },
            { label: 'Cash Out',        value: summary.cashOut, color: 'bg-rose-50/50', text: 'text-rose-700'  },
            { label: 'Net Flow',        value: summary.netFlow, color: summary.netFlow >= 0 ? 'bg-emerald-50' : 'bg-rose-50', text: summary.netFlow >= 0 ? 'text-emerald-700' : 'text-rose-700' },
          ].map(({ label, value, color, text }) => (
            <Card key={label} className={`p-3 ${color}`}>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{label}</span>
              <p className={`text-[16px] font-bold mt-0.5 font-mono ${text}`}>
                {value >= 0 ? '' : '−'}PKR {Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </Card>
          ))}
        </div>

        {/* Closing balance full-width */}
        {/* <Card className="p-3 bg-teal-600">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">Closing / Drawer Cash</span>
            <span className="text-xl font-black text-white font-mono">
              PKR {summary.closing.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </Card> */}

        {/* Search + Table */}
        <Card className="overflow-hidden p-0">
          <SectionHeader
            title={`Transactions — ${selectedDate}`}
            description={`${filtered.length} record${filtered.length !== 1 ? 's' : ''}`}
            icon={<CalendarIcon className="h-5 w-5" />}
            action={
              <div className="p-4">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search reference or description..."
                  className="h-8 w-56 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[12px] outline-none focus:border-teal-400 focus:bg-white transition"
                />
              </div>
            }
          />

          <div className="overflow-x-auto max-h-[480px]">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/80 sticky top-0">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Cash In</th>
                  <th className="px-4 py-3 text-right">Cash Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {loading ? (
                  <tr><td colSpan="6">
                    <div className="flex justify-center items-center py-12 gap-3">
                      <div className="h-6 w-6 rounded-full border-2 border-teal-200 border-t-teal-600 animate-spin" />
                      <span className="text-sm text-slate-500">Loading daybook...</span>
                    </div>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="6"><TableState message={search ? 'No matching records.' : 'No transactions for this date.'} /></td></tr>
                ) : (
                  filtered.map((txn, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-2.5 text-[11px] font-mono text-slate-400 whitespace-nowrap">
                        {fmtTime(txn.dateTime)}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-[11px] text-slate-700 font-mono">
                        {txn.reference}
                      </td>
                      <td className="px-4 py-2.5">
                        <TypeBadge type={txn.type} />
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-slate-600 max-w-[200px] truncate">
                        {txn.description}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold font-mono text-[12px] text-teal-700">
                        {txn.cashIn  > 0 ? `PKR ${txn.cashIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold font-mono text-[12px] text-rose-600">
                        {txn.cashOut > 0 ? `PKR ${txn.cashOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {!loading && filtered.length > 0 && (
                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                  <tr>
                    <td colSpan="4" className="px-4 py-3 text-[11px] font-bold uppercase text-slate-500 text-right">
                      Totals
                    </td>
                    <td className="px-4 py-3 text-right font-black text-teal-700 font-mono text-[13px]">
                      PKR {summary.cashIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-rose-600 font-mono text-[13px]">
                      PKR {summary.cashOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>

      </div>

      {/* Opening Balance Modal */}
      {showObModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-[15px] font-bold text-slate-800 mb-1">Set Opening Balance</h3>
            <p className="text-[12px] text-slate-500 mb-4">Cash in drawer at the start of {selectedDate}</p>
            <form onSubmit={handleSetOpeningBalance} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-600 mb-1">Amount (PKR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={obInput}
                  onChange={e => setObInput(e.target.value)}
                  placeholder="0.00"
                  className="h-10 w-full rounded-lg border-2 border-slate-200 bg-slate-50 px-3 text-lg font-black text-teal-700 outline-none focus:border-teal-400 focus:bg-white transition"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowObModal(false); setObInput('') }}
                  className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOb}
                  className="flex-1 rounded-xl bg-teal-600 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50 transition"
                >
                  {savingOb ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </PageShell>
  )
}