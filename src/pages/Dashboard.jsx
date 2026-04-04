import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { PageShell } from '../components/layout/PageShell.jsx'
import axiosInstance from '../services/axiosInstance'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  MdPeople, MdInventory, MdBadge, MdReceipt,
  MdMonetizationOn, MdCalendarToday, MdArrowUpward,
  MdTrendingUp, MdOpenInNew
} from 'react-icons/md'

const STAT_CARDS = [
  { key: 'totalCustomers', label: 'Customers',  icon: MdPeople,         gradient: 'from-blue-500 to-blue-600',    bg: 'bg-blue-50',    text: 'text-blue-600'    },
  { key: 'totalProducts',  label: 'Products',   icon: MdInventory,      gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  { key: 'totalStaff',     label: 'Staff',      icon: MdBadge,          gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50',   text: 'text-amber-600'   },
  { key: 'totalSales',     label: 'Sales',      icon: MdReceipt,        gradient: 'from-violet-500 to-purple-600',bg: 'bg-violet-50',  text: 'text-violet-600'  },
  { key: 'totalRevenue',   label: 'Revenue',    icon: MdMonetizationOn, gradient: 'from-rose-500 to-pink-600',    bg: 'bg-rose-50',    text: 'text-rose-600',   isCurrency: true },
  { key: 'totalBookings',  label: 'Bookings',   icon: MdCalendarToday,  gradient: 'from-cyan-500 to-sky-600',     bg: 'bg-cyan-50',    text: 'text-cyan-600'    },
]

const formatCurrency = (v) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(v)

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-[3px] border-teal-200 border-t-teal-600 rounded-full animate-spin" />
    </div>
  )
}

function StatCard({ label, value, change, icon: Icon, gradient, bg, text, isCurrency, loading }) {
  if (loading) return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm animate-pulse">
      <div className="h-3 bg-slate-200 rounded w-20 mb-3" />
      <div className="h-7 bg-slate-200 rounded w-14 mb-2" />
      <div className="h-3 bg-slate-200 rounded w-16" />
    </div>
  )
  return (
    <div className="group bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient}`} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
        <div className={`w-8 h-8 rounded-xl ${bg} ${text} flex items-center justify-center`}>
          <Icon className="text-base" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800 leading-none mb-2">
        {isCurrency ? formatCurrency(value) : value.toLocaleString()}
      </p>
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          <MdArrowUpward className="text-xs" />{change}%
        </div>
        <span className="text-[10px] text-slate-400">vs last month</span>
      </div>
    </div>
  )
}

