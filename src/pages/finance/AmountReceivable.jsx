import { useEffect, useState, useMemo } from 'react';
import { Card, PageShell, SectionHeader, TableState } from '../../components/layout/PageShell.jsx';
import FallbackNotice from '../../components/layout/FallbackNotice.jsx';
import axiosInstance from '../../services/axiosInstance';

function MoneyIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CustomerIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
      // Fetch customers and sales invoices in parallel
      const [customersResponse, salesResponse] = await Promise.all([
        axiosInstance.get('/customers'),
        axiosInstance.get('/sale-invoices'),
      ]);

      const customers = customersResponse.data || [];
      const salesInvoices = salesResponse.data || [];

      // Calculate dues per customer
      const customerDuesMap = new Map();

      // Initialize map with customer data
      customers.forEach(customer => {
        customerDuesMap.set(customer.id, {
          id: customer.id,
          customerName: customer.customer_name,
          mobileNumber: customer.mobile_number,
          openingBalance: parseFloat(customer.previous_balance || 0),
          totalToBePaid: 0,
          totalPaid: 0,
          invoices: []
        });
      });

      // Process each sale invoice
      salesInvoices.forEach(invoice => {
        const customerId = invoice.customer_id;
        if (!customerId) return;

        const customerData = customerDuesMap.get(customerId);
        if (!customerData) return;

        // Extract amounts from invoice
        const toBePaid = parseFloat(invoice.to_be_paid || 0);
        const paid = parseFloat(invoice.paid || 0);
        const payable = parseFloat(invoice.payable || 0);
        const discount = parseFloat(invoice.discount || 0);
        const subTotal = parseFloat(invoice.sub_total || 0);

        // Track total to_be_paid for this customer
        customerData.totalToBePaid += toBePaid;
        customerData.totalPaid += paid;
        
        // Store invoice details for reference
        customerData.invoices.push({
          id: invoice.id,
          receiptNo: invoice.receipt_no,
          subTotal: subTotal,
          discount: discount,
          payable: payable,
          paid: paid,
          toBePaid: toBePaid,
          createdAt: invoice.created_at,
          items: invoice.items || []
        });
      });

      // Calculate final outstanding amount
      const receivablesList = Array.from(customerDuesMap.values())
        .map(customer => {
          // Outstanding = Opening Balance + Total To Be Paid
          const outstanding = customer.openingBalance + customer.totalToBePaid;
          
          return {
            ...customer,
            outstanding: outstanding,
            totalInvoices: customer.invoices.length,
            unpaidInvoices: customer.invoices.filter(inv => inv.toBePaid > 0).length
          };
        })
        .filter(customer => customer.outstanding > 0) // Only show customers with dues
        .sort((a, b) => b.outstanding - a.outstanding); // Sort by highest dues first

      setReceivables(receivablesList);
    } catch (error) {
      console.error('Error fetching receivables:', error);
      setReceivables([]);
    } finally {
      setLoading(false);
    }
  }

  const totalReceivable = useMemo(() => {
    return receivables.reduce((sum, r) => sum + (Number(r.outstanding) || 0), 0);
  }, [receivables]);

  const filteredReceivables = useMemo(() => {
    if (!search.trim()) return receivables;
    return receivables.filter(r => 
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      r.mobileNumber?.includes(search)
    );
  }, [receivables, search]);

  return (
    <PageShell
      title="Amount Receivable"
      description="Overview of outstanding dues from customers based on unpaid invoices."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 border-l-[6px] border-l-teal-500 bg-gradient-to-br from-teal-50/50 to-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-100 rounded-xl text-teal-600">
                <MoneyIcon className="h-8 w-8" />
              </div>
              <div>
                <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">Total Receivable</p>
                <p className="mt-2 text-2xl font-bold text-teal-700">
                  PKR {totalReceivable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 border-l-[6px] border-l-teal-500 bg-gradient-to-br from-teal-50/50 to-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-100 rounded-xl text-teal-600">
                <CustomerIcon className="h-8 w-8" />
              </div>
              <div>
                <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">Customers with Dues</p>
                <p className="mt-2 text-2xl font-bold text-teal-700">{receivables.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-l-[6px] border-l-teal-500 bg-gradient-to-br from-teal-50/50 to-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-100 rounded-xl text-teal-600">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">Average Due per Customer</p>
                <p className="mt-2 text-2xl font-bold text-teal-700">
                  PKR {receivables.length > 0 ? (totalReceivable / receivables.length).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                </p>
              </div>
            </div>
          </Card>
        </div>


        {/* Search Bar */}
        <Card className="p-4 border-l-[6px] border-l-teal-500">
          <div className="relative">
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search by customer name or mobile number..." 
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-4 pl-10 text-[13px] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </Card>

        {/* Receivables Table */}
        <Card className="overflow-hidden shadow-md">
          <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-teal-50/30 to-white">
            <SectionHeader
              title="Customer Dues Details"
              description="List of customers with outstanding payments"
              icon={<MoneyIcon className="h-5 w-5" />}
              action={
                <button
                  type="button"
                  onClick={fetchReceivables}
                  disabled={loading}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 hover:border-teal-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              }
            />
          </div>
          
          <div className="overflow-x-auto w-full max-h-[500px]">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4 text-left">Customer Name</th>
                  <th className="px-6 py-4 text-left">Contact</th>
                  <th className="px-6 py-4 text-right">Opening Balance</th>
                  <th className="px-6 py-4 text-right">Unpaid Invoices</th>
                  <th className="px-6 py-4 text-right">Total Outstanding</th>
                  <th className="px-6 py-4 text-center">Status</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="6">
                      <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                        <span className="ml-3 text-slate-600">Loading receivables...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredReceivables.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <TableState message={search ? 'No matching customers found.' : 'No outstanding receivables found.'} />
                    </td>
                  </tr>
                ) : (
                  filteredReceivables.map((customer, idx) => (
                    <tr key={customer.id || idx} className="text-sm transition-all hover:bg-teal-50/30 group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{customer.customerName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {customer.totalInvoices} invoice{customer.totalInvoices !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-[12px] font-mono">
                        {customer.mobileNumber || '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-700">
                        PKR {customer.openingBalance.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1">
                          <span className="font-bold text-amber-600">{customer.unpaidInvoices}</span>
                          <span className="text-[10px] text-slate-400">
                            {customer.unpaidInvoices > 0 && `(${customer.totalToBePaid.toFixed(2)})`}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-teal-600 text-base">
                          PKR {customer.outstanding.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          customer.outstanding > 1000 
                            ? 'bg-red-100 text-red-700' 
                            : customer.outstanding > 0 
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {customer.outstanding > 0 ? 'PENDING' : 'PAID'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {!loading && filteredReceivables.length > 0 && (
                <tfoot className="bg-slate-50 border-t border-slate-200">
                  <tr className="text-sm font-semibold">
                    <td colSpan="4" className="px-6 py-4 text-right text-slate-700">
                      Total Receivable:
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-lg font-bold text-teal-700">
                        PKR {totalReceivable.toFixed(2)}
                      </span>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>


      </div>
    </PageShell>
  );
}