import { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  ActionButton,
  Card,
  Field,
  PageShell,
  SectionHeader,
  TableState,
} from "../../components/layout/PageShell.jsx";
import axiosInstance from "../../services/axiosInstance";
import {
  MdAdd,
  MdRemove,
  MdRefresh,
  MdReceipt,
  MdAssignmentTurnedIn,
  MdHistory,
  MdInventory,
  MdSubtitles,
} from "react-icons/md";

const sectionStyles = {
  teal: { accent: "bg-teal-500", header: "border-teal-100 bg-teal-50/80" },
};

function SectionCard({ title, children }) {
  const style = sectionStyles.teal;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-2 shadow-sm transition-colors">
      <div
        className={`mb-2 flex items-center gap-2 rounded-md border px-2 py-1 ${style.header} dark:bg-teal-600 dark:border-teal-500/50 transition-colors`}
      >
        <span
          className={`h-3 w-1 rounded-full ${style.accent} dark:bg-white`}
        />
        <h3 className="text-[12px] font-bold text-slate-800 dark:text-white uppercase tracking-tight">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function ReceiptIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
      />
    </svg>
  );
}

export default function GoodsReceiptNotePage() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [grnNo, setGrnNo] = useState("");
  const [grnDate, setGrnDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchPurchaseOrders();
    setGrnDate(new Date().toISOString().slice(0, 10));
  }, []);

  async function fetchPurchaseOrders() {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/purchases?status=pending");
      const data = response.data;
      setPurchaseOrders(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error("Failed to load pending purchase orders.");
    } finally {
      setLoading(false);
    }
  }

  const handlePOSelection = (e) => {
    const poId = e.target.value;
    const po = purchaseOrders.find((p) => String(p.id) === String(poId));
    setSelectedPO(po);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPO) {
      toast.error("Please select a Purchase Order.");
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post(`/purchases/receipts`, {
        purchaseOrderId: selectedPO.id,
        grn_no: grnNo,
        grn_date: grnDate,
        remarks,
      });
      toast.success("Goods Receipt Note recorded successfully!");
      resetForm();
      setIsFormOpen(false);
      fetchPurchaseOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to record GRN.");
    } finally {
      setSubmitting(false);
    }
  };

  function resetForm() {
    setSelectedPO(null);
    setGrnNo("");
    setRemarks("");
    setGrnDate(new Date().toISOString().slice(0, 10));
  }

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Goods Receipt Note (GRN)
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Acknowledge arrivals and update stock levels against orders.
            </p>
          </div>
          <button
            onClick={() => {
              setIsFormOpen(!isFormOpen);
              if (!isFormOpen) resetForm();
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition duration-300 shadow-sm ${
              isFormOpen
                ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                : "bg-teal-600 text-white hover:bg-teal-700 hover:shadow-teal-100"
            }`}
          >
            {isFormOpen ? (
              <>
                <MdRemove className="h-5 w-5" /> Close Form
              </>
            ) : (
              <>
                <MdAdd className="h-5 w-5" /> Initiate GRN
              </>
            )}
          </button>
        </div>

        {/* Collapsible Form */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <Card className="mx-auto max-w-5xl border-l-[6px] border-l-teal-500 p-6 mb-6">
                <SectionHeader
                  title="Inventory Acceptance"
                  description="Validate order accuracy and condition of received supplies."
                  icon={
                    <MdAssignmentTurnedIn className="h-6 w-6 text-teal-600" />
                  }
                />

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <SectionCard title="Acceptance Protocol">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Field label="Target Purchase Order" required>
                        <div className="relative">
                          <select
                            value={selectedPO?.id || ""}
                            onChange={handlePOSelection}
                            className="h-10 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 font-semibold text-slate-700 dark:text-slate-200 focus:border-teal-400 focus:ring-4 focus:ring-teal-50/10 outline-none transition"
                            disabled={loading}
                          >
                            <option value="">Select Pending Order...</option>
                            {purchaseOrders.map((po) => (
                              <option key={po.id} value={po.id}>
                                {po.grn_no || po.invoice_no || `PO-${po.id}`} —{" "}
                                {po.supplier_name}
                              </option>
                            ))}
                          </select>
                          <MdReceipt className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        </div>
                      </Field>
                      <Field label="GRN NO" required>
                        <input
                          type="text"
                          value={grnNo}
                          onChange={(e) => setGrnNo(e.target.value)}
                          placeholder="GRN number"
                          className="h-10 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-800 dark:text-slate-200 focus:border-teal-400 outline-none transition"
                        />
                      </Field>
                      <Field label="GRN Date" required>
                        <input
                          type="date"
                          value={grnDate}
                          onChange={(e) => setGrnDate(e.target.value)}
                          className="h-10 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 font-semibold text-slate-700 dark:text-slate-200 focus:border-teal-400 outline-none transition"
                        />
                      </Field>
                      <Field
                        label="Condition / Remarks"
                        className="col-span-1 md:col-span-2 lg:col-span-4"
                      >
                        <textarea
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Provide detailed notes regarding the physical condition, batch expiration, damage reports, or any special handling instructions..."
                          className="h-24 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-3 text-sm focus:border-teal-400 outline-none transition"
                        />
                      </Field>
                    </div>
                  </SectionCard>

                  {selectedPO && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <SectionCard title="Itemized Orders for Verification">
                        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                          <table className="w-full text-left text-[12px] transition-colors">
                            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-teal-400">
                              <tr>
                                <th className="px-4 py-3">Catalog Item</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3 text-right">
                                  Inward Qty
                                </th>
                                <th className="px-4 py-3 text-right">
                                  Acq. Rate
                                </th>
                                <th className="px-4 py-3 text-right">
                                  Line Total
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-900 transition-colors">
                              {selectedPO.items.map((item, idx) => (
                                <tr
                                  key={idx}
                                  className="hover:bg-teal-50/20 dark:hover:bg-teal-900/10 transition-colors"
                                >
                                  <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                                    {item.item_name}
                                  </td>
                                  <td className="px-4 py-3 font-medium text-slate-500 uppercase tracking-tighter text-[10px]">
                                    {item.category_name}
                                  </td>
                                  <td className="px-4 py-3 text-right font-black text-slate-700">
                                    {item.quantity}
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono text-slate-500">
                                    PKR{" "}
                                    {Number(
                                      item.purchase_price,
                                    ).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 text-right font-black text-teal-700">
                                    PKR {Number(item.total).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-slate-50/50">
                                <td
                                  colSpan="4"
                                  className="px-4 py-4 text-right text-[11px] font-bold uppercase text-slate-500"
                                >
                                  Grand Total Valuation
                                </td>
                                <td className="px-4 py-4 text-right font-black text-teal-700 text-base font-mono">
                                  PKR{" "}
                                  {Number(selectedPO.payable).toLocaleString()}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </SectionCard>
                    </motion.div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setIsFormOpen(false);
                      }}
                      className="rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !selectedPO}
                      className="inline-flex min-w-[200px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg focus:ring-4 focus:ring-teal-100 hover:bg-teal-700 transition disabled:opacity-50"
                    >
                      <MdInventory className="h-5 w-5" />{" "}
                      {submitting
                        ? "Updating Stock..."
                        : "Confirm Goods Receipt"}
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History / Pending Table */}
        <Card className="mx-auto max-w-5xl p-0 overflow-hidden">
          <SectionHeader
            title="Pending Receipt Verification"
            description="Acquisitions awaiting physical verification and stock entry."
            icon={<MdHistory className="h-6 w-6 text-teal-600" />}
            action={
              <div className="p-4">
                <button
                  type="button"
                  onClick={fetchPurchaseOrders}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <MdRefresh className="inline mr-1" /> Refresh
                </button>
              </div>
            }
          />
          {loading ? (
            <TableState message="Syncing with procurement database..." />
          ) : purchaseOrders.length === 0 ? (
            <TableState message="No pending goods receipts found." />
          ) : (
            <div className="overflow-x-auto w-full transition-colors">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-teal-400">
                    <th className="px-5 py-4">Reference</th>
                    <th className="px-5 py-4">Sourcing Supplier</th>
                    <th className="px-5 py-4">Date Ordered</th>
                    <th className="px-5 py-4 text-right">Items</th>
                    <th className="px-4 py-4 text-right">Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-900 transition-colors">
                  {purchaseOrders.map((po) => (
                    <motion.tr
                      key={po.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group transition-colors hover:bg-teal-50/30 dark:hover:bg-teal-900/10"
                    >
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-[12px]">
                            {po.grn_no || po.invoice_no || `PO-${po.id}`}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {po.id}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800 text-[13px]">
                        {po.supplier_name}
                      </td>
                      <td className="px-5 py-4 text-[12px] text-slate-500">
                        {new Date(
                          po.created_at || Date.now(),
                        ).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right font-black text-slate-700">
                        {po.items?.length || 0}
                      </td>
                      <td className="px-4 py-4 text-right font-black text-teal-700">
                        PKR {Number(po.payable || 0).toLocaleString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
