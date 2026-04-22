import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { PageShell } from "../components/layout/PageShell.jsx";
import axiosInstance from "../services/axiosInstance";
import { usePermissions } from "../hooks/usePermissions"; // adjust path if needed
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  MdPeople, MdInventory, MdBadge, MdReceipt,
  MdMonetizationOn, MdCalendarToday, MdArrowUpward,
  MdTrendingUp, MdOpenInNew, MdShield,
} from "react-icons/md";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatCurrency = (v) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency", currency: "PKR", minimumFractionDigits: 0,
  }).format(v ?? 0);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-PK", {
    day: "numeric", month: "short", year: "numeric",
  }) : "—";

// ── Sub-components ────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-[3px] border-teal-200 border-t-teal-600 rounded-full animate-spin" />
    </div>
  );
}

function NoAccess({ label }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-4 flex flex-col items-center justify-center gap-1 min-h-[90px]">
      <MdShield className="h-5 w-5 text-slate-300 dark:text-slate-600" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-600">
        {label}
      </p>
      <p className="text-[9px] text-slate-300 dark:text-slate-600">No access</p>
    </div>
  );
}

function StatCard({ label, value, change, icon, gradient, bg, text, isCurrency, loading }) {
  const IconComponent = icon;
  if (loading)
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm animate-pulse">
        <div className="h-3 bg-slate-200 rounded w-20 mb-3" />
        <div className="h-7 bg-slate-200 rounded w-14 mb-2" />
        <div className="h-3 bg-slate-200 rounded w-16" />
      </div>
    );
  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-teal-400">
          {label}
        </p>
        <div className={`w-8 h-8 rounded-xl ${bg} dark:bg-white/10 ${text} dark:text-white flex items-center justify-center`}>
          <IconComponent className="text-base" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none mb-2">
        {isCurrency ? formatCurrency(value) : (value ?? 0).toLocaleString()}
      </p>
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          <MdArrowUpward className="text-xs" />
          {change}%
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">vs last month</span>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, action, children, className = "" }) {
  return (
    <div className={`bg-white/95 dark:bg-slate-900/85 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden h-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${className}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-teal-500/50 dark:bg-teal-600">
        <div>
          <h3 className="text-[14px] font-bold text-slate-800 dark:text-white uppercase tracking-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-400 dark:text-teal-100 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    Completed: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    Pending:   "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    Rejected:  "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400",
    Paid:      "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    Partial:   "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[status] ?? "bg-slate-50 text-slate-500"}`}>
      {status}
    </span>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg px-3 py-2.5 text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { isAdmin, canAccess, canDo } = usePermissions();

  // Permission flags — used to decide what to fetch and what to render
  const showCustomers = isAdmin || canAccess("Customer");
  const showProducts  = isAdmin || canAccess("Items") || canAccess("Item");
  const showStaff     = isAdmin || canAccess("Users") || canAccess("Security");
  const showSales     = isAdmin || canAccess("Sale");
  const showBookings  = isAdmin || canAccess("Booking");

  const [loading, setLoading]           = useState(true);
  const [isMounted, setIsMounted]       = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("daily");
  const [salesOverview, setSalesOverview]   = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentSales, setRecentSales]       = useState([]);
  const [orderStatus, setOrderStatus]       = useState({ pending: 0, completed: 0, rejected: 0 });
  const [stats, setStats] = useState({
    totalCustomers: { value: 0, change: 0 },
    totalProducts:  { value: 0, change: 0 },
    totalStaff:     { value: 0, change: 0 },
    totalSales:     { value: 0, change: 0 },
    totalBookings:  { value: 0, change: 0 },
  });

  useEffect(() => {
    setIsMounted(true);
    fetchGlobalStats();
  }, []);

  useEffect(() => {
    if (isMounted && showSales) fetchChartData();
  }, [selectedPeriod, isMounted]);

  async function fetchGlobalStats() {
    setLoading(true);
    try {
      // Only fire API calls the user is allowed to see
      const [customersRes, productsRes, staffRes, bookingsRes, revenueRes] =
        await Promise.all([
          showCustomers
            ? axiosInstance.get("/customers/count").catch(() => ({ data: { totalCustomers: 0 } }))
            : Promise.resolve({ data: { totalCustomers: 0 } }),

          showProducts
            ? axiosInstance.get("/item-details/count").catch(() => ({ data: { count: 0 } }))
            : Promise.resolve({ data: { count: 0 } }),

          showStaff
            ? axiosInstance.get("/staff/count").catch(() => ({ data: { count: 0 } }))
            : Promise.resolve({ data: { count: 0 } }),

          showBookings
            ? axiosInstance.get("/bookings").catch(() => ({ data: [] }))
            : Promise.resolve({ data: [] }),

          showSales
            ? axiosInstance.get("/sale-invoices/revenue").catch(() => ({ data: { revenue: 0 } }))
            : Promise.resolve({ data: { revenue: 0 } }),
        ]);

      const bList = Array.isArray(bookingsRes.data)
        ? bookingsRes.data
        : bookingsRes.data?.data || [];

      setStats({
        totalCustomers: { value: customersRes.data?.totalCustomers ?? 0, change: 12 },
        totalProducts:  { value: productsRes.data?.count || 0,           change: 5  },
        totalStaff:     { value: staffRes.data?.data?.total || 0,         change: 2  },
        totalSales:     { value: revenueRes.data?.revenue || 0,           change: 18 },
        totalBookings:  { value: bList.length,                            change: 8  },
      });

      if (showBookings) {
        setOrderStatus({
          pending:   bList.filter((b) => b.booking_status === "Pending").length,
          completed: bList.filter((b) => b.booking_status === "Completed").length,
          rejected:  bList.filter((b) => b.booking_status === "Rejected").length,
        });
        setRecentBookings(bList.slice(0, 5));
      }

      if (showSales) fetchRecentSales();

    } catch {
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  }

  async function fetchChartData() {
    try {
      const res = await axiosInstance
        .get(`/sale-invoices/period?period=${selectedPeriod}`)
        .catch(() => null);
      setSalesOverview(res?.data || []);
    } catch { /* silent */ }
  }

  async function fetchRecentSales() {
    const res = await axiosInstance.get("/sale-invoices?limit=5").catch(() => null);
    if (res?.data) {
      const list = Array.isArray(res.data) ? res.data : res.data.data || [];
      setRecentSales(list.slice(0, 5));
    }
  }

  const salesChartData = salesOverview.map((item) => ({
    name: item.period_label,
    Sales: item.sales || 0,
    Expenses: item.expenses || 0,
  }));

  const pieData = [
    { name: "Waitlist",  value: orderStatus.pending,   color: "#f59e0b" },
    { name: "Done",      value: orderStatus.completed, color: "#10b981" },
    { name: "Cancelled", value: orderStatus.rejected,  color: "#f43f5e" },
  ].filter((d) => d.value > 0);

  const totalOrders = orderStatus.pending + orderStatus.completed + orderStatus.rejected;

  // Stat cards — each only shows if user has access, otherwise renders a locked placeholder
  const STAT_CARDS = [
    {
      key: "totalCustomers", label: "Customers",   icon: MdPeople,
      gradient: "from-blue-500 to-blue-600",
      bg: "bg-blue-50",   text: "text-blue-600",
      show: showCustomers,
    },
    {
      key: "totalProducts",  label: "Products",    icon: MdInventory,
      gradient: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50", text: "text-emerald-600",
      show: showProducts,
    },
    {
      key: "totalStaff",     label: "Staff",       icon: MdBadge,
      gradient: "from-amber-500 to-orange-500",
      bg: "bg-amber-50",  text: "text-amber-600",
      show: showStaff,
    },
    {
      key: "totalSales",     label: "Total Sales", icon: MdMonetizationOn,
      gradient: "from-violet-500 to-purple-600",
      bg: "bg-violet-50", text: "text-violet-600",
      isCurrency: true,
      show: showSales,
    },
    {
      key: "totalBookings",  label: "Bookings",    icon: MdCalendarToday,
      gradient: "from-cyan-500 to-sky-600",
      bg: "bg-cyan-50",   text: "text-cyan-600",
      show: showBookings,
    },
  ];

  // Check if user has access to absolutely nothing
  const hasAnyAccess = showCustomers || showProducts || showStaff || showSales || showBookings;

  return (
    <PageShell
      title="Dashboard"
      description="Overview of your business performance and key metrics"
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-6">

        {/* ── Full no-access state ── */}
        {!hasAnyAccess && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
            <MdShield className="h-14 w-14 opacity-30" />
            <p className="text-[16px] font-bold text-slate-500">No dashboard access</p>
            <p className="text-[13px] text-slate-400">
              Contact your administrator to grant module permissions.
            </p>
          </div>
        )}

        {hasAnyAccess && (
          <>
            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
              {STAT_CARDS.map((card) =>
                card.show ? (
                  <StatCard
                    key={card.key}
                    label={card.label}
                    value={stats[card.key].value}
                    change={stats[card.key].change}
                    icon={card.icon}
                    gradient={card.gradient}
                    bg={card.bg}
                    text={card.text}
                    isCurrency={card.isCurrency}
                    loading={loading}
                  />
                ) : (
                  <NoAccess key={card.key} label={card.label} />
                )
              )}
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Sales Overview chart */}
              <div className="lg:col-span-2">
                {showSales ? (
                  <SectionCard
                    title="Sales Overview"
                    subtitle="Sales vs Expenses performance"
                    action={
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-0.5">
                        {["daily", "weekly", "monthly", "yearly"].map((p) => (
                          <button
                            key={p}
                            onClick={() => setSelectedPeriod(p)}
                            className={`px-3 py-1 text-[11px] font-semibold rounded-lg capitalize transition-all duration-150 ${
                              selectedPeriod === p
                                ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm"
                                : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    }
                  >
                    {loading || !isMounted ? (
                      <Spinner />
                    ) : salesChartData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-52 text-slate-400">
                        <MdTrendingUp className="text-4xl mb-2 opacity-30" />
                        <p className="text-sm">No sales data available</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={salesChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-slate-900" vertical={false} />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(45, 212, 191, 0.12)" }} />
                          <Legend iconType="circle" iconSize={7} formatter={(v) => <span className="text-[11px] text-slate-500">{v}</span>} />
                          <Bar dataKey="Sales"    fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                          <Bar dataKey="Expenses" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={28} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </SectionCard>
                ) : (
                  <div className="h-full flex items-center justify-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 min-h-[200px]">
                    <div className="flex flex-col items-center gap-2 text-slate-300 dark:text-slate-600">
                      <MdShield className="h-8 w-8" />
                      <p className="text-[12px] font-bold uppercase tracking-widest">Sales — No Access</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Booking Distribution pie */}
              <div className="lg:col-span-1">
                {showBookings ? (
                  <SectionCard title="Booking Distribution" subtitle="Status breakdown of advance orders">
                    {loading || !isMounted ? (
                      <Spinner />
                    ) : totalOrders === 0 ? (
                      <div className="flex flex-col items-center justify-center h-52 text-slate-400">
                        <p className="text-sm">No order data</p>
                      </div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
                              {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip
                              contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 12 }}
                              formatter={(v, n) => [`${v} orders`, n]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {[
                            { label: "Pending",  count: orderStatus.pending,   color: "bg-amber-50 dark:bg-amber-900/20",   text: "text-amber-700 dark:text-amber-400",   dot: "bg-amber-400"   },
                            { label: "Done",     count: orderStatus.completed, color: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-400" },
                            { label: "Rejected", count: orderStatus.rejected,  color: "bg-rose-50 dark:bg-rose-900/20",     text: "text-rose-700 dark:text-rose-400",     dot: "bg-rose-400"    },
                          ].map((s) => (
                            <div key={s.label} className={`${s.color} rounded-xl p-2.5 text-center`}>
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                <p className={`text-[10px] font-semibold ${s.text}`}>{s.label}</p>
                              </div>
                              <p className={`text-lg font-bold ${s.text}`}>{s.count}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </SectionCard>
                ) : (
                  <div className="h-full flex items-center justify-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 min-h-[200px]">
                    <div className="flex flex-col items-center gap-2 text-slate-300 dark:text-slate-600">
                      <MdShield className="h-8 w-8" />
                      <p className="text-[12px] font-bold uppercase tracking-widest">Bookings — No Access</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Tables Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Recent Bookings */}
              {showBookings ? (
                <SectionCard
                  title="Recent Bookings"
                  subtitle="Latest customer bookings"
                  action={
                    <button onClick={() => (window.location.href = "/booking-customers")}
                      className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-700">
                      View All <MdOpenInNew className="text-xs" />
                    </button>
                  }
                >
                  {loading ? <Spinner /> : recentBookings.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">No recent bookings</div>
                  ) : (
                    <div className="overflow-x-auto -mx-1">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-teal-400 border-b border-slate-100 dark:border-slate-800">
                            <th className="pb-2.5 pl-1">Customer</th>
                            <th className="pb-2.5">Date</th>
                            <th className="pb-2.5">Amount</th>
                            <th className="pb-2.5 text-right pr-1">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                          {recentBookings.map((b) => (
                            <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-2.5 pl-1">
                                <p className="text-[13px] font-medium text-slate-800 dark:text-slate-100">{b.customer_name || "Unknown"}</p>
                                <p className="text-[11px] text-slate-400">{b.mobile_no || "—"}</p>
                              </td>
                              <td className="py-2.5 text-[12px] text-slate-500">{formatDate(b.booking_date)}</td>
                              <td className="py-2.5 text-[12px] font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(b.payable)}</td>
                              <td className="py-2.5 text-right pr-1"><StatusBadge status={b.booking_status || "Pending"} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </SectionCard>
              ) : (
                <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 min-h-[180px]">
                  <div className="flex flex-col items-center gap-2 text-slate-300 dark:text-slate-600">
                    <MdShield className="h-8 w-8" />
                    <p className="text-[12px] font-bold uppercase tracking-widest">Recent Bookings — No Access</p>
                  </div>
                </div>
              )}

              {/* Recent Sales */}
              {showSales ? (
                <SectionCard
                  title="Recent Sales"
                  subtitle="Latest sales invoices"
                  action={
                    <button onClick={() => (window.location.href = "/sale")}
                      className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-700">
                      View All <MdOpenInNew className="text-xs" />
                    </button>
                  }
                >
                  {loading ? <Spinner /> : recentSales.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">No recent sales</div>
                  ) : (
                    <div className="overflow-x-auto -mx-1">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-teal-400 border-b border-slate-100 dark:border-slate-800">
                            <th className="pb-2.5 pl-1">Invoice</th>
                            <th className="pb-2.5">Customer</th>
                            <th className="pb-2.5">Amount</th>
                            <th className="pb-2.5 text-right pr-1">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {recentSales.map((s) => (
                            <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2.5 pl-1">
                                <span className="text-[11px] font-mono font-semibold text-teal-600 bg-teal-50 dark:bg-slate-800 dark:text-teal-400 px-1.5 py-0.5 rounded-md">#{s.id}</span>
                              </td>
                              <td className="py-2.5">
                                <p className="text-[13px] font-medium text-slate-800 dark:text-slate-50">{s.customer_name || "Unknown"}</p>
                                <p className="text-[11px] text-slate-400">{s.mobile || "—"}</p>
                              </td>
                              <td className="py-2.5 text-[12px] font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(s.payable)}</td>
                              <td className="py-2.5 text-right pr-1"><StatusBadge status={s.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </SectionCard>
              ) : (
                <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 min-h-[180px]">
                  <div className="flex flex-col items-center gap-2 text-slate-300 dark:text-slate-600">
                    <MdShield className="h-8 w-8" />
                    <p className="text-[12px] font-bold uppercase tracking-widest">Recent Sales — No Access</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}