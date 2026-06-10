import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdPeople, MdRefresh, MdSearch, MdChevronRight } from "react-icons/md";
import { toast } from "react-toastify";
import { Card, PageShell, SectionHeader, TableState } from "../../components/layout/PageShell.jsx";
import axiosInstance from "../../services/axiosInstance";

export default function CustomerAccountList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [custRes, invRes, bookRes] = await Promise.all([
        axiosInstance.get("/customers"),
        axiosInstance.get("/sale-invoices").catch(() => ({ data: [] })),
        axiosInstance.get("/bookings").catch(() => ({ data: [] })),
      ]);
      setCustomers(Array.isArray(custRes.data) ? custRes.data : custRes.data?.data || []);
      setInvoices(Array.isArray(invRes.data) ? invRes.data : invRes.data?.data || []);
      setBookings(Array.isArray(bookRes.data) ? bookRes.data : bookRes.data?.data || []);
    } catch {
      toast.error("Failed to load customers.");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  const customerRows = useMemo(() => {
    const dueMap = new Map();

    for (const inv of invoices) {
      const due = parseFloat(inv.to_be_paid || 0);
      const id = inv.customer_id;
      if (!dueMap.has(id)) dueMap.set(id, { totalDue: 0, openCount: 0 });
      const entry = dueMap.get(id);
      entry.totalDue += due;
      if (due > 0) entry.openCount += 1;
    }

    for (const bk of bookings) {
      const due = parseFloat(bk.to_be_paid || 0);
      const id = bk.customer_id;
      if (!dueMap.has(id)) dueMap.set(id, { totalDue: 0, openCount: 0 });
      const entry = dueMap.get(id);
      entry.totalDue += due;
      if (due > 0) entry.openCount += 1;
    }

    return customers.map((c) => {
      const stats = dueMap.get(c.id) || { totalDue: 0, openCount: 0 };
      const prevBal = parseFloat(c.previous_balance || 0);
      return {
        ...c,
        outstanding: stats.totalDue + prevBal,
        openItems: stats.openCount,
      };
    });
  }, [customers, invoices, bookings]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customerRows;
    return customerRows.filter(
      (c) =>
        String(c.customer_name || "").toLowerCase().includes(q) ||
        String(c.mobile_number || "").includes(q) ||
        String(c.address || "").toLowerCase().includes(q) ||
        String(c.nearby || "").toLowerCase().includes(q),
    );
  }, [customerRows, search]);

  return (
    <PageShell>
      <div className="space-y-5 max-w-6xl mx-auto">
        <Card className="p-5 border-l-[6px] border-l-teal-500">
          <SectionHeader
            title="Customer Accounts"
            description="Browse all customers and open their account details."
            icon={<MdPeople className="h-5 w-5" />}
            action={
              <div className="flex items-center gap-3">
                <div className="relative">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5 pointer-events-none z-10" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search customer, mobile, or address..."
                    className="h-8 w-64 pl-8 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-[12px] outline-none focus:border-teal-400 focus:bg-white transition"
                    style={{ paddingLeft: "2rem" }}
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchData}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
                >
                  <MdRefresh className="inline mr-1" /> Refresh
                </button>
              </div>
            }
          />
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto max-h-[560px]">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/80 sticky top-0">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Mobile</th>
                  <th className="px-6 py-3">Payment Method</th>
                  <th className="px-6 py-3 text-right">Outstanding</th>
                  <th className="px-6 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="6">
                      <TableState message="Loading customers..." />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <TableState message="No customers found." />
                    </td>
                  </tr>
                ) : (
                  filtered.map((c, idx) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/finance/customer-account/${c.id}`)}
                      className="hover:bg-teal-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-3.5 text-[11px] text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-slate-800 text-[13px]">{c.customer_name}</p>
                        {c.address && <p className="text-[11px] text-slate-400 truncate max-w-xs">{c.address}</p>}
                      </td>
                      <td className="px-6 py-3.5 text-[12px] text-slate-500">{c.mobile_number || "—"}</td>
                      <td className="px-6 py-3.5 text-[12px] text-slate-600">{c.payment_method || "—"}</td>
                      <td className="px-6 py-3.5 text-right">
                        <p
                          className={`font-bold font-mono text-[13px] ${
                            c.outstanding > 0 ? "text-rose-600" : "text-emerald-600"
                          }`}
                        >
                          PKR {c.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        {c.openItems > 0 && (
                          <p className="text-[10px] text-amber-600 font-semibold">
                            {c.openItems} open item{c.openItems !== 1 ? "s" : ""}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-300 group-hover:text-teal-500 transition-colors">
                        <MdChevronRight className="h-5 w-5" />
                      </td>
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
