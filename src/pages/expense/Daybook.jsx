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

// Generate mock daybook data for a specific date
function generateMockDaybookData(date) {
  const transactions = []
  const openingBalance = 5000 // Starting cash in drawer
  
  // Sample data - in real app, this would come from API
  const sampleTransactions = [
    { time: '09:00', type: 'SALE', ref: 'INV-001', desc: 'Retail Sale - Item #1234', cashIn: 1500, cashOut: 0, method: 'Cash' },
    { time: '09:30', type: 'SALE', ref: 'INV-002', desc: 'Retail Sale - Item #5678', cashIn: 2300, cashOut: 0, method: 'Card' },
    { time: '10:15', type: 'EXPENSE', ref: 'EXP-001', desc: 'Stationery Purchase', cashIn: 0, cashOut: 450, method: 'Cash' },
    { time: '11:00', type: 'SALE', ref: 'INV-003', desc: 'Wholesale Order - Bulk Items', cashIn: 8500, cashOut: 0, method: 'Online' },
    { time: '11:45', type: 'PURCHASE', ref: 'PUR-001', desc: 'Inventory Restock - Supplier A', cashIn: 0, cashOut: 3200, method: 'Bank Transfer' },
    { time: '12:30', type: 'SALE', ref: 'INV-004', desc: 'Retail Sale - Item #9012', cashIn: 1200, cashOut: 0, method: 'Cash' },
    { time: '13:00', type: 'EXPENSE', ref: 'EXP-002', desc: 'Lunch Allowance', cashIn: 0, cashOut: 200, method: 'Cash' },
    { time: '14:20', type: 'SALE', ref: 'INV-005', desc: 'Retail Sale - Multiple Items', cashIn: 3400, cashOut: 0, method: 'Card' },
    { time: '15:00', type: 'PURCHASE', ref: 'PUR-002', desc: 'Office Supplies', cashIn: 0, cashOut: 800, method: 'Cash' },
    { time: '16:45', type: 'SALE', ref: 'INV-006', desc: 'Retail Sale - Item #3456', cashIn: 1800, cashOut: 0, method: 'Cash' },
    { time: '17:30', type: 'EXPENSE', ref: 'EXP-003', desc: 'Transportation', cashIn: 0, cashOut: 350, method: 'Cash' },
    { time: '18:00', type: 'SALE', ref: 'INV-007', desc: 'Final Sale - Item #7890', cashIn: 950, cashOut: 0, method: 'Cash' },
  ]

  // Add date to each transaction
  sampleTransactions.forEach((txn, index) => {
    const [hours, minutes] = txn.time.split(':')
    const txnDate = new Date(date)
    txnDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    
    transactions.push({
      id: `TXN-${String(index + 1).padStart(3, '0')}`,
      dateTime: txnDate.toISOString(),
      reference: txn.ref,
      type: txn.type,
      description: txn.desc,
      cashIn: txn.cashIn,
      cashOut: txn.cashOut,
      paymentMethod: txn.method,
    })
  })

  return {
    openingBalance,
    transactions: transactions.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime)),
  }
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

