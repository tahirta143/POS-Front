import { useEffect, useState } from 'react';
import { Card, Field, PageShell, SectionHeader, TableState } from '../../components/layout/PageShell.jsx';
import axiosInstance from '../../services/axiosInstance';
import { toast } from 'react-toastify';

function LedgerIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

export default function SupplierLedgerPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (selectedSupplierId) {
      fetchLedger(selectedSupplierId);
    } else {
      setTransactions([]);
    }
  }, [selectedSupplierId]);

  async function fetchSuppliers() {
    try {
      const response = await axiosInstance.get('/suppliers');
      const data = response.data;
      setSuppliers(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error('Failed to load suppliers.');
    }
  }

  async function fetchLedger(id) {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/supplier-ledger/${id}`);
      const data = response.data;
      setTransactions(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error('Failed to load ledger data.');
    } finally {
      setLoading(false);
    }
  }

  const filteredTransactions = transactions.filter(t => 
    t.reference?.toLowerCase().includes(search.toLowerCase()) || 
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  const closingBalance = transactions.reduce((acc, curr) => acc + (Number(curr.debit) || 0) - (Number(curr.credit) || 0), 0);

  return (
    <PageShell
      title="Supplier Ledger"
      description="Detailed transaction history for individual suppliers."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-6 max-w-6xl mx-auto">
        <Card className="p-4 border-l-[6px] border-l-teal-500 bg-white shadow-sm">
          <SectionHeader title="Account Selection" description="Select a supplier to view their financial statement." icon={<LedgerIcon className="h-5 w-5" />} />
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
