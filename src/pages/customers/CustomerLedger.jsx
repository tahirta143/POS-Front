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

function BookIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

function SearchIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

// Generate mock transaction data for a customer
function generateMockTransactions(customer) {
  const transactions = []
  const paymentMethods = ['Cash', 'Credit Card', 'Online Transfer', 'Cheque']
  const descriptions = [
    'Purchase Invoice #INV-001',
    'Purchase Invoice #INV-002',
    'Payment Received',
    'Purchase Invoice #INV-003',
    'Credit Note Adjustment',
    'Purchase Invoice #INV-004',
    'Partial Payment',
    'Purchase Invoice #INV-005',
    'Refund Processed',
    'Purchase Invoice #INV-006',
  ]

  let runningBalance = parseFloat(customer?.previous_balance || 0)
  const openingBalance = runningBalance

  // Generate 10 transactions
  for (let i = 0; i < 10; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i * 3)
    
    const isDebit = i % 3 !== 1 // 2 out of 3 are debits (purchases)
    const amount = Math.round((Math.random() * 5000 + 500) * 100) / 100
    
    let debit = 0
    let credit = 0
    
    if (isDebit) {
      debit = amount
      runningBalance += amount
    } else {
      credit = amount
      runningBalance -= amount
    }

    transactions.push({
      id: `TXN-${String(1000 + i).slice(1)}-${Date.now().toString().slice(-4)}`,
      dateTime: date.toISOString(),
      description: descriptions[i],
      transactionType: isDebit ? 'Debit' : 'Credit',
      debit: debit,
      credit: credit,
      balance: runningBalance,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
    })
  }

  return {
    openingBalance,
    transactions: transactions.reverse(), // Oldest first
    closingBalance: runningBalance,
  }
}

