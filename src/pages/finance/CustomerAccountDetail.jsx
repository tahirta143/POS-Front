import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  MdPeople,
  MdReceipt,
  MdPayment,
  MdShoppingCart,
  MdDashboard,
  MdSearch,
  MdCalendarToday,
  MdPhone,
  MdLocationOn,
  MdCreditCard,
  MdAccountBalanceWallet,
  MdDescription,
  MdWarning,
  MdAdd,
} from "react-icons/md";
import { toast } from "react-toastify";
import { Card, PageShell, TableState } from "../../components/layout/PageShell.jsx";
import axiosInstance from "../../services/axiosInstance";
import AccountTabBar from "./components/AccountTabBar";
import AccountDetailHeader from "./components/AccountDetailHeader";
import AccountMetricCard from "./components/AccountMetricCard";
import AccountInfoPanel from "./components/AccountInfoPanel";
import AccountTimeline from "./components/AccountTimeline";
import RecordPaymentModal from "./components/RecordPaymentModal";
import LedgerTable from "./components/LedgerTable";
import {
  buildTimelineEvents,
  countOverdue,
  fmtDate,
  fmtMoney,
  invoiceStatusBadge,
} from "./components/accountUtils";

const TABS = [
  { id: "overview", label: "Overview", icon: <MdDashboard className="text-base" /> },
  { id: "ledger", label: "Ledger", icon: <MdReceipt className="text-base" /> },
  { id: "payments", label: "Payments", icon: <MdPayment className="text-base" /> },
  { id: "sales-bookings", label: "Sales & Bookings", icon: <MdShoppingCart className="text-base" /> },
  { id: "statements", label: "Statements", icon: <MdDescription className="text-base" /> },
];