function getPaymentMethodIcon(method) {
  if (method === 'Cash') {
    return (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  }
  if (method === 'Card') {
    return (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )
  }
  return null
}

export default function Daybook() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)
  const [daybookData, setDaybookData] = useState(null)

  useEffect(() => {
    fetchDaybookData()
  }, [selectedDate])

  async function fetchDaybookData() {
    setLoading(true)
    try {
      // In real app, fetch from API:
      // const response = await axiosInstance.get(`/daybook?date=${selectedDate}`)
      // setDaybookData(response.data)
      
      // For now, use mock data
      const data = generateMockDaybookData(selectedDate)
      setDaybookData(data)
    } catch (err) {
      console.error('Failed to load daybook data:', err)
    } finally {
      setLoading(false)
    }
  }

  const summary = useMemo(() => {
    if (!daybookData) return { cashIn: 0, cashOut: 0, netFlow: 0, expectedDrawer: 0 }
    
    const cashIn = daybookData.transactions.reduce((sum, txn) => sum + (txn.cashIn || 0), 0)
    const cashOut = daybookData.transactions.reduce((sum, txn) => sum + (txn.cashOut || 0), 0)
    const netFlow = cashIn - cashOut
    const expectedDrawer = daybookData.openingBalance + netFlow
    
    return { cashIn, cashOut, netFlow, expectedDrawer }
  }, [daybookData])

  return (
    <PageShell>
      <div className="space-y-5">
        {/* Header Card with Date Picker */}
        <Card className="mx-auto max-w-6xl border-l-[6px] border-l-teal-500 p-3.5">
          <SectionHeader
            title="Daybook"
            description="Daily chronological log of all sales, purchases, and expenses"
            icon={<CalendarIcon className="h-6 w-6" />}
          />

          <SectionCard color="teal" title="Select Date">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1 max-w-xs">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const today = new Date()
                  setSelectedDate(today.toISOString().split('T')[0])
                }}
                className="rounded-lg bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700 transition hover:bg-teal-100"
              >
                Today
              </button>
              <button
                type="button"
                onClick={fetchDaybookData}
                disabled={loading}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </SectionCard>
        </Card>

        {/* Daily Summary Cards */}
        {daybookData && (
          <Card className="mx-auto max-w-6xl p-3.5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Cash In */}
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-teal-50 to-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  </div>
                  <span className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">Cash In</span>
                </div>
                <p className="text-[18px] font-bold text-teal-700">
                  PKR {summary.cashIn.toFixed(2)}
                </p>
                <p className="text-[11px] text-slate-400">Sales + Collections</p>
              </div>

              {/* Total Cash Out */}
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-teal-50 to-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                    </svg>
                  </div>
                  <span className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">Cash Out</span>
                </div>
                <p className="text-[18px] font-bold text-teal-700">
                  PKR {summary.cashOut.toFixed(2)}
                </p>
                <p className="text-[11px] text-slate-400">Purchases + Expenses</p>
              </div>

              {/* Net Flow */}
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-teal-50 to-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <span className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">Net Flow</span>
                </div>
                <p className="text-[18px] font-bold text-teal-700">
                  {summary.netFlow >= 0 ? '+' : '-'} PKR {Math.abs(summary.netFlow).toFixed(2)}
                </p>
                <p className="text-[11px] text-slate-400">In - Out</p>
              </div>

              {/* Expected Drawer Cash */}
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-teal-50 to-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">Drawer Cash</span>
                </div>
                <p className="text-[18px] font-bold text-teal-700">
                  PKR {summary.expectedDrawer.toFixed(2)}
                </p>
                <p className="text-[11px] text-slate-400">
                  Opening: PKR {daybookData?.openingBalance.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Transactions Table */}
        <Card className="mx-auto max-w-6xl p-3.5">
          <SectionHeader
            title="Transaction History"
            description={selectedDate ? `Transactions for ${new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}` : 'Select a date to view transactions'}
            icon={<ClockIcon className="h-6 w-6" />}
          />

          {!daybookData || daybookData.transactions.length === 0 ? (
            <TableState message={loading ? 'Loading transactions...' : 'No transactions found for this date'} />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="overflow-x-auto lg:max-h-[600px] lg:overflow-y-auto w-full">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Cash In (PKR)</th>
                      <th className="px-4 py-3 text-right">Cash Out (PKR)</th>
                      <th className="px-4 py-3">Payment Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {daybookData.transactions.map((txn) => (
                      <tr key={txn.id} className="text-sm border-t border-slate-50 transition hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-600">
                          <div className="font-medium text-slate-700">
                            {new Date(txn.dateTime).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(txn.dateTime).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[12px] font-medium text-slate-600">{txn.reference}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getTypeBadgeStyle(txn.type)}`}>
                            {txn.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate" title={txn.description}>
                          {txn.description}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {txn.cashIn > 0 ? (
                            <span className="font-medium text-teal-600">{txn.cashIn.toFixed(2)}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {txn.cashOut > 0 ? (
                            <span className="font-medium text-teal-600">{txn.cashOut.toFixed(2)}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                            {getPaymentMethodIcon(txn.paymentMethod)}
                            {txn.paymentMethod}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-semibold">
                    <tr>
                      <td className="px-4 py-3 text-slate-700" colSpan={4}>
                        Daily Totals
                      </td>
                      <td className="px-4 py-3 text-right text-teal-700">
                        {summary.cashIn.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-teal-700">
                        {summary.cashOut.toFixed(2)}
                      </td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  )
}