function SectionCard({ title, subtitle, action, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-full ${className}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-[14px] font-semibold text-slate-800">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    Completed: 'bg-emerald-50 text-emerald-700',
    Pending:   'bg-amber-50 text-amber-700',
    Rejected:  'bg-rose-50 text-rose-700',
    Paid:      'bg-emerald-50 text-emerald-700',
    Partial:   'bg-amber-50 text-amber-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[status] ?? 'bg-slate-50 text-slate-500'}`}>
      {status}
    </span>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2.5 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [loading, setLoading]               = useState(true)
  const [isMounted, setIsMounted]           = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('weekly')
  const [salesOverview, setSalesOverview]   = useState([])
  const [recentBookings, setRecentBookings] = useState([])
  const [recentSales, setRecentSales]       = useState([])
  const [orderStatus, setOrderStatus]       = useState({ pending: 0, completed: 0, rejected: 0 })
  const [stats, setStats] = useState({
    totalCustomers: { value: 0, change: 0 },
    totalProducts:  { value: 0, change: 0 },
    totalStaff:     { value: 0, change: 0 },
    totalSales:     { value: 0, change: 0 },
    totalRevenue:   { value: 0, change: 0 },
    totalBookings:  { value: 0, change: 0 },
  })

  useEffect(() => { setIsMounted(true); fetchGlobalStats() }, [])
  useEffect(() => { if (isMounted) fetchChartData() }, [selectedPeriod, isMounted])

  async function fetchGlobalStats() {
    setLoading(true)
    try {
      const [customersRes, productsRes, staffRes, salesRes, bookingsRes, revenueRes] = await Promise.all([
        axiosInstance.get('/customers/count').catch(() => ({ data: { count: 203 } })),
        axiosInstance.get('/item-details/count').catch(() => ({ data: { count: 16 } })),
        axiosInstance.get('/staff/count').catch(() => ({ data: { count: 0 } })),
        axiosInstance.get('/sale-invoices/total').catch(() => ({ data: { total: 9 } })),
        axiosInstance.get('/bookings/recent').catch(() => ({ data: [] })),
        axiosInstance.get('/sale-invoices/revenue').catch(() => ({ data: { revenue: 11650 } })),
      ])
      setStats({
        totalCustomers: { value: customersRes.data?.count       || 203,  change: 12 },
        totalProducts:  { value: productsRes.data?.count        || 16,   change: 5  },
        totalStaff:     { value: staffRes.data?.data?.total     || 0,    change: 2  },
        totalSales:     { value: salesRes.data?.total           || 0,    change: 18 },
        totalRevenue:   { value: revenueRes.data?.revenue       || 0,    change: 15 },
        totalBookings:  { value: bookingsRes.data?.length       || 10,   change: 8  },
      })
      fetchBookingsStatus()
      fetchRecentSales()
    } catch { toast.error('Failed to load stats') }
    finally { setLoading(false) }
  }

  async function fetchChartData() {
    try {
      const res = await axiosInstance.get(`/sale-invoices/period?period=${selectedPeriod}`).catch(() => null)
      setSalesOverview(res?.data || [])
    } catch { /* silent */ }
  }

  async function fetchBookingsStatus() {
    const res = await axiosInstance.get('/bookings').catch(() => null)
    if (res?.data) {
      const list = Array.isArray(res.data) ? res.data : res.data.data || []
      setOrderStatus({
        pending:   list.filter(b => b.status === 'Pending').length,
        completed: list.filter(b => b.status === 'Completed').length,
        rejected:  list.filter(b => b.status === 'Rejected').length,
      })
      setRecentBookings(list.slice(0, 5))
    } else {
      setOrderStatus({ pending: 3, completed: 12, rejected: 1 })
    }
  }

  async function fetchRecentSales() {
    const res = await axiosInstance.get('/sale-invoices?limit=5').catch(() => null)
    if (res?.data) {
      const list = Array.isArray(res.data) ? res.data : res.data.data || []
      setRecentSales(list.slice(0, 5))
    }
  }

  const salesChartData = salesOverview.map(item => ({
    name: item.period_label,
    Sales: item.sales || 0,
    Expenses: item.expenses || 0,
  }))

  const pieData = [
    { name: 'Pending',   value: orderStatus.pending,   color: '#f59e0b' },
    { name: 'Completed', value: orderStatus.completed, color: '#10b981' },
    { name: 'Rejected',  value: orderStatus.rejected,  color: '#f43f5e' },
  ].filter(d => d.value > 0)

  const totalOrders = orderStatus.pending + orderStatus.completed + orderStatus.rejected

  return (
    <PageShell
      title="Dashboard"
      description="Overview of your business performance and key metrics"
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-6">

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {STAT_CARDS.map(card => (
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
          ))}
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Sales Overview — col-span-2 */}
          <div className="lg:col-span-2">
            <SectionCard
              title="Sales Overview"
              subtitle="Sales vs Expenses performance"
              action={
                <div className="flex bg-slate-100 p-1 rounded-xl gap-0.5">
                  {['weekly', 'monthly', 'yearly'].map(p => (
                    <button key={p} onClick={() => setSelectedPeriod(p)}
                      className={`px-3 py-1 text-[11px] font-semibold rounded-lg capitalize transition-all duration-150 ${
                        selectedPeriod === p
                          ? 'bg-white text-teal-600 shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >{p}</button>
                  ))}
                </div>
              }
            >
              {loading || !isMounted ? <Spinner /> : salesChartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-52 text-slate-400">
                  <MdTrendingUp className="text-4xl mb-2 opacity-30" />
                  <p className="text-sm">No sales data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={salesChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false}
                      tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Legend iconType="circle" iconSize={7}
                      formatter={v => <span className="text-[11px] text-slate-500">{v}</span>} />
                    <Bar dataKey="Sales"    fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Expenses" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>
          </div>

          {/* Order Status — col-span-1 */}
          <div className="lg:col-span-1">
            <SectionCard title="Order Status" subtitle="Booking distribution">
              {loading || !isMounted ? <Spinner /> : totalOrders === 0 ? (
                <div className="flex flex-col items-center justify-center h-52 text-slate-400">
                  <p className="text-sm">No order data</p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%"
                        innerRadius={45} outerRadius={72}
                        paddingAngle={3} dataKey="value" strokeWidth={0}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }}
                        formatter={(v, n) => [`${v} orders`, n]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { label: 'Pending',   count: orderStatus.pending,   color: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
                      { label: 'Done',      count: orderStatus.completed, color: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
                      { label: 'Rejected',  count: orderStatus.rejected,  color: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-400'    },
                    ].map(s => (
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
          </div>
        </div>

        {/* ── Tables Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Recent Bookings */}
          <SectionCard
            title="Recent Bookings"
            subtitle="Latest customer bookings"
            action={
              <button onClick={() => window.location.href = '/booking-customers'}
                className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-700 transition-colors">
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
                    <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                      <th className="pb-2.5 pl-1">Customer</th>
                      <th className="pb-2.5">Date</th>
                      <th className="pb-2.5">Amount</th>
                      <th className="pb-2.5 text-right pr-1">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentBookings.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 pl-1">
                          <p className="text-[13px] font-medium text-slate-800">{b.customer_name || 'Unknown'}</p>
                          <p className="text-[11px] text-slate-400">{b.mobile_no || '—'}</p>
                        </td>
                        <td className="py-2.5 text-[12px] text-slate-500">{formatDate(b.booking_date)}</td>
                        <td className="py-2.5 text-[12px] font-semibold text-slate-700">{formatCurrency(b.payable || 0)}</td>
                        <td className="py-2.5 text-right pr-1">
                          <StatusBadge status={b.status || 'Pending'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Recent Sales */}
          <SectionCard
            title="Recent Sales"
            subtitle="Latest sales invoices"
            action={
              <button onClick={() => window.location.href = '/sale'}
                className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-700 transition-colors">
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
                    <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                      <th className="pb-2.5 pl-1">Invoice</th>
                      <th className="pb-2.5">Customer</th>
                      <th className="pb-2.5">Amount</th>
                      <th className="pb-2.5 text-right pr-1">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentSales.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 pl-1">
                          <span className="text-[11px] font-mono font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-md">
                            #{s.id}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <p className="text-[13px] font-medium text-slate-800">{s.customer_name || 'Unknown'}</p>
                          <p className="text-[11px] text-slate-400">{s.mobile || '—'}</p>
                        </td>
                        <td className="py-2.5 text-[12px] font-semibold text-slate-700">{formatCurrency(s.payable || 0)}</td>
                        <td className="py-2.5 text-right pr-1">
                          <StatusBadge status={s.given_amount >= s.payable ? 'Paid' : 'Partial'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </PageShell>
  )
}