export default function CustomerAccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const [customer, setCustomer] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [salesPayments, setSalesPayments] = useState([]);
  const [bookingPayments, setBookingPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [salesTab, setSalesTab] = useState("sales");
  const [salesSearch, setSalesSearch] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const setActiveTab = (tab) => setSearchParams(tab === "overview" ? {} : { tab });

  const fetchCustomer = useCallback(async () => {
    const res = await axiosInstance.get(`/customers/${id}`);
    setCustomer(res.data);
  }, [id]);

  const fetchLedger = useCallback(async () => {
    const res = await axiosInstance.get(`/customer-ledger/${id}`);
    setLedgerData(res.data);
  }, [id]);

  const fetchPayments = useCallback(async () => {
    const [salesRes, bookRes] = await Promise.all([
      axiosInstance.get(`/customer-payments?customerId=${id}`),
      axiosInstance.get("/bookings/all-payments").catch(() => ({ data: [] })),
    ]);
    setSalesPayments(Array.isArray(salesRes.data) ? salesRes.data : salesRes.data?.data || []);
    const allBookingPayments = Array.isArray(bookRes.data) ? bookRes.data : bookRes.data?.data || [];
    setBookingPayments(allBookingPayments.filter((p) => String(p.customer_id) === String(id)));
  }, [id]);

  const fetchSalesAndBookings = useCallback(async () => {
    const [invRes, bookRes] = await Promise.all([
      axiosInstance.get("/sale-invoices").catch(() => ({ data: [] })),
      axiosInstance.get("/bookings").catch(() => ({ data: [] })),
    ]);
    const allInv = Array.isArray(invRes.data) ? invRes.data : invRes.data?.data || [];
    const allBook = Array.isArray(bookRes.data) ? bookRes.data : bookRes.data?.data || [];
    setInvoices(allInv.filter((inv) => String(inv.customer_id) === String(id)));
    setBookings(allBook.filter((bk) => String(bk.customer_id) === String(id)));
  }, [id]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchCustomer(), fetchLedger(), fetchPayments(), fetchSalesAndBookings()]);
    } catch {
      toast.error("Failed to load customer account.");
    } finally {
      setLoading(false);
    }
  }, [fetchCustomer, fetchLedger, fetchPayments, fetchSalesAndBookings]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const closingBalance = ledgerData?.closingBalance ?? 0;
  const ledger = ledgerData?.ledger || [];

  const allPayments = useMemo(() => {
    const sales = salesPayments.map((p) => ({
      ...p,
      type: "Sale",
      reference: p.receipt_no ? `RCP-${p.receipt_no}` : `PAY-${p.id}`,
      note: p.remarks,
    }));
    const books = bookingPayments.map((p) => ({
      ...p,
      type: "Booking",
      reference: p.booking_id ? `BKG-${p.booking_id}` : `PAY-${p.id}`,
      note: p.remarks,
    }));
    return [...sales, ...books].sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
  }, [salesPayments, bookingPayments]);

  const summary = useMemo(() => {
    const salesTotal = invoices.reduce((s, inv) => s + parseFloat(inv.payable || 0), 0);
    const salesDue = invoices.reduce((s, inv) => s + parseFloat(inv.to_be_paid || 0), 0);
    const bookingDue = bookings.reduce((s, bk) => s + parseFloat(bk.to_be_paid || 0), 0);
    const totalReceived = allPayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const overdueInvoices = countOverdue(invoices);
    const overdueAmount = overdueInvoices.reduce((s, inv) => s + parseFloat(inv.to_be_paid || 0), 0);
    return {
      salesTotal,
      totalReceivable: salesDue + bookingDue,
      totalReceived,
      overdueAmount,
      overdueCount: overdueInvoices.length,
      invoiceCount: invoices.length,
      bookingCount: bookings.length,
      salesDue,
      bookingDue,
    };
  }, [invoices, bookings, allPayments]);

  const timelineEvents = useMemo(
    () =>
      buildTimelineEvents({
        invoices: invoices.slice(0, 5),
        bookings: bookings.slice(0, 5),
        payments: allPayments.slice(0, 5),
      }),
    [invoices, bookings, allPayments],
  );

  const recentInvoices = useMemo(
    () => [...invoices].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5),
    [invoices],
  );
  const recentPayments = allPayments.slice(0, 5);

  const filteredPayments = useMemo(() => {
    const q = paymentSearch.toLowerCase();
    if (!q) return allPayments;
    return allPayments.filter(
      (p) =>
        String(p.type || "").toLowerCase().includes(q) ||
        String(p.payment_method || "").toLowerCase().includes(q) ||
        String(p.note || "").toLowerCase().includes(q) ||
        String(p.reference || "").toLowerCase().includes(q),
    );
  }, [allPayments, paymentSearch]);

  const filteredSales = useMemo(() => {
    const q = salesSearch.toLowerCase();
    const list = salesTab === "sales" ? invoices : bookings;
    if (!q) return list;
    return list.filter((item) => {
      if (salesTab === "sales") {
        return (
          String(item.receipt_no || "").toLowerCase().includes(q) ||
          String(item.status || "").toLowerCase().includes(q)
        );
      }
      return (
        String(item.id || "").includes(q) ||
        String(item.booking_status || "").toLowerCase().includes(q)
      );
    });
  }, [invoices, bookings, salesSearch, salesTab]);

  const infoFields = [
    { label: "Mobile", value: customer?.mobile_number, icon: <MdPhone className="h-4 w-4" /> },
    { label: "Address", value: customer?.address, icon: <MdLocationOn className="h-4 w-4" /> },
    { label: "Payment Method", value: customer?.payment_method, icon: <MdCreditCard className="h-4 w-4" /> },
    { label: "Sales Invoices", value: summary.invoiceCount, icon: <MdReceipt className="h-4 w-4" /> },
    { label: "Bookings", value: summary.bookingCount, icon: <MdCalendarToday className="h-4 w-4" /> },
    { label: "Credit Limit", value: "PKR 50,000", icon: <MdAccountBalanceWallet className="h-4 w-4" /> },
    { label: "Sales Due", value: fmtMoney(summary.salesDue), icon: <MdWarning className="h-4 w-4" /> },
    { label: "Bookings Due", value: fmtMoney(summary.bookingDue), icon: <MdWarning className="h-4 w-4" /> },
  ];

  if (loading && !customer) {
    return (
      <PageShell>
        <TableState message="Loading customer account..." />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-5 max-w-7xl mx-auto">
        <AccountDetailHeader
          icon={<MdPeople className="h-6 w-6" />}
          name={customer?.customer_name || "Customer"}
          subtitle={[customer?.mobile_number, customer?.address].filter(Boolean).join(" · ")}
          balanceLabel="Total Receivable"
          balanceAmount={summary.totalReceivable}
          balanceTone="emerald"
          actionLabel={
            <>
              <MdAdd className="h-4 w-4" /> Receive Payment
            </>
          }
          onBack={() => navigate("/finance/customer-account")}
          onAction={() => setShowPaymentModal(true)}
          onRefresh={loadAll}
        />

        <Card className="p-0 overflow-hidden">
          <div className="px-5 pt-2">
            <AccountTabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
          </div>
        </Card>

        {activeTab === "overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <AccountMetricCard
                label="Total Receivable"
                value={summary.totalReceivable}
                subtext="Due from customer"
                tone="emerald"
                icon={<MdAccountBalanceWallet className="h-5 w-5" />}
              />
              <AccountMetricCard
                label="Total Sales"
                value={summary.salesTotal}
                subtext="All time"
                tone="teal"
                icon={<MdReceipt className="h-5 w-5" />}
              />
              <AccountMetricCard
                label="Total Payments"
                value={summary.totalReceived}
                subtext="All time"
                tone="emerald"
                icon={<MdPayment className="h-5 w-5" />}
              />
              <AccountMetricCard
                label="Overdue Amount"
                value={summary.overdueAmount}
                subtext={`${summary.overdueCount} Invoice${summary.overdueCount !== 1 ? "s" : ""} Overdue`}
                tone="rose"
                icon={<MdWarning className="h-5 w-5" />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <AccountInfoPanel
                title="Customer Information"
                fields={infoFields}
                onEdit={() => navigate("/customer/registration")}
              />

              <div className="lg:col-span-2 space-y-5">
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h3 className="text-[14px] font-bold text-slate-800">Recent Invoices</h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("sales-bookings")}
                      className="text-[12px] font-semibold text-teal-600 hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50">
                          <th className="px-5 py-2.5">Invoice No.</th>
                          <th className="px-5 py-2.5">Date</th>
                          <th className="px-5 py-2.5">Due Date</th>
                          <th className="px-5 py-2.5 text-right">Amount</th>
                          <th className="px-5 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {recentInvoices.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-5 py-8 text-center text-[12px] text-slate-400">
                              No invoices yet.
                            </td>
                          </tr>
                        ) : (
                          recentInvoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50/50">
                              <td className="px-5 py-3 text-[12px] font-mono font-semibold">
                                {inv.receipt_no ? `RCP-${inv.receipt_no}` : `INV-${inv.id}`}
                              </td>
                              <td className="px-5 py-3 text-[12px] text-slate-500">{fmtDate(inv.created_at)}</td>
                              <td className="px-5 py-3 text-[12px] text-slate-500">{fmtDate(inv.created_at)}</td>
                              <td className="px-5 py-3 text-right text-[12px] font-mono font-semibold">
                                {fmtMoney(inv.payable)}
                              </td>
                              <td className="px-5 py-3">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${invoiceStatusBadge(inv.status)}`}
                                >
                                  {parseFloat(inv.to_be_paid || 0) > 0 && inv.status !== "paid" ? "Overdue" : inv.status || "pending"}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h3 className="text-[14px] font-bold text-slate-800">Recent Payments</h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("payments")}
                      className="text-[12px] font-semibold text-teal-600 hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  {recentPayments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                      <MdPayment className="h-10 w-10 mb-2 opacity-40" />
                      <p className="text-[13px]">No payments recorded yet.</p>
                      <button
                        type="button"
                        onClick={() => setShowPaymentModal(true)}
                        className="mt-3 text-[12px] font-semibold text-teal-600 hover:underline"
                      >
                        Receive first payment
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left">
                        <thead>
                          <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50">
                            <th className="px-5 py-2.5">Date</th>
                            <th className="px-5 py-2.5">Reference</th>
                            <th className="px-5 py-2.5">Method</th>
                            <th className="px-5 py-2.5 text-right">Amount</th>
                            <th className="px-5 py-2.5">Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {recentPayments.map((p) => (
                            <tr key={`${p.type}-${p.id}`}>
                              <td className="px-5 py-3 text-[12px] text-slate-500">{fmtDate(p.payment_date)}</td>
                              <td className="px-5 py-3 text-[12px] font-mono">{p.reference}</td>
                              <td className="px-5 py-3 text-[12px]">{p.payment_method || "Cash"}</td>
                              <td className="px-5 py-3 text-right text-[12px] font-bold font-mono text-emerald-600">
                                {fmtMoney(p.amount)}
                              </td>
                              <td className="px-5 py-3 text-[12px] text-slate-400">{p.note || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <AccountTimeline events={timelineEvents} />
          </div>
        )}

        {activeTab === "ledger" && (
          <LedgerTable
            ledger={ledger}
            closingBalance={closingBalance}
            entityName={customer?.customer_name}
          />
        )}

        {activeTab === "statements" && (
          <LedgerTable
            ledger={ledger}
            closingBalance={closingBalance}
            entityName={`${customer?.customer_name} — Statement`}
          />
        )}

        {activeTab === "payments" && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <h3 className="text-[14px] font-bold text-slate-800">Payment History</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
                  <input
                    type="text"
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    placeholder="Search payments..."
                    className="h-8 w-52 pl-8 pr-3 rounded-lg border border-slate-200 text-[12px] outline-none focus:border-teal-400"
                    style={{ paddingLeft: "2rem" }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(true)}
                  className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-teal-700"
                >
                  <MdAdd /> Receive
                </button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/80 sticky top-0">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Reference</th>
                    <th className="px-6 py-3">Method</th>
                    <th className="px-6 py-3">Note</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan="6">
                        <TableState message="No payments found." />
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => (
                      <tr key={`${p.type}-${p.id}`} className="hover:bg-slate-50/60">
                        <td className="px-6 py-3 text-[12px] text-slate-500">{fmtDate(p.payment_date)}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${p.type === "Sale" ? "bg-teal-50 text-teal-600" : "bg-indigo-50 text-indigo-600"}`}>
                            {p.type}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-[12px] font-mono font-semibold">{p.reference}</td>
                        <td className="px-6 py-3 text-[12px]">{p.payment_method || "Cash"}</td>
                        <td className="px-6 py-3 text-[12px] text-slate-500">{p.note || "—"}</td>
                        <td className="px-6 py-3 text-right font-bold text-emerald-600 font-mono text-[13px]">
                          {fmtMoney(p.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "sales-bookings" && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <h3 className="text-[14px] font-bold text-slate-800">Sales & Bookings</h3>
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  {["sales", "bookings"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSalesTab(t)}
                      className={`px-4 py-1.5 text-[11px] font-bold rounded-md capitalize transition ${salesTab === t ? "bg-white text-teal-600 shadow-sm" : "text-slate-500"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
                  <input
                    type="text"
                    value={salesSearch}
                    onChange={(e) => setSalesSearch(e.target.value)}
                    placeholder={`Search ${salesTab}...`}
                    className="h-8 w-44 pl-8 pr-3 rounded-lg border border-slate-200 text-[12px] outline-none focus:border-teal-400"
                    style={{ paddingLeft: "2rem" }}
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/80 sticky top-0">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">{salesTab === "sales" ? "Receipt" : "Booking"}</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Total</th>
                    <th className="px-6 py-3 text-right">Paid</th>
                    <th className="px-6 py-3 text-right">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan="6">
                        <TableState message={`No ${salesTab} found.`} />
                      </td>
                    </tr>
                  ) : salesTab === "sales" ? (
                    filteredSales.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60">
                        <td className="px-6 py-3 text-[12px] text-slate-500">{fmtDate(inv.created_at)}</td>
                        <td className="px-6 py-3 text-[12px] font-mono font-semibold">
                          {inv.receipt_no ? `RCP-${inv.receipt_no}` : `INV-${inv.id}`}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${invoiceStatusBadge(inv.status)}`}>
                            {inv.status || "pending"}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right font-mono text-[12px]">{fmtMoney(inv.payable)}</td>
                        <td className="px-6 py-3 text-right font-mono text-[12px] text-emerald-600">{fmtMoney(inv.paid)}</td>
                        <td className="px-6 py-3 text-right font-bold font-mono text-[12px] text-rose-600">{fmtMoney(inv.to_be_paid)}</td>
                      </tr>
                    ))
                  ) : (
                    filteredSales.map((bk) => (
                      <tr key={bk.id} className="hover:bg-slate-50/60">
                        <td className="px-6 py-3 text-[12px] text-slate-500">{fmtDate(bk.created_at || bk.booking_date)}</td>
                        <td className="px-6 py-3 text-[12px] font-mono font-semibold">BKG-{bk.id}</td>
                        <td className="px-6 py-3">
                          <span className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                            {bk.booking_status || bk.payment_status || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right font-mono text-[12px]">{fmtMoney(bk.total_amount || bk.payable)}</td>
                        <td className="px-6 py-3 text-right font-mono text-[12px] text-emerald-600">{fmtMoney(bk.paid)}</td>
                        <td className="px-6 py-3 text-right font-bold font-mono text-[12px] text-rose-600">{fmtMoney(bk.to_be_paid)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <RecordPaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={loadAll}
        type="customer"
        entityId={id}
        entityName={customer?.customer_name}
        outstanding={summary.totalReceivable}
        invoices={invoices}
        bookings={bookings}
      />
    </PageShell>
  );
}
