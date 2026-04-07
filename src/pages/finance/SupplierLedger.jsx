import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Field, PageShell, SectionHeader, TableState } from '../../components/layout/PageShell.jsx';
import FallbackNotice from '../../components/layout/FallbackNotice.jsx';
import axiosInstance from '../../services/axiosInstance';
import { toast } from 'react-toastify';
import { getPurchaseReturns, getSupplierPayments } from '../../utils/transactionStore.js';

function LedgerIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

export default function SupplierLedgerPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    try {
      const [suppliersResponse, purchasesResponse] = await Promise.all([
        axiosInstance.get('/suppliers'),
        axiosInstance.get('/purchases').catch(() => ({ data: [] })),
      ]);
      const suppliersData = suppliersResponse.data;
      const purchasesData = purchasesResponse.data;
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : suppliersData.data || []);
      setPurchases(Array.isArray(purchasesData) ? purchasesData : purchasesData.data || []);
    } catch {
      toast.error('Failed to load suppliers.');
    }
  }

  const fetchLedger = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/supplier-ledger/${id}`);
      const data = response.data;
      setTransactions(Array.isArray(data) ? data : data.data || []);
    } catch {
      const selectedSupplier = suppliers.find((supplier) => String(supplier.id) === String(id));
      const opening = Number(selectedSupplier?.previous_balance || 0);

      const purchaseRows = purchases
        .filter((purchase) => String(purchase.supplier_id) === String(id))
        .map((purchase) => ({
          date: purchase.grn_date,
          reference: purchase.grn_no || purchase.invoice_no || `PUR-${purchase.id}`,
          description: `Purchase invoice${purchase.invoice_no ? ` ${purchase.invoice_no}` : ''}`,
          debit: Math.max(0, Number(purchase.payable || 0) - Number(purchase.paid_amount || 0)),
          credit: 0,
        }));

      const paymentRows = getSupplierPayments()
        .filter((payment) => String(payment.supplierId) === String(id))
        .map((payment) => ({
          date: payment.date,
          reference: payment.id,
          description: `Supplier payment by ${payment.method}`,
          debit: 0,
          credit: Number(payment.amount || 0),
        }));

      const returnRows = getPurchaseReturns()
        .filter((record) => String(record.supplierId) === String(id))
        .map((record) => ({
          date: record.date,
          reference: record.id,
          description: `Purchase return against ${record.grnNo || record.invoiceNo || 'purchase'}`,
          debit: 0,
          credit: Number(record.totalReturn || 0),
        }));

      const merged = [
        {
          date: selectedSupplier?.created_at || new Date().toISOString().slice(0, 10),
          reference: 'OPENING',
          description: 'Opening balance',
          debit: opening,
          credit: 0,
        },
        ...purchaseRows,
        ...paymentRows,
        ...returnRows,
      ]
        .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
      let runningBalance = 0
      const withBalances = merged.map((row) => {
        runningBalance += Number(row.debit || 0) - Number(row.credit || 0)
        return { ...row, balance: runningBalance }
      })

      setTransactions(withBalances);
    } finally {
      setLoading(false);
    }
  }, [purchases, suppliers])

  useEffect(() => {
    if (selectedSupplierId) {
      fetchLedger(selectedSupplierId);
    } else {
      setTransactions([]);
    }
  }, [fetchLedger, selectedSupplierId]);

  const filteredTransactions = transactions.filter(t =>
    t.reference?.toLowerCase().includes(search.toLowerCase()) || 
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedSupplier = useMemo(
    () => suppliers.find((supplier) => String(supplier.id) === String(selectedSupplierId)),
    [selectedSupplierId, suppliers]
  );

  const closingBalance = filteredTransactions.length > 0
    ? Number(filteredTransactions[filteredTransactions.length - 1]?.balance || 0)
    : Number(selectedSupplier?.previous_balance || 0);

  return (
    <PageShell
      title="Supplier Ledger"
      description="Detailed transaction history for individual suppliers."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-6 max-w-6xl mx-auto">
        <Card className="p-4 border-l-[6px] border-l-teal-500 bg-white shadow-sm">
          <SectionHeader title="Account Selection" description="Select a supplier to view their financial statement." icon={<LedgerIcon className="h-5 w-5" />} />
          <div className="mt-4">
            <FallbackNotice message="Supplier ledger falls back to frontend-calculated balances when the backend supplier-ledger route is unavailable." />
          </div>
          <div className="mt-4 max-w-md">
            <Field label="Supplier Name">
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-500"
              >
                <option value="">-- Select Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.supplier_name}</option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        {selectedSupplierId && (
          <>
            <Card className="p-4 border-l-[6px] border-l-teal-500">
               <input 
                type="text" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Search reference or description..." 
                className="h-8 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] outline-none focus:border-teal-400" 
               />
            </Card>

            <Card className="overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-700">Statement of Account</h3>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">Outstanding Balance</span>
                  <span className={`text-xl font-black ${closingBalance >= 0 ? 'text-teal-600' : 'text-emerald-600'}`}>
                    PKR {Math.abs(closingBalance).toFixed(2)} {closingBalance >= 0 ? '(DR)' : '(CR)'}
                  </span>
                </div>
              </div>
              
              <div className="overflow-x-auto w-full max-h-[450px]">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Reference / Invoice</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4 text-right">Debit (+)</th>
                      <th className="px-6 py-4 text-right">Credit (-)</th>
                      <th className="px-6 py-4 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="6">
                          <TableState message={loading ? 'Loading transactions...' : 'No transactions found.'} />
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((txn, idx) => {
                        return (
                          <tr key={idx} className="text-sm transition hover:bg-slate-50">
                            <td className="px-6 py-4 text-slate-600 font-mono text-xs">{txn.date}</td>
                            <td className="px-6 py-4 font-bold text-slate-700">{txn.reference}</td>
                            <td className="px-6 py-4 text-slate-600 text-xs">{txn.description}</td>
                            <td className="px-6 py-4 text-right text-rose-600 font-semibold">{txn.debit > 0 ? txn.debit.toFixed(2) : '-'}</td>
                            <td className="px-6 py-4 text-right text-emerald-600 font-semibold">{txn.credit > 0 ? txn.credit.toFixed(2) : '-'}</td>
                            <td className="px-6 py-4 text-right font-bold text-slate-800">{txn.balance ? txn.balance.toFixed(2) : '-'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </PageShell>
  );
}
