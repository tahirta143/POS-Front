import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const [suppliers, setSuppliers]           = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [ledgerData, setLedgerData]         = useState(null); // { supplier, ledger, closingBalance }
  const [loading, setLoading]               = useState(false);
  const [search, setSearch]                 = useState('');

  useEffect(() => { fetchSuppliers(); }, []);

  async function fetchSuppliers() {
    try {
      const res = await axiosInstance.get('/suppliers');
      setSuppliers(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch {
      toast.error('Failed to load suppliers.');
    }
  }

  const fetchLedger = useCallback(async (id) => {
    if (!id) { setLedgerData(null); return; }
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/supplier-ledger/${id}`);
      setLedgerData(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load ledger.');
      setLedgerData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLedger(selectedSupplierId);
    setSearch('');
  }, [selectedSupplierId, fetchLedger]);

  const filteredLedger = useMemo(() => {
    if (!ledgerData?.ledger) return [];
    const q = search.toLowerCase();
    if (!q) return ledgerData.ledger;
    return ledgerData.ledger.filter(
      t => t.reference?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
    );
  }, [ledgerData, search]);

  const closingBalance = ledgerData?.closingBalance ?? 0;

  // Summary totals
  const totalDebit  = useMemo(() => filteredLedger.reduce((s, r) => s + (r.debit  || 0), 0), [filteredLedger]);
  const totalCredit = useMemo(() => filteredLedger.reduce((s, r) => s + (r.credit || 0), 0), [filteredLedger]);

  return (
    <PageShell
      title="Supplier Ledger"
      description="Detailed transaction history for individual suppliers."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-5 max-w-6xl mx-auto">

        {/* Supplier Selector */}
        <Card className="p-5 border-l-[6px] border-l-teal-500">
          <SectionHeader
            title="Account Selection"
            description="Select a supplier to view their statement of account."
            icon={<LedgerIcon className="h-5 w-5" />}
          />
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <Field label="Supplier">
              <select
                value={selectedSupplierId}
                onChange={e => setSelectedSupplierId(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-500"
              >
                <option value="">— Select Supplier —</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.supplier_name}</option>
                ))}
              </select>
            </Field>
            {selectedSupplierId && (
              <button
                type="button"
                onClick={() => fetchLedger(selectedSupplierId)}
                className="h-9 rounded-md border border-slate-200 px-4 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                ↻ Reload Ledger
              </button>
            )}
          </div>
        </Card>

        {/* Summary Cards — shown only when data is loaded */}
        {ledgerData && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Purchases (Debit)',  value: totalDebit,   color: 'border-l-rose-400',    text: 'text-rose-600'    },
              { label: 'Total Payments (Credit)',  value: totalCredit,  color: 'border-l-emerald-400', text: 'text-emerald-600' },
              { label: 'Net Outstanding Balance',  value: Math.abs(closingBalance), color: 'border-l-teal-500', text: closingBalance > 0 ? 'text-rose-600' : 'text-emerald-600' },
            ].map(({ label, value, color, text }) => (
              <Card key={label} className={`p-4 border-l-[6px] ${color}`}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                <p className={`mt-1 text-xl font-black font-mono ${text}`}>
                  PKR {value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                {label.includes('Outstanding') && (
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                    {closingBalance > 0 ? 'Amount owed to supplier' : closingBalance < 0 ? 'Overpaid / credit' : 'Fully settled'}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Ledger Table */}
        {selectedSupplierId && (
          <Card className="overflow-hidden p-0">
            {/* Table Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-[14px] font-bold text-slate-800">
                  Statement of Account — {ledgerData?.supplier?.supplier_name || ''}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {filteredLedger.length} transaction{filteredLedger.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter by reference or description..."
                  className="h-8 w-56 rounded-lg border border-slate-200 bg-white px-3 text-[12px] outline-none focus:border-teal-400 transition"
                />
                {/* Closing balance badge */}
                <div className="text-right shrink-0">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">Balance</span>
                  <span className={`text-base font-black font-mono ${closingBalance > 0 ? 'text-rose-600' : closingBalance < 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                    PKR {Math.abs(closingBalance).toFixed(2)}
                    <span className="ml-1 text-[10px] font-bold">{closingBalance > 0 ? 'DR' : closingBalance < 0 ? 'CR' : ''}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-white sticky top-0 shadow-[0_1px_0_0_#f1f5f9]">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3 text-right">Debit (+)</th>
                    <th className="px-5 py-3 text-right">Credit (−)</th>
                    <th className="px-5 py-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {loading ? (
                    <tr><td colSpan="6"><TableState message="Loading ledger..." /></td></tr>
                  ) : filteredLedger.length === 0 ? (
                    <tr><td colSpan="6"><TableState message="No transactions found." /></td></tr>
                  ) : (
                    filteredLedger.map((txn, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors text-sm">
                        <td className="px-5 py-3 text-[11px] font-mono text-slate-500 whitespace-nowrap">
                          {txn.date || '—'}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-[11px] font-bold font-mono ${txn.reference === 'OPENING' ? 'text-amber-600' : 'text-slate-700'}`}>
                            {txn.reference}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[12px] text-slate-500">{txn.description}</td>
                        <td className="px-5 py-3 text-right font-semibold text-rose-600 font-mono text-[12px]">
                          {txn.debit  > 0 ? `PKR ${txn.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-emerald-600 font-mono text-[12px]">
                          {txn.credit > 0 ? `PKR ${txn.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td className={`px-5 py-3 text-right font-bold font-mono text-[12px] ${txn.balance > 0 ? 'text-rose-700' : txn.balance < 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                          PKR {Math.abs(txn.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          {txn.balance !== 0 && (
                            <span className="ml-1 text-[9px] font-bold">{txn.balance > 0 ? 'DR' : 'CR'}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredLedger.length > 0 && (
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                    <tr>
                      <td colSpan="3" className="px-5 py-3 text-[11px] font-bold uppercase text-slate-500 text-right">
                        Totals
                      </td>
                      <td className="px-5 py-3 text-right font-black text-rose-600 font-mono text-[12px]">
                        PKR {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 text-right font-black text-emerald-600 font-mono text-[12px]">
                        PKR {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`px-5 py-3 text-right font-black font-mono text-[13px] ${closingBalance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                        PKR {Math.abs(closingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="ml-1 text-[10px]">{closingBalance > 0 ? 'DR' : closingBalance < 0 ? 'CR' : ''}</span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>
        )}

      </div>
    </PageShell>
  );
}