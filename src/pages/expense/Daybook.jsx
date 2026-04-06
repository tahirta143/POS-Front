import { useEffect, useState, useMemo } from 'react'
import { Card, Field, PageShell, SectionHeader, TableState } from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance'

const sectionStyles = {
  teal: { accent: 'bg-teal-500', header: 'border-teal-100 bg-teal-50/80' },
}

function SectionCard({ color, title, children }) {
  const style = sectionStyles[color] ?? sectionStyles.teal
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm shadow-slate-100/50">
      <div className={`mb-2 flex items-center gap-2.5 rounded-md border px-2.5 py-1.5 ${style.header}`}>
        <span className={`h-4 w-1 rounded-full ${style.accent}`} />
        <h3 className="text-[13px] font-semibold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function ClockIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function getTypeBadgeStyle(type) {
  switch (type) {
    case 'SALE':
      return 'bg-teal-100 text-teal-700'
    case 'EXPENSE':
      return 'bg-teal-50 text-teal-600'
    case 'PURCHASE':
      return 'bg-teal-100 text-teal-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

export default function Daybook() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [openingBalance, setOpeningBalance] = useState(0)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchDaybookData()
  }, [selectedDate])

  async function fetchDaybookData() {
    setLoading(true)
    try {
      const response = await axiosInstance.get(`/daybook?date=${selectedDate}`)
      const data = response.data || {}
      setTransactions(data.transactions || [])
      setOpeningBalance(data.openingBalance || 0)
    } catch (err) {
      console.error('Failed to load daybook data:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter(t => 
    t.description?.toLowerCase().includes(search.toLowerCase()) ||
    t.reference?.toLowerCase().includes(search.toLowerCase())
  );

  const summary = useMemo(() => {
    const cashIn = transactions.reduce((sum, txn) => sum + (txn.cashIn || 0), 0)
    const cashOut = transactions.reduce((sum, txn) => sum + (txn.cashOut || 0), 0)
    const netFlow = cashIn - cashOut
    const expectedDrawer = openingBalance + netFlow
    return { cashIn, cashOut, netFlow, expectedDrawer }
  }, [transactions, openingBalance])

  return (
    <PageShell title="Daybook" description="Daily financial log" accent="from-teal-600 via-emerald-600 to-cyan-700">
      <div className="space-y-4 max-w-6xl mx-auto">
        <Card className="border-l-[6px] border-l-teal-500 p-3.5">
          <SectionHeader title="Daybook" description="Chronological log of today's activities" icon={<CalendarIcon className="h-6 w-6" />} />
          <div className="flex gap-2 items-center mt-4">
             <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm focus:border-teal-400 outline-none" />
             <button onClick={fetchDaybookData} className="h-9 px-4 bg-teal-600 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-teal-700">Refresh</button>
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-3 bg-teal-50/50"><span className="text-[10px] font-bold text-slate-500 uppercase">Cash In</span><p className="text-[16px] font-bold text-teal-700">PKR {summary.cashIn.toFixed(2)}</p></Card>
          <Card className="p-3 bg-teal-50/50"><span className="text-[10px] font-bold text-slate-500 uppercase">Cash Out</span><p className="text-[16px] font-bold text-teal-700">PKR {summary.cashOut.toFixed(2)}</p></Card>
          <Card className="p-3 bg-teal-50/50"><span className="text-[10px] font-bold text-slate-500 uppercase">Net Flow</span><p className="text-[16px] font-bold text-teal-700">{summary.netFlow >= 0 ? '+' : ''} PKR {summary.netFlow.toFixed(2)}</p></Card>
          <Card className="p-3 bg-teal-600 text-white"><span className="text-[10px] font-bold opacity-80 uppercase">Drawer Cash</span><p className="text-[16px] font-bold">PKR {summary.expectedDrawer.toFixed(2)}</p></Card>
        </div>

        <Card className="p-2 border-l-[4px] border-l-teal-500">
           <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search reference or description..." 
            className="h-8 w-full rounded border border-slate-200 px-3 text-[12px] outline-none focus:border-teal-400" 
           />
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto w-full max-h-[400px]">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <th className="px-3 py-3">Time</th>
                  <th className="px-3 py-3">Ref</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Description</th>
                  <th className="px-3 py-3 text-right">In</th>
                  <th className="px-3 py-3 text-right">Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredTransactions.length === 0 ? (
                  <tr><td colSpan="6"><TableState message={loading ? 'Loading...' : 'No records found.'} /></td></tr>
                ) : (
                  filteredTransactions.map((txn, idx) => (
                    <tr key={idx} className="text-[11px] hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-500 font-mono">{new Date(txn.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                      <td className="px-3 py-2 font-bold text-slate-700">{txn.reference}</td>
                      <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getTypeBadgeStyle(txn.type)}`}>{txn.type}</span></td>
                      <td className="px-3 py-2 text-slate-600 truncate max-w-[150px]">{txn.description}</td>
                      <td className="px-3 py-2 text-right text-teal-700 font-medium">{txn.cashIn > 0 ? txn.cashIn.toFixed(2) : '-'}</td>
                      <td className="px-3 py-2 text-right text-rose-600 font-medium">{txn.cashOut > 0 ? txn.cashOut.toFixed(2) : '-'}</td>
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
