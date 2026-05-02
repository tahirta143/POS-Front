import { useEffect, useMemo, useState } from "react";
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
  MdHistory,
  MdKeyboardReturn,
  MdRefresh,
  MdReceipt,
  MdPerson,
  MdPriceCheck,
  MdShoppingBag,
  MdBookOnline,
} from "react-icons/md";

const sectionStyles = {
  teal: { accent: "bg-teal-500", header: "border-teal-100 bg-teal-50/80" },
};

function SectionCard({ title, children }) {
  const style = sectionStyles.teal;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
      <div
        className={`mb-2 flex items-center gap-2 rounded-md border px-2 py-1 ${style.header}`}
      >
        <span className={`h-3 w-1 rounded-full ${style.accent}`} />
        <h3 className="text-[12px] font-bold text-slate-800 uppercase tracking-tight">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function Tab({ active, onClick, icon, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold transition-all ${
        active
          ? "bg-teal-600 text-white shadow-md shadow-teal-100"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
    >
      {icon}
      {label}
      {count > 0 && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"}`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default function SalesReturnPage() {
  // ── Tab state ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("sale"); // "sale" | "booking"

  // ── Data ────────────────────────────────────────────────────────────────────
  const [saleInvoices, setSaleInvoices] = useState([]);
  const [bookingInvoices, setBookingInvoices] = useState([]);
  const [recentReturns, setRecentReturns] = useState([]);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchSaleInvoices();
    fetchBookingInvoices();
    fetchRecentReturns();
  }, []);

  async function fetchSaleInvoices() {
    try {
      const res = await axiosInstance.get("/sale-invoices");
      setSaleInvoices(
        Array.isArray(res.data) ? res.data : res.data?.data || [],
      );
    } catch {
      toast.error("Failed to load sale invoices.");
    }
  }

  async function fetchBookingInvoices() {
    try {
      const res = await axiosInstance
        .get("/bookings")
        .catch(() => ({ data: [] }));

      // Handle different response formats
      let data = [];
      if (res.data?.data && Array.isArray(res.data.data)) {
        data = res.data.data;
      } else if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data?.data && !Array.isArray(res.data.data)) {
        data = [];
      }

      // Show bookings that are either Completed OR have Paid payment status OR have paid amount > 0
      setBookingInvoices(
        data.filter(
          (b) =>
            b.booking_status === "Completed" ||
            b.payment_status === "Paid" ||
            (b.paid && parseFloat(b.paid) > 0),
        ),
      );
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookingInvoices([]);
    }
  }

  async function fetchRecentReturns() {
    setLoadingReturns(true);
    try {
      const res = await axiosInstance.get("/sale-returns");
      setRecentReturns(
        Array.isArray(res.data) ? res.data : res.data?.data || [],
      );
    } catch {
      setRecentReturns([]);
    } finally {
      setLoadingReturns(false);
    }
  }

  // ── Invoice selection ────────────────────────────────────────────────────────
  function handleInvoiceChange(e) {
    const list = activeTab === "sale" ? saleInvoices : bookingInvoices;
    const inv = list.find((i) => String(i.id) === String(e.target.value));
    setSelectedInvoice(inv || null);
    setDiscount(0);

    if (inv?.items?.length) {
      setReturnItems(
        inv.items.map((item, idx) => {
          // Normalize item structure for both sale and booking invoices
          const normalizedItem = {
            ...item,
            uniqueId: `${item.item_id || item.id}_${idx}_${Date.now()}`,
            returnQty: 0,
          };

          // For booking items, calculate total if not present
          if (
            activeTab === "booking" &&
            !item.total &&
            item.price &&
            item.qty
          ) {
            normalizedItem.total = Number(item.price) * Number(item.qty);
          }

          // Ensure qty field exists and is numeric
          if (normalizedItem.qty === undefined && item.qty) {
            normalizedItem.qty = Number(item.qty);
          } else if (normalizedItem.qty !== undefined) {
            normalizedItem.qty = Number(normalizedItem.qty);
          }

          // Ensure price field exists
          if (!normalizedItem.price && item.price) {
            normalizedItem.price = Number(item.price);
          }

          return normalizedItem;
        }),
      );
    } else {
      setReturnItems([]);
    }
  }

  function handleQtyChange(uniqueId, qty) {
    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.uniqueId !== uniqueId) return item;
        const parsed = qty === "" ? 0 : Number(qty);
        const safe = isNaN(parsed) ? 0 : parsed;
        const maxQty = Number(item.qty || 0);
        return { ...item, returnQty: Math.min(Math.max(0, safe), maxQty) };
      }),
    );
  }

  // ── Computed totals ──────────────────────────────────────────────────────────
  const grossReturnValue = useMemo(() => {
    return returnItems.reduce((sum, item) => {
      const soldQty = Number(item.qty || 0);
      let rate = 0;

      if (activeTab === "booking") {
        // For bookings, use price directly
        rate = Number(item.price || 0);
      } else {
        // For sales, calculate from total/qty
        const lineTotal = Number(item.total || 0);
        rate =
          soldQty > 0
            ? lineTotal / soldQty
            : Number(item.sale_price || item.price || 0);
      }

      return sum + Number(item.returnQty || 0) * rate;
    }, 0);
  }, [returnItems, activeTab]);

  const discountAmt = Math.min(parseFloat(discount) || 0, grossReturnValue);
  const netReturnValue = Math.max(0, grossReturnValue - discountAmt);

  // Total paid on the original invoice (from backend)
  const totalPaid = useMemo(() => {
    if (!selectedInvoice) return 0;
    return parseFloat(selectedInvoice.paid || selectedInvoice.paid_amount || 0);
  }, [selectedInvoice]);

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    const itemsToReturn = returnItems.filter((i) => i.returnQty > 0);
    if (!selectedInvoice) {
      toast.error("Please select an invoice.");
      return;
    }
    if (itemsToReturn.length === 0) {
      toast.error("Add at least one item to return.");
      return;
    }

    setSubmitting(true);
    try {
      const normalizedItems = itemsToReturn.map((item) => {
        let unitPrice;

        if (activeTab === "booking") {
          // For bookings, use price directly
          unitPrice = Number(item.price || 0);
        } else {
          // For sales, calculate from total/qty
          const soldQty = Number(item.qty || 0);
          const lineTotal = Number(item.total || 0);
          unitPrice =
            soldQty > 0
              ? lineTotal / soldQty
              : Number(item.sale_price || item.price || 0);
        }

        return {
          item_id: item.item_id || item.id,
          qty: Number(item.returnQty),
          price: unitPrice,
          total: Number(item.returnQty) * unitPrice,
        };
      });

      const payload = {
        saleInvoiceId: selectedInvoice.id,
        customerId: selectedInvoice.customer_id,
        returnDate: new Date().toISOString().split("T")[0],
        items: normalizedItems,
        discount: discountAmt,
        totalAmount: netReturnValue,
        reason: "Sales return",
        sourceType: activeTab, // "sale" or "booking"
      };

      if (editId) {
        await axiosInstance.put(`/sale-returns/${editId}`, payload);
        toast.success("Return updated successfully.");
      } else {
        await axiosInstance.post("/sale-returns", payload);
        toast.success("Return recorded successfully.");
      }

      fetchRecentReturns();
      resetForm();
      setIsFormOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save return.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Edit / Delete ────────────────────────────────────────────────────────────
  function handleEdit(record) {
    const list = activeTab === "sale" ? saleInvoices : bookingInvoices;
    const invoice = list.find(
      (inv) => String(inv.id) === String(record.sale_invoice_id),
    );
    if (!invoice) {
      toast.error("Original invoice data unavailable.");
      return;
    }

    const returnQtyMap = new Map(
      (record.items || []).map((item) => [
        String(item.item_id),
        Number(item.qty || 0),
      ]),
    );

    setEditId(record.id);
    setSelectedInvoice(invoice);
    setDiscount(parseFloat(record.discount || 0));
    setReturnItems(
      (invoice.items || []).map((item, idx) => {
        const normalizedItem = {
          ...item,
          uniqueId: `${item.item_id || item.id}_${idx}_${Date.now()}_edit`,
          returnQty: returnQtyMap.get(String(item.item_id || item.id)) || 0,
        };

        // Normalize for bookings
        if (activeTab === "booking" && !item.total && item.price && item.qty) {
          normalizedItem.total = Number(item.price) * Number(item.qty);
        }

        return normalizedItem;
      }),
    );
    setIsFormOpen(true);
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(returnId) {
    if (!window.confirm("Delete this sales return? Stock will be restored."))
      return;
    try {
      await axiosInstance.delete(`/sale-returns/${returnId}`);
      toast.success("Return deleted.");
      fetchRecentReturns();
      if (editId === returnId) resetForm();
    } catch {
      toast.error("Failed to delete return.");
    }
  }

  function resetForm() {
    setEditId(null);
    setSelectedInvoice(null);
    setReturnItems([]);
    setDiscount(0);
  }

  const invoiceList = activeTab === "sale" ? saleInvoices : bookingInvoices;

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Sales Return (Credit Note)
            </h1>
            <p className="text-sm text-slate-500">
              Process merchandise returns and adjust customer accounts.
            </p>
          </div>
          <button
            onClick={() => {
              if (isFormOpen && editId) {
                resetForm();
                return;
              }
              const opening = !isFormOpen;
              setIsFormOpen(opening);
              if (opening) resetForm();
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition shadow-sm ${
              isFormOpen
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                : "bg-teal-600 text-white hover:bg-teal-700 hover:shadow-teal-100"
            }`}
          >
            {isFormOpen ? (
              <>
                <MdRemove className="h-5 w-5" /> Close Form
              </>
            ) : (
              <>
                <MdAdd className="h-5 w-5" /> New Return
              </>
            )}
          </button>
        </div>

        {/* Form */}
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
                  title={editId ? "Modify Return Entry" : "Process New Return"}
                  description="Select the source invoice and specify items to return."
                  icon={<MdKeyboardReturn className="h-6 w-6 text-teal-600" />}
                />

                {/* ── Source Type Tabs ── */}
                <div className="mt-4 flex gap-2">
                  <Tab
                    active={activeTab === "sale"}
                    onClick={() => {
                      setActiveTab("sale");
                      resetForm();
                    }}
                    icon={<MdShoppingBag className="h-4 w-4" />}
                    label="Sale Invoices"
                    count={saleInvoices.length}
                  />
                  <Tab
                    active={activeTab === "booking"}
                    onClick={() => {
                      setActiveTab("booking");
                      resetForm();
                    }}
                    icon={<MdBookOnline className="h-4 w-4" />}
                    label="Booking Invoices"
                    count={bookingInvoices.length}
                  />
                </div>

                <div className="mt-4 space-y-4">
                  {/* Invoice selector */}
                  <SectionCard
                    title={
                      activeTab === "sale"
                        ? "Sale Invoice Reference"
                        : "Booking Invoice Reference"
                    }
                  >
                    <div className="mt-1 grid gap-4 lg:grid-cols-3">
                      <Field
                        label="Select Invoice"
                        required
                        className="lg:col-span-2"
                      >
                        <div className="relative">
                          <select
                            onChange={handleInvoiceChange}
                            value={selectedInvoice?.id || ""}
                            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-700 focus:border-teal-400 focus:ring-4 focus:ring-teal-50 outline-none transition"
                          >
                            <option value="">
                              {activeTab === "sale"
                                ? "Search receipt / invoice ID..."
                                : "Search booking ID..."}
                            </option>
                            {invoiceList.map((inv) => (
                              <option key={inv.id} value={inv.id}>
                                {activeTab === "sale"
                                  ? `${inv.receipt_no || `INV-${inv.id}`} — ${inv.customer_name || "Customer"}`
                                  : `BKG-${inv.id} — ${inv.customer_name || inv.client_name || "Customer"}`}
                              </option>
                            ))}
                          </select>
                          <MdReceipt className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </Field>

                      {/* Credit amount badge */}
                      {selectedInvoice && (
                        <div className="flex flex-col justify-center rounded-xl bg-teal-50 border border-teal-100 px-4 py-2">
                          <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">
                            Net Credit
                          </p>
                          <p className="text-lg font-black text-teal-700 font-mono">
                            PKR{" "}
                            {netReturnValue.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </SectionCard>

                  {/* Invoice info cards */}
                  {selectedInvoice && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* Customer + Invoice ref + Paid amount */}
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 border border-slate-100">
                            <MdPerson className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              Customer
                            </p>
                            <p className="text-[12px] font-bold text-slate-700 truncate">
                              {selectedInvoice.customer_name ||
                                "Walking Customer"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 border border-slate-100">
                            <MdReceipt className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              Invoice Ref
                            </p>
                            <p className="text-[12px] font-bold text-slate-700">
                              {activeTab === "sale"
                                ? selectedInvoice.receipt_no ||
                                  `#${selectedInvoice.id}`
                                : `BKG-${selectedInvoice.id}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-500 border border-emerald-100">
                            <MdPriceCheck className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                              Total Paid
                            </p>
                            <p className="text-[12px] font-black text-emerald-700 font-mono">
                              PKR{" "}
                              {totalPaid.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Items table */}
                      <SectionCard title="Return Items">
                        <div className="rounded-xl border border-slate-100 overflow-hidden mt-1">
                          <table className="w-full text-left text-[12px]">
                            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              <tr>
                                <th className="px-4 py-3">Item</th>
                                <th className="px-4 py-3 text-right">
                                  Sold Qty
                                </th>
                                <th className="px-4 py-3 text-right">
                                  Unit Rate
                                </th>
                                <th className="px-4 py-3 text-center">
                                  Return Qty
                                </th>
                                <th className="px-4 py-3 text-right">Credit</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                              {returnItems.map((item) => {
                                const soldQty = Number(item.qty || 0);
                                let rate = 0;

                                if (activeTab === "booking") {
                                  // For bookings, use price directly
                                  rate = Number(item.price || 0);
                                } else {
                                  // For sales, calculate from total/qty
                                  const lineTotal = Number(item.total || 0);
                                  rate =
                                    soldQty > 0
                                      ? lineTotal / soldQty
                                      : Number(
                                          item.sale_price || item.price || 0,
                                        );
                                }

                                const credit =
                                  rate * Number(item.returnQty || 0);
                                return (
                                  <tr
                                    key={item.uniqueId}
                                    className="hover:bg-slate-50/50"
                                  >
                                    <td className="px-4 py-3 font-semibold text-slate-700">
                                      {item.item_name}
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-500">
                                      {soldQty}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                                      PKR{" "}
                                      {rate.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                      })}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <input
                                        type="number"
                                        min="0"
                                        max={soldQty}
                                        value={
                                          item.returnQty === 0
                                            ? ""
                                            : item.returnQty
                                        }
                                        placeholder="0"
                                        onChange={(e) =>
                                          handleQtyChange(
                                            item.uniqueId,
                                            e.target.value,
                                          )
                                        }
                                        className="h-8 w-20 rounded-lg border border-slate-200 bg-white px-2 text-center font-bold text-teal-700 focus:border-teal-400 outline-none"
                                      />
                                    </td>
                                    <td className="px-4 py-3 text-right font-black text-teal-700 font-mono">
                                      {credit > 0
                                        ? `PKR ${credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                        : "—"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </SectionCard>

                      {/* Totals + Discount */}
                      <SectionCard title="Return Summary">
                        <div className="space-y-2 py-1 text-[13px]">
                          <div className="flex justify-between items-center text-slate-500">
                            <span>Gross Return Value</span>
                            <span className="font-bold text-slate-700 font-mono">
                              PKR{" "}
                              {grossReturnValue.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500 flex-1">
                              Discount on Return
                            </span>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max={grossReturnValue}
                                value={discount}
                                onChange={(e) => setDiscount(e.target.value)}
                                className="h-8 w-36 rounded-lg border border-slate-300 bg-white px-3 text-right text-[12px] font-bold outline-none focus:border-teal-400"
                              />
                              <span className="absolute right-2.5 top-1.5 text-[9px] font-bold text-slate-400 uppercase">
                                PKR
                              </span>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                            <span className="font-bold text-slate-700">
                              Net Credit to Customer
                            </span>
                            <span className="text-xl font-black text-teal-600 font-mono">
                              PKR{" "}
                              {netReturnValue.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>
                      </SectionCard>

                      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            resetForm();
                            setIsFormOpen(false);
                          }}
                          className="rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 transition"
                        >
                          Discard
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          onClick={handleSubmit}
                          className="inline-flex min-w-[200px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition disabled:opacity-50"
                        >
                          {submitting
                            ? "Recording..."
                            : editId
                              ? "Update Credit Note"
                              : "Authorize Return"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Returns Registry */}
        <Card className="mx-auto max-w-5xl p-0 overflow-hidden">
          <SectionHeader
            title="Return Registry"
            description="Archive of all processed merchandise returns."
            icon={<MdHistory className="h-6 w-6 text-teal-600" />}
            action={
              <div className="p-4">
                <button
                  type="button"
                  onClick={fetchRecentReturns}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <MdRefresh className="inline mr-1" /> Refresh
                </button>
              </div>
            }
          />
          {loadingReturns ? (
            <TableState message="Loading returns..." />
          ) : recentReturns.length === 0 ? (
            <TableState message="No sales returns recorded." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">Return ID</th>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Invoice Ref</th>
                    <th className="px-5 py-4 text-right">Discount</th>
                    <th className="px-5 py-4 text-right">Net Credit</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {recentReturns.map((record) => (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`group transition-colors hover:bg-teal-50/30 ${editId === record.id ? "bg-teal-50/50" : ""}`}
                    >
                      <td className="px-5 py-4 font-mono text-[11px] text-slate-400">
                        #RTN-{String(record.id).padStart(4, "0")}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800 text-[13px]">
                        {record.customer_name || "Walking Customer"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-semibold text-slate-600">
                            {record.invoice_ref ||
                              record.receipt_no ||
                              `#${record.sale_invoice_id}`}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {record.return_date
                              ? new Date(
                                  record.return_date,
                                ).toLocaleDateString()
                              : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-[12px] font-semibold text-amber-600 font-mono">
                        {parseFloat(record.discount || 0) > 0
                          ? `PKR ${Number(record.discount).toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="px-5 py-4 text-right font-black text-teal-700 font-mono text-[13px]">
                        PKR {Number(record.total_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionButton
                            label="Edit"
                            tone="teal"
                            onClick={() => handleEdit(record)}
                          />
                          <ActionButton
                            label="Delete"
                            tone="rose"
                            onClick={() => handleDelete(record.id)}
                          />
                        </div>
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
