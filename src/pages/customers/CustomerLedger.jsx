import { useEffect, useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import { Card, Field, PageShell, SectionHeader, TableState } from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance'

const sectionStyles = {
  teal: { accent: 'bg-teal-500', header: 'border-teal-100 bg-teal-50/80' },
}

function SectionCard({ color, title, children }) {
  const style = sectionStyles[color] ?? sectionStyles.teal
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

export default function CustomerLedger() {
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [tableSearch, setTableSearch] = useState('')

  const CREDIT_LIMIT = 50000

  useEffect(() => {
    fetchCustomers()
  }, [])

  async function fetchCustomers() {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/customers');
      const data = response.data;
      setCustomers(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error('Failed to load customers.');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (searchQuery.trim() && !selectedCustomer) {
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
  }, [searchQuery, customers, selectedCustomer])

  async function handleCustomerSelect(customer) {
    setSelectedCustomer(customer)
    setSearchQuery(customer.customer_name)
    setShowDropdown(false)
    
    setLoading(true);
    try {
        const response = await axiosInstance.get(`/customer-ledger/${customer.id}`);
        setTransactions(response.data || []);
    } catch (err) {
        toast.error('Failed to load ledger.');
    } finally {
        setLoading(false);
    }
  }

  function clearSelection() {
    setSelectedCustomer(null)
    setSearchQuery('')
    setTransactions([])
    setShowDropdown(false)
  }

  const filteredTransactions = transactions.filter(t => 
    t.description?.toLowerCase().includes(tableSearch.toLowerCase()) ||
    t.id?.toLowerCase().includes(tableSearch.toLowerCase())
  );

  const openingBalance = parseFloat(selectedCustomer?.previous_balance || 0);
  const closingBalance = transactions.reduce((acc, curr) => acc + (Number(curr.debit) || 0) - (Number(curr.credit) || 0), openingBalance);
  const creditRemaining = Math.max(0, CREDIT_LIMIT - closingBalance)
  const creditUsedPercent = Math.min(100, (closingBalance / CREDIT_LIMIT) * 100)

  return (
    <PageShell title="Customer Ledger" description="View transaction history and balance" accent="from-teal-600 via-emerald-600 to-cyan-700">
      <div className="space-y-4 max-w-6xl mx-auto">
        <Card className="border-l-[6px] border-l-teal-500 p-3">
          <SectionHeader title="Customer Selection" description="Select a customer to view record" icon={<BookIcon className="h-5 w-5" />} />
          <SectionCard title="Search Customer">
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); if(selectedCustomer) setSelectedCustomer(null); }}
                    placeholder="Search by customer name or mobile..."
                    className="h-8 w-full rounded-md border border-slate-300 bg-white pl-8 pr-2 text-[11px] outline-none focus:border-teal-400"
                  />
                  <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
                {selectedCustomer && (
                  <button onClick={clearSelection} className="rounded-lg border px-3 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition">Clear</button>
                )}
              </div>

              {showDropdown && filteredCustomers.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg max-h-40 overflow-y-auto">
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full px-3 py-1.5 text-left text-[11px] hover:bg-teal-50 flex items-center justify-between border-b last:border-0"
                    >
                      <div>
                        <span className="font-medium text-slate-800">{customer.customer_name}</span>
                        <span className="ml-2 text-slate-500 text-[10px]">{customer.mobile_number}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">PKR {parseFloat(customer.previous_balance || 0).toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        </Card>

        {selectedCustomer && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
               <Card className="p-3 bg-gradient-to-br from-teal-50 to-white">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Customer</span>
                  <p className="text-[13px] font-bold text-slate-800 truncate">{selectedCustomer.customer_name}</p>
               </Card>
               <Card className="p-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Opening</span>
                  <p className="text-[13px] font-bold text-slate-800">PKR {openingBalance.toFixed(2)}</p>
               </Card>
               <Card className="p-3">
                  <span className="text-[10px] font-bold text-teal-600 uppercase">Current Balance</span>
                  <p className="text-[13px] font-bold text-teal-700">PKR {closingBalance.toFixed(2)}</p>
               </Card>
               <Card className="p-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Credit Used</span>
                  <div className="mt-1 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-teal-500" style={{ width: `${creditUsedPercent}%` }} />
                  </div>
               </Card>
            </div>

            <Card className="p-2 border-l-[4px] border-l-teal-500">
               <input 
                type="text" 
                value={tableSearch} 
                onChange={(e) => setTableSearch(e.target.value)} 
                placeholder="Search history..." 
                className="h-7 w-full rounded border border-slate-200 px-2 text-[11px] outline-none focus:border-teal-400" 
               />
            </Card>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto w-full max-h-[400px]">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2 text-right">Debit (+)</th>
                      <th className="px-3 py-2 text-right">Credit (-)</th>
                      <th className="px-3 py-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredTransactions.length === 0 ? (
                      <tr><td colSpan="5"><TableState message={loading ? 'Loading...' : 'No records.'} /></td></tr>
                    ) : (
                      filteredTransactions.map((txn, idx) => (
                        <tr key={idx} className="text-[11px] hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-500">{new Date(txn.dateTime).toLocaleDateString()}</td>
                          <td className="px-3 py-2 text-slate-700">{txn.description}</td>
                          <td className="px-3 py-2 text-right text-teal-700 font-medium">{txn.debit > 0 ? txn.debit.toFixed(2) : '-'}</td>
                          <td className="px-3 py-2 text-right text-teal-600">{txn.credit > 0 ? txn.credit.toFixed(2) : '-'}</td>
                          <td className="px-3 py-2 text-right font-bold text-slate-800">{txn.balance.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </PageShell>
  )
}
