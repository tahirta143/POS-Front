import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  MdFactory,
  MdReceipt,
  MdPayment,
  MdShoppingCart,
  MdDashboard,
  MdSearch,
  MdPhone,
  MdEmail,
  MdLocationOn,
  MdCreditCard,
  MdAccountBalanceWallet,
  MdDescription,
  MdWarning,
  MdAdd,
  MdPerson,
} from "react-icons/md";
import { toast } from "react-toastify";
import { Card, PageShell, StatusChip, TableState } from "../../components/layout/PageShell.jsx";
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
  { id: "purchases", label: "Purchases", icon: <MdShoppingCart className="text-base" /> },
  { id: "statements", label: "Statements", icon: <MdDescription className="text-base" /> },
];

export default function SupplierAccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const [supplier, setSupplier] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const setActiveTab = (tab) => setSearchParams(tab === "overview" ? {} : { tab });

  const fetchSupplier = useCallback(async () => {
    const res = await axiosInstance.get(`/suppliers/${id}`);
    setSupplier(res.data);
  }, [id]);

  const fetchLedger = useCallback(async () => {
    const res = await axiosInstance.get(`/supplier-ledger/${id}`);
    setLedgerData(res.data);
  }, [id]);

  const fetchPayments = useCallback(async () => {
    const res = await axiosInstance.get(`/supplier-payments?supplierId=${id}`);
    setPayments(Array.isArray(res.data) ? res.data : res.data?.data || []);
  }, [id]);

  const fetchPurchases = useCallback(async () => {
    const res = await axiosInstance.get("/purchases");
    const all = Array.isArray(res.data) ? res.data : res.data?.data || [];
    setPurchases(all.filter((p) => String(p.supplier_id) === String(id)));
  }, [id]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchSupplier(), fetchLedger(), fetchPayments(), fetchPurchases()]);
    } catch {
      toast.error("Failed to load supplier account.");
    } finally {
      setLoading(false);
    }
  }, [fetchSupplier, fetchLedger, fetchPayments, fetchPurchases]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const closingBalance = ledgerData?.closingBalance ?? 0;
  const ledger = ledgerData?.ledger || [];

  const summary = useMemo(() => {
    const totalPurchases = purchases.reduce((s, p) => s + parseFloat(p.payable || 0), 0);
    const totalPaid = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const totalPayable = purchases.reduce((s, p) => s + parseFloat(p.to_be_paid || 0), 0);
    const overduePurchases = countOverdue(purchases);
    const overdueAmount = overduePurchases.reduce((s, p) => s + parseFloat(p.to_be_paid || 0), 0);
    return {
      totalPurchases,
      totalPaid,
      totalPayable,
      overdueAmount,
      overdueCount: overduePurchases.length,
      purchaseCount: purchases.length,
      paymentCount: payments.length,
    };
  }, [purchases, payments]);

  const timelineEvents = useMemo(
    () =>
      buildTimelineEvents({
        purchases: purchases.slice(0, 5),
        payments: payments.map((p) => ({ ...p, direction: "outgoing" })).slice(0, 5),
      }),
    [purchases, payments],
  );

  const recentPurchases = useMemo(
    () => [...purchases].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5),
    [purchases],
  );
  const recentPayments = payments.slice(0, 5);

  const filteredPayments = useMemo(() => {
    const q = paymentSearch.toLowerCase();
    if (!q) return payments;
    return payments.filter(
      (p) =>
        String(p.payment_method || "").toLowerCase().includes(q) ||
        String(p.note || "").toLowerCase().includes(q) ||
        String(p.invoice_no || "").toLowerCase().includes(q),
    );
  }, [payments, paymentSearch]);

  const filteredPurchases = useMemo(() => {
    const q = purchaseSearch.toLowerCase();
    if (!q) return purchases;
    return purchases.filter(
      (p) =>
        String(p.invoice_no || "").toLowerCase().includes(q) ||
        String(p.payment_status || "").toLowerCase().includes(q),
    );
  }, [purchases, purchaseSearch]);

  const infoFields = [
    { label: "Contact Person", value: supplier?.contact_person, icon: <MdPerson className="h-4 w-4" /> },
    { label: "Phone", value: supplier?.phone, icon: <MdPhone className="h-4 w-4" /> },
    { label: "Email", value: supplier?.email, icon: <MdEmail className="h-4 w-4" /> },
    { label: "Address", value: supplier?.address, icon: <MdLocationOn className="h-4 w-4" /> },
    { label: "Payment Terms", value: supplier?.payment_terms, icon: <MdCreditCard className="h-4 w-4" /> },
    { label: "Credit Limit", value: supplier?.credit_limit ? fmtMoney(supplier.credit_limit) : "—", icon: <MdAccountBalanceWallet className="h-4 w-4" /> },
    { label: "Purchases", value: summary.purchaseCount, icon: <MdShoppingCart className="h-4 w-4" /> },
    { label: "Payments", value: summary.paymentCount, icon: <MdPayment className="h-4 w-4" /> },
  ];

  if (loading && !supplier) {
    return (
      <PageShell>
        <TableState message="Loading supplier account..." />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-5 max-w-7xl mx-auto">
        <AccountDetailHeader
          icon={<MdFactory className="h-6 w-6" />}
          name={supplier?.supplier_name || "Supplier"}
          subtitle={
            <span className="flex items-center gap-2 flex-wrap">
              {supplier?.phone}
              {supplier?.email && ` · ${supplier.email}`}
              {supplier && <StatusChip enabled={supplier.status === 1 || supplier.status === true} />}
            </span>
          }
          balanceLabel="Total Payable"
          balanceAmount={summary.totalPayable}
          balanceTone="rose"
          actionLabel={
            <>
              <MdAdd className="h-4 w-4" /> Pay Supplier
            </>
          }
          onBack={() => navigate("/finance/supplier-account")}
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
                label="Total Payable"
                value={summary.totalPayable}
                subtext="Due to supplier"
                tone="rose"
                icon={<MdAccountBalanceWallet className="h-5 w-5" />}
              />
              <AccountMetricCard
                label="Total Purchases"
                value={summary.totalPurchases}
                subtext="All time"
                tone="teal"
                icon={<MdShoppingCart className="h-5 w-5" />}
              />
              <AccountMetricCard
                label="Total Payments"
                value={summary.totalPaid}
                subtext="All time"
                tone="emerald"
                icon={<MdPayment className="h-5 w-5" />}
              />
              <AccountMetricCard
                label="Overdue Amount"
                value={summary.overdueAmount}
                subtext={`${summary.overdueCount} Purchase${summary.overdueCount !== 1 ? "s" : ""} Overdue`}
                tone="rose"
                icon={<MdWarning className="h-5 w-5" />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <AccountInfoPanel
                title="Supplier Information"
                fields={infoFields}
                onEdit={() => navigate("/setup/suppliers")}
              />

              <div className="lg:col-span-2 space-y-5">
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h3 className="text-[14px] font-bold text-slate-800">Recent Purchases</h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("purchases")}
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
                          <th className="px-5 py-2.5 text-right">Amount</th>
                          <th className="px-5 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {recentPurchases.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-5 py-8 text-center text-[12px] text-slate-400">
                              No purchases yet.
                            </td>
                          </tr>
                        ) : (
                          recentPurchases.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/50">
                              <td className="px-5 py-3 text-[12px] font-mono font-semibold">
                                {p.invoice_no ? `INV-${p.invoice_no}` : `PO-${p.id}`}
                              </td>
                              <td className="px-5 py-3 text-[12px] text-slate-500">{fmtDate(p.created_at)}</td>
                              <td className="px-5 py-3 text-right text-[12px] font-mono font-semibold">
                                {fmtMoney(p.payable)}
                              </td>
                              <td className="px-5 py-3">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${invoiceStatusBadge(p.payment_status === "partial" ? "partially_paid" : p.payment_status)}`}
                                >
                                  {parseFloat(p.to_be_paid || 0) > 0 && p.payment_status !== "paid" ? "Overdue" : p.payment_status || "unpaid"}
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
                        Pay supplier now
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
                            <tr key={p.id}>
                              <td className="px-5 py-3 text-[12px] text-slate-500">{fmtDate(p.payment_date)}</td>
                              <td className="px-5 py-3 text-[12px] font-mono">
                                {p.invoice_no ? `INV-${p.invoice_no}` : `PAY-${p.id}`}
                              </td>
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
            entityName={supplier?.supplier_name}
          />
        )}

        {activeTab === "statements" && (
          <LedgerTable
            ledger={ledger}
            closingBalance={closingBalance}
            entityName={`${supplier?.supplier_name} — Statement`}
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
                  <MdAdd /> Pay
                </button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/80 sticky top-0">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Reference</th>
                    <th className="px-6 py-3">Method</th>
                    <th className="px-6 py-3">Note</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan="5">
                        <TableState message="No payments found." />
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="px-6 py-3 text-[12px] text-slate-500">{fmtDate(p.payment_date)}</td>
                        <td className="px-6 py-3 text-[12px] font-mono font-semibold">
                          {p.invoice_no ? `INV-${p.invoice_no}` : `PAY-${p.id}`}
                        </td>
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

        {activeTab === "purchases" && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <h3 className="text-[14px] font-bold text-slate-800">Purchase Orders</h3>
              <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
                <input
                  type="text"
                  value={purchaseSearch}
                  onChange={(e) => setPurchaseSearch(e.target.value)}
                  placeholder="Search purchases..."
                  className="h-8 w-52 pl-8 pr-3 rounded-lg border border-slate-200 text-[12px] outline-none focus:border-teal-400"
                  style={{ paddingLeft: "2rem" }}
                />
              </div>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/80 sticky top-0">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Invoice</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Payable</th>
                    <th className="px-6 py-3 text-right">Paid</th>
                    <th className="px-6 py-3 text-right">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan="6">
                        <TableState message="No purchases found." />
                      </td>
                    </tr>
                  ) : (
                    filteredPurchases.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="px-6 py-3 text-[12px] text-slate-500">{fmtDate(p.created_at)}</td>
                        <td className="px-6 py-3 text-[12px] font-mono font-semibold">
                          {p.invoice_no ? `INV-${p.invoice_no}` : `PO-${p.id}`}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${invoiceStatusBadge(p.payment_status === "partial" ? "partially_paid" : p.payment_status)}`}>
                            {p.payment_status || "unpaid"}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right font-mono text-[12px]">{fmtMoney(p.payable)}</td>
                        <td className="px-6 py-3 text-right font-mono text-[12px] text-emerald-600">{fmtMoney(p.paid)}</td>
                        <td className="px-6 py-3 text-right font-bold font-mono text-[12px] text-rose-600">{fmtMoney(p.to_be_paid)}</td>
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
        type="supplier"
        entityId={id}
        entityName={supplier?.supplier_name}
        outstanding={summary.totalPayable}
        purchases={purchases}
      />
    </PageShell>
  );
}
