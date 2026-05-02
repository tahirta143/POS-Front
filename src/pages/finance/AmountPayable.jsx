import { useEffect, useState, useMemo } from 'react';
import { Card, PageShell, SectionHeader, TableState } from '../../components/layout/PageShell.jsx';
import { MdRefresh, MdSearch } from 'react-icons/md';
import axiosInstance from '../../services/axiosInstance';

function MoneyIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function AmountPayablePage() {
  const [payables, setPayables] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState('');

  useEffect(() => { fetchPayables(); }, []);

  async function fetchPayables() {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/purchases');
      const purchases = Array.isArray(response.data) ? response.data : response.data?.data || [];

      // Group by supplier, summing to_be_paid
      const supplierMap = new Map();
      for (const p of purchases) {
        const due = parseFloat(p.to_be_paid || 0);
        if (due <= 0) continue;

        const id = p.supplier_id;
        if (!supplierMap.has(id)) {
          supplierMap.set(id, {
            supplier_id:    id,
            supplier_name:  p.supplier_name || `Supplier #${id}`,
            phone:          p.phone || '—',
            total_due:      0,
            invoice_count:  0,
          });
        }
        const entry = supplierMap.get(id);
        entry.total_due     += due;
        entry.invoice_count += 1;
      }

      setPayables([...supplierMap.values()].sort((a, b) => b.total_due - a.total_due));
    } catch {
      setPayables([]);
    } finally {
      setLoading(false);
    }
  }

  const totalPayable = useMemo(
    () => payables.reduce((sum, p) => sum + p.total_due, 0),
    [payables]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return payables.filter(
      p => p.supplier_name.toLowerCase().includes(q) ||
           (p.phone && p.phone.includes(q))
    );
  }, [payables, search]);

  return (
    <PageShell
      title="Amount Payable"
      description="Outstanding liabilities to suppliers based on unpaid purchases."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-5 max-w-5xl mx-auto">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-5 border-l-[6px] border-l-teal-500 bg-teal-50/30">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-100 rounded-xl text-teal-600">
                <MoneyIcon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Payable</p>
                <p className="mt-1 text-2xl font-bold text-teal-700">
                  PKR {totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-l-[6px] border-l-amber-400 bg-amber-50/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Suppliers to Pay</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{payables.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search + Table */}
        <Card className="overflow-hidden p-0">
          <SectionHeader
            title="Supplier Balances"
            description="Grouped outstanding dues from unpaid purchase orders."
            icon={<MoneyIcon className="h-5 w-5" />}
            action={
              <div className="flex items-center gap-4 p-2">
                <div className="relative">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5 pointer-events-none z-10" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search supplier or mobile..."
                    className="h-8 w-64 pl-8 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-[12px] outline-none focus:border-teal-400 focus:bg-white transition"
                    style={{ paddingLeft: "2rem" }}
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchPayables}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <MdRefresh className="inline mr-1" /> Refresh
                </button>
              </div>
            }
          />

          <div className="overflow-x-auto max-h-[480px]">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/80 sticky top-0">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Supplier</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3 text-center">Unpaid Orders</th>
                  <th className="px-6 py-3 text-right">Outstanding Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {loading ? (
                  <tr><td colSpan="5"><TableState message="Loading payables..." /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="5"><TableState message="No outstanding dues found." /></td></tr>
                ) : (
                  filtered.map((p, idx) => (
                    <tr key={p.supplier_id} className="hover:bg-teal-50/20 transition-colors">
                      <td className="px-6 py-3.5 text-[11px] text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-6 py-3.5 font-semibold text-slate-800 text-[13px]">{p.supplier_name}</td>
                      <td className="px-6 py-3.5 text-[12px] text-slate-500">{p.phone}</td>
                      <td className="px-6 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-600">
                          {p.invoice_count}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-teal-700 font-mono text-[13px]">
                        PKR {p.total_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                  <tr>
                    <td colSpan="4" className="px-6 py-3 text-[11px] font-bold uppercase text-slate-500 text-right">
                      Grand Total
                    </td>
                    <td className="px-6 py-3 text-right font-black text-teal-700 font-mono text-[14px]">
                      PKR {totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
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