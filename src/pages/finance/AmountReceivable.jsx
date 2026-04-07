import { useEffect, useState, useMemo } from 'react';
import { Card, PageShell, SectionHeader, TableState } from '../../components/layout/PageShell.jsx';
import FallbackNotice from '../../components/layout/FallbackNotice.jsx';
import axiosInstance from '../../services/axiosInstance';
import { getCustomerPayments, getSalesReturns } from '../../utils/transactionStore.js';

function MoneyIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function AmountReceivablePage() {
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchReceivables();
  }, []);

  async function fetchReceivables() {
    setLoading(true);
    try {
      const [customersResponse, salesResponse] = await Promise.all([
        axiosInstance.get('/customers'),
        axiosInstance.get('/sale-invoices').catch(() => ({ data: [] })),
      ]);
      const data = customersResponse.data;
      const salesData = salesResponse.data;
      const customers = Array.isArray(data) ? data : data.data || [];
      const salesList = Array.isArray(salesData) ? salesData : salesData.data || [];
      const collected = getCustomerPayments();
      const returns = getSalesReturns();
      
      const list = customers
        .map(c => ({
          id: c.id,
          customer_name: c.customer_name,
          mobile_number: c.mobile_number,
          opening_balance: parseFloat(c.previous_balance || 0),
          invoices_due: salesList
            .filter((sale) => String(sale.customer_id) === String(c.id))
            .reduce((sum, sale) => sum + Math.max(0, Number(sale.payable || 0) - Number(sale.given_amount || 0)), 0),
          collected_frontend: collected
            .filter((payment) => String(payment.customerId) === String(c.id))
            .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
          return_credit: returns
            .filter((record) => String(record.customerId) === String(c.id))
            .reduce((sum, record) => sum + Number(record.totalReturn || 0), 0),
        }))
        .map((customer) => ({
          ...customer,
          amount: Math.max(0, customer.opening_balance + customer.invoices_due - customer.collected_frontend - customer.return_credit),
        }))
        .filter(c => c.amount > 0);
      
      setReceivables(list);
    } catch {
      setReceivables([]);
    } finally {
      setLoading(false);
    }
  }

  const totalReceivable = useMemo(() => {
    return receivables.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }, [receivables]);

  const filteredReceivables = useMemo(() => {
    return receivables.filter(r => r.customer_name.toLowerCase().includes(search.toLowerCase()));
  }, [receivables, search]);

  return (
    <PageShell
      title="Amount Receivable"
      description="Overview of outstanding dues from customers."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="p-6 border-l-[6px] border-l-teal-500 bg-teal-50/30">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-100 rounded-xl text-teal-600">
                <MoneyIcon className="h-8 w-8" />
              </div>
              <div>
                <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">Total Amount Receivable</p>
                <p className="mt-2 text-2xl font-bold text-teal-700">PKR {totalReceivable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 border-l-[6px] border-l-teal-500 bg-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-100 rounded-xl text-teal-600">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <div>
                <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">Customers with Dues</p>
                <p className="mt-2 text-2xl font-bold text-teal-700">{receivables.length}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-4 border-l-[6px] border-l-teal-500">
          <FallbackNotice message="Receivable balances are currently derived in the frontend from customer balances, invoices, returns, and local payment history." />
        </Card>

        <Card className="p-4 border-l-[6px] border-l-teal-500">
           <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search customer..." 
            className="h-8 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] outline-none focus:border-teal-400" 
           />
        </Card>

        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <SectionHeader
              title="Customer Dues"
              description="Outstanding receivable balances grouped by customer."
              icon={<MoneyIcon className="h-5 w-5" />}
              action={
                <button
                  type="button"
                  onClick={fetchReceivables}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Refresh
                </button>
              }
            />
          </div>
          <div className="overflow-x-auto w-full max-h-[400px]">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4 text-right">Invoices Due</th>
                  <th className="px-6 py-4 text-right">Outstanding Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredReceivables.length === 0 ? (
                  <tr>
                    <td colSpan="4">
                      <TableState message={loading ? 'Loading...' : 'No outstanding receivables.'} />
                    </td>
                  </tr>
                ) : (
                  filteredReceivables.map((r, idx) => (
                    <tr key={idx} className="text-sm transition hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-800">{r.customer_name}</td>
                      <td className="px-6 py-4 text-slate-600 text-xs">{r.mobile_number || '-'}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-700">PKR {Number(r.invoices_due).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-bold text-teal-600">PKR {Number(r.amount).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
