import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdFactory, MdRefresh, MdSearch, MdChevronRight } from "react-icons/md";
import { toast } from "react-toastify";
import { Card, PageShell, SectionHeader, StatusChip, TableState } from "../../components/layout/PageShell.jsx";
import axiosInstance from "../../services/axiosInstance";

export default function SupplierAccountList() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [suppRes, purRes] = await Promise.all([
        axiosInstance.get("/suppliers"),
        axiosInstance.get("/purchases").catch(() => ({ data: [] })),
      ]);
      setSuppliers(Array.isArray(suppRes.data) ? suppRes.data : suppRes.data?.data || []);
      setPurchases(Array.isArray(purRes.data) ? purRes.data : purRes.data?.data || []);
    } catch {
      toast.error("Failed to load suppliers.");
      setSuppliers([]);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  }

  const supplierRows = useMemo(() => {
    const dueMap = new Map();
    for (const p of purchases) {
      const due = parseFloat(p.to_be_paid || 0);
      const id = p.supplier_id;
      if (!dueMap.has(id)) dueMap.set(id, { totalDue: 0, orderCount: 0 });
      const entry = dueMap.get(id);
      entry.totalDue += due;
      if (due > 0) entry.orderCount += 1;
    }

    return suppliers.map((s) => {
      const stats = dueMap.get(s.id) || { totalDue: 0, orderCount: 0 };
      return {
        ...s,
        outstanding: stats.totalDue,
        unpaidOrders: stats.orderCount,
      };
    });
  }, [suppliers, purchases]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return supplierRows;
    return supplierRows.filter(
      (s) =>
        String(s.supplier_name || "").toLowerCase().includes(q) ||
        String(s.phone || "").includes(q) ||
        String(s.email || "").toLowerCase().includes(q) ||
        String(s.contact_person || "").toLowerCase().includes(q),
    );
  }, [supplierRows, search]);

  return (
    <PageShell>
      <div className="space-y-5 max-w-6xl mx-auto">
        <Card className="p-5 border-l-[6px] border-l-teal-500">
          <SectionHeader
            title="Supplier Accounts"
            description="Browse all suppliers and open their account details."
            icon={<MdFactory className="h-5 w-5" />}
            action={
              <div className="flex items-center gap-3">
                <div className="relative">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5 pointer-events-none z-10" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search supplier, phone, or email..."
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
                  <th className="px-6 py-3">Supplier</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Payment Terms</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Outstanding</th>
                  <th className="px-6 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="7">
                      <TableState message="Loading suppliers..." />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <TableState message="No suppliers found." />
                    </td>
                  </tr>
                ) : (
                  filtered.map((s, idx) => (
                    <tr
                      key={s.id}
                      onClick={() => navigate(`/finance/supplier-account/${s.id}`)}
                      className="hover:bg-teal-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-3.5 text-[11px] text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-slate-800 text-[13px]">{s.supplier_name}</p>
                        {s.contact_person && (
                          <p className="text-[11px] text-slate-400">{s.contact_person}</p>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-[12px] text-slate-500">
                        <p>{s.phone || "—"}</p>
                        {s.email && <p className="text-[11px] text-slate-400">{s.email}</p>}
                      </td>
                      <td className="px-6 py-3.5 text-[12px] text-slate-600">{s.payment_terms || "—"}</td>
                      <td className="px-6 py-3.5 text-center">
                        <StatusChip enabled={s.status === 1 || s.status === true} />
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <p
                          className={`font-bold font-mono text-[13px] ${
                            s.outstanding > 0 ? "text-rose-600" : "text-emerald-600"
                          }`}
                        >
                          PKR {s.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        {s.unpaidOrders > 0 && (
                          <p className="text-[10px] text-amber-600 font-semibold">
                            {s.unpaidOrders} unpaid order{s.unpaidOrders !== 1 ? "s" : ""}
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
