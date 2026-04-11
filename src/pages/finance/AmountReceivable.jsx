import { useEffect, useState, useMemo } from 'react';
import { Card, PageShell, SectionHeader, TableState } from '../../components/layout/PageShell.jsx';
import axiosInstance from '../../services/axiosInstance';

function MoneyIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function AmountReceivablePage() {
  const [salesDues, setSalesDues] = useState([]);
  const [bookingDues, setBookingDues] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [search, setSearch]           = useState('');
  const [activeTab, setActiveTab]     = useState('all'); // 'all', 'sales', 'bookings'

  useEffect(() => { fetchReceivables(); }, []);

  async function fetchReceivables() {
    setLoading(true);
    try {
      const [invRes, bookRes] = await Promise.all([
        axiosInstance.get('/sale-invoices').catch(() => ({ data: [] })),
        axiosInstance.get('/bookings').catch(() => ({ data: [] }))
      ]);

      const invoices = Array.isArray(invRes.data) ? invRes.data : invRes.data?.data || [];
      const bookings = Array.isArray(bookRes.data) ? bookRes.data : bookRes.data?.data || [];

      // Group Sales
      const sMap = new Map();
      for (const inv of invoices) {
        const due = parseFloat(inv.to_be_paid || 0);
        if (due <= 0) continue;
        const id = inv.customer_id;
        if (!sMap.has(id)) {
          sMap.set(id, {
            customer_id:   id,
            customer_name: inv.customer_name || `Customer #${id}`,
            mobile:        inv.mobile        || inv.mobile_number || '—',
            total_due:     0,
            count:         0,
            type:          'Sale'
          });
        }
        const e = sMap.get(id);
        e.total_due += due;
        e.count     += 1;
      }
      setSalesDues([...sMap.values()]);

      // Group Bookings
      const bMap = new Map();
      for (const bk of bookings) {
        const due = parseFloat(bk.to_be_paid || 0);
        if (due <= 0) continue;
        const id = bk.customer_id;
        if (!bMap.has(id)) {
          bMap.set(id, {
            customer_id:   id,
            customer_name: bk.customer_name || `Customer #${id}`,
            mobile:        bk.mobile_number  || '—',
            total_due:     0,
            count:         0,
            type:          'Booking'
          });
        }
        const e = bMap.get(id);
        e.total_due += due;
        e.count     += 1;
      }
      setBookingDues([...bMap.values()]);

    } catch {
      setSalesDues([]);
      setBookingDues([]);
    } finally {
      setLoading(false);
    }
  }

  const receivables = useMemo(() => {
    if (activeTab === 'sales') return salesDues;
    if (activeTab === 'bookings') return bookingDues;
    
    // Merge for 'all'
    const combined = new Map();
    [...salesDues, ...bookingDues].forEach(item => {
      const id = item.customer_id;
      if (!combined.has(id)) {
        combined.set(id, { ...item, total_due: 0, count: 0, type: 'Mixed' });
      }
      const e = combined.get(id);
      e.total_due += item.total_due;
      e.count     += item.count;
    });
    return [...combined.values()].sort((a, b) => b.total_due - a.total_due);
  }, [salesDues, bookingDues, activeTab]);

  const stats = useMemo(() => {
    const sTotal = salesDues.reduce((s, r) => s + r.total_due, 0);
    const bTotal = bookingDues.reduce((s, r) => s + r.total_due, 0);
    const total  = sTotal + bTotal;
    return {
      total,
      salesTotal: sTotal,
      bookingsTotal: bTotal,
      count: new Set([...salesDues, ...bookingDues].map(r => r.customer_id)).size
    };
  }, [salesDues, bookingDues]);

  const totalReceivable = useMemo(() => receivables.reduce((s, r) => s + r.total_due, 0), [receivables]);
  const avgDue          = receivables.length > 0 ? totalReceivable / receivables.length : 0;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return receivables;
    return receivables.filter(r => r.customer_name.toLowerCase().includes(q) || r.mobile.includes(q));
  }, [receivables, search]);

  return (
    <PageShell title="Amount Receivable" description="Outstanding dues from customers based on unpaid invoices." accent="from-teal-600 via-emerald-600 to-cyan-700">
      <div className="space-y-5 max-w-6xl mx-auto">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="p-5 border-l-[6px] border-l-teal-500 bg-teal-50/30">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-100 rounded-xl text-teal-600"><MoneyIcon className="h-7 w-7" /></div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Grand Total</p>
                <p className="mt-1 text-xl font-bold text-teal-700">PKR {stats.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </Card>
          <Card className="p-5 border-l-[6px] border-l-blue-500 bg-blue-50/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Sales Dues</p>
                <p className="mt-1 text-lg font-bold text-blue-700">PKR {stats.salesTotal.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="p-5 border-l-[6px] border-l-indigo-500 bg-indigo-50/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Booking Dues</p>
                <p className="mt-1 text-lg font-bold text-indigo-700">PKR {stats.bookingsTotal.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="p-5 border-l-[6px] border-l-rose-400 bg-rose-50/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-100 rounded-xl text-rose-500">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Customers</p>
                <p className="mt-1 text-xl font-bold text-rose-600">{stats.count}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Table */}
        <Card className="overflow-hidden p-0">
          <SectionHeader
            title="Customer Dues"
            description="Grouped outstanding balances from unpaid transactions."
            icon={<MoneyIcon className="h-5 w-5" />}
            action={
              <div className="flex items-center gap-4 p-2">
                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'sales', label: 'Sales' },
                    { id: 'bookings', label: 'Bookings' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-1.5 text-[11px] font-bold rounded-md transition ${activeTab === tab.id ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or mobile..."
                    className="h-8 w-52 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[12px] outline-none focus:border-teal-400 transition" />
                  <svg className="absolute left-2.5 top-2 h-4 w-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button type="button" onClick={fetchReceivables} disabled={loading}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50">
                  {loading ? '...' : 'Refresh'}
                </button>
              </div>
            }
          />
          <div className="overflow-x-auto max-h-[500px]">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/80 sticky top-0">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Mobile</th>
                  <th className="px-6 py-3 text-center">Unpaid Items</th>
                  <th className="px-6 py-3 text-right">Outstanding Due</th>
                  <th className="px-6 py-3 text-center">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {loading ? (
                  <tr><td colSpan="6">
                    <div className="flex justify-center items-center py-12 gap-3">
                      <div className="h-6 w-6 rounded-full border-2 border-teal-200 border-t-teal-600 animate-spin" />
                      <span className="text-sm text-slate-500">Loading receivables...</span>
                    </div>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="6"><TableState message={search ? 'No matching customers.' : 'No outstanding receivables.'} /></td></tr>
                ) : (
                  filtered.map((r, idx) => (
                    <tr key={`${r.customer_id}-${r.type}`} className="hover:bg-teal-50/20 transition-colors">
                      <td className="px-6 py-3.5 text-[11px] text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-6 py-3.5 font-semibold text-slate-800 text-[13px]">{r.customer_name}</td>
                      <td className="px-6 py-3.5 text-[12px] text-slate-500 font-mono">{r.mobile}</td>
                      <td className="px-6 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-600">
                          {r.count}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-teal-700 font-mono text-[13px]">
                        PKR {r.total_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${r.type === 'Sale' ? 'bg-blue-100 text-blue-700' : r.type === 'Booking' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                          {r.type}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {!loading && filtered.length > 0 && (
                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                  <tr>
                    <td colSpan="4" className="px-6 py-3 text-right text-[11px] font-bold uppercase text-slate-500">Grand Total</td>
                    <td className="px-6 py-3 text-right font-black text-teal-700 font-mono text-[14px]">
                      PKR {stats.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td />
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