export default function CustomerLedger() {
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ledgerData, setLedgerData] = useState(null)

  // Credit limit constant
  const CREDIT_LIMIT = 50000

  useEffect(() => {
    fetchCustomers()
  }, [])

  async function fetchCustomers() {
    setLoading(true)
    try {
      const response = await axiosInstance.get('/customers')
      const data = response.data
      setCustomers(Array.isArray(data) ? data : data.data || [])
    } catch (err) {
      console.error('Failed to load customers:', err)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = customers.filter(c => 
        c.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.mobile_number?.includes(searchQuery)
      )
      setFilteredCustomers(filtered)
      setShowDropdown(true)
    } else {
      setFilteredCustomers([])
      setShowDropdown(false)
    }
  }, [searchQuery, customers])

  function handleCustomerSelect(customer) {
    setSelectedCustomer(customer)
    setSearchQuery(customer.customer_name)
    setShowDropdown(false)
    
    // Generate ledger data for selected customer
    const data = generateMockTransactions(customer)
    setLedgerData(data)
  }

  function clearSelection() {
    setSelectedCustomer(null)
    setSearchQuery('')
    setLedgerData(null)
    setShowDropdown(false)
  }

  const outstandingBalance = ledgerData?.closingBalance || 0
  const creditRemaining = Math.max(0, CREDIT_LIMIT - outstandingBalance)
  const creditUsedPercent = Math.min(100, (outstandingBalance / CREDIT_LIMIT) * 100)

  return (
    <PageShell>
      <div className="space-y-5">
        {/* Header Card */}
        <Card className="mx-auto max-w-6xl border-l-[6px] border-l-teal-500 p-3.5">
          <SectionHeader
            title="Customer Ledger"
            description="View complete transaction history and account balance for customers"
            icon={<BookIcon className="h-6 w-6" />}
          />

          {/* Customer Search */}
          <SectionCard color="teal" title="Select Customer">
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by customer name or mobile number..."
                    className="h-10 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-[13px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                  <div className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <SearchIcon className="h-4 w-4" />
                  </div>
                </div>
                {selectedCustomer && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Dropdown */}
              {showDropdown && filteredCustomers.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full px-4 py-2 text-left text-[13px] hover:bg-teal-50 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-medium text-slate-800">{customer.customer_name}</span>
                        <span className="ml-2 text-slate-500">{customer.mobile_number}</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        Balance: PKR {parseFloat(customer.previous_balance || 0).toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {showDropdown && filteredCustomers.length === 0 && searchQuery.trim() && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white py-3 text-center shadow-lg">
                  <span className="text-[13px] text-slate-500">No customers found</span>
                </div>
              )}
            </div>
          </SectionCard>
        </Card>

        {/* Summary Cards - Only show when customer is selected */}
        {selectedCustomer && ledgerData && (
          <Card className="mx-auto max-w-6xl p-3.5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Customer Info */}
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-teal-50 to-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">Customer</span>
                </div>
                <p className="text-[15px] font-semibold text-slate-800 truncate">{selectedCustomer.customer_name}</p>
                <p className="text-[12px] text-slate-500">{selectedCustomer.mobile_number || 'No phone'}</p>
              </div>

              {/* Opening Balance */}
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">Opening Balance</span>
                </div>
                <p className="text-[18px] font-bold text-slate-800">
                  PKR {ledgerData.openingBalance.toFixed(2)}
                </p>
                <p className="text-[11px] text-slate-400">As of start date</p>
              </div>

              {/* Outstanding Balance */}
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-teal-50 to-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">Outstanding</span>
                </div>
                <p className="text-[18px] font-bold text-teal-700">
                  PKR {Math.abs(outstandingBalance).toFixed(2)}
                </p>
                <p className="text-[11px] text-slate-400">
                  {outstandingBalance >= 0 ? 'Amount Due' : 'Credit Balance'}
                </p>
              </div>

              {/* Credit Limit */}
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-teal-50 to-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">Credit Limit</span>
                </div>
                <p className="text-[18px] font-bold text-teal-700">
                  PKR {CREDIT_LIMIT.toFixed(2)}
                </p>
                <div className="mt-1">
                  <div className="h-1.5 w-full rounded-full bg-slate-200">
                    <div 
                      className="h-1.5 rounded-full transition-all bg-teal-500"
                      style={{ width: `${creditUsedPercent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">
                    PKR {creditRemaining.toFixed(2)} remaining
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Ledger Table */}
        <Card className="mx-auto max-w-6xl p-3.5">
          <SectionHeader
            title="Transaction History"
            description={selectedCustomer ? `Showing transactions for ${selectedCustomer.customer_name}` : 'Select a customer to view their ledger'}
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />

          {!selectedCustomer ? (
            <TableState message="Please search and select a customer to view their ledger" />
          ) : loading ? (
            <TableState message="Loading ledger data..." />
          ) : ledgerData?.transactions.length === 0 ? (
            <TableState message="No transactions found for this customer" />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="overflow-x-auto lg:max-h-[600px] lg:overflow-y-auto w-full">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                      <th className="px-4 py-3">Date & Time</th>
                      <th className="px-4 py-3">Transaction ID</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3 text-right">Debit (+)</th>
                      <th className="px-4 py-3 text-right">Credit (-)</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                      <th className="px-4 py-3">Payment Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {/* Opening Balance Row */}
                    <tr className="text-sm border-t border-slate-50 bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-400">-</td>
                      <td className="px-4 py-3 text-slate-400">-</td>
                      <td className="px-4 py-3 font-medium text-slate-600">Opening Balance</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600">
                          B/F
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400">-</td>
                      <td className="px-4 py-3 text-right text-slate-400">-</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700">
                        PKR {ledgerData.openingBalance.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-400">-</td>
                    </tr>

                    {ledgerData.transactions.map((txn, index) => (
                      <tr key={txn.id} className="text-sm border-t border-slate-50 transition hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-600">
                          <div className="font-medium text-slate-700">
                            {new Date(txn.dateTime).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(txn.dateTime).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[12px] text-slate-600">{txn.id}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{txn.description}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                            txn.transactionType === 'Debit' 
                              ? 'bg-teal-100 text-teal-700' 
                              : 'bg-teal-50 text-teal-600'
                          }`}>
                            {txn.transactionType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {txn.debit > 0 ? (
                            <span className="font-medium text-teal-700">+ PKR {txn.debit.toFixed(2)}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {txn.credit > 0 ? (
                            <span className="font-medium text-teal-600">- PKR {txn.credit.toFixed(2)}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">
                          PKR {txn.balance.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                            {txn.paymentMethod === 'Cash' && (
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            )}
                            {txn.paymentMethod === 'Credit Card' && (
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                            )}
                            {txn.paymentMethod}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {/* Closing Balance Row */}
                    <tr className="text-sm border-t-2 border-slate-200 bg-teal-50/30 font-semibold">
                      <td className="px-4 py-3 text-slate-600" colSpan={2}>
                        Closing Balance
                      </td>
                      <td className="px-4 py-3" colSpan={4}></td>
                      <td className="px-4 py-3 text-right text-teal-700">
                        PKR {ledgerData.closingBalance.toFixed(2)}
                      </td>
                      <td className="px-4 py-3"></td>
                    </tr>
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
