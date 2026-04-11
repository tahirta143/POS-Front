import { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  Field,
  PageShell,
  SectionHeader,
  TableState,
  ActionButton,
  StatusChip,
} from "../components/layout/PageShell.jsx";
import axiosInstance from "../services/axiosInstance";
import {
  MdAdd,
  MdRemove,
  MdRefresh,
  MdInventory,
  MdShoppingBag,
} from "react-icons/md";

const sectionStyles = {
  teal: { accent: "bg-teal-500", header: "border-teal-100 bg-teal-50/80" },
};

function SectionCard({ title, children }) {
  const style = sectionStyles.teal;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm shadow-slate-100/50">
      <div
        className={`mb-2 flex items-center gap-2 rounded-md border px-2 py-1 ${style.header}`}
      >
        <span className={`h-3 w-1 rounded-full ${style.accent}`} />
        <h3 className="text-[12px] font-semibold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function createEmptyRow() {
  return {
    id: Date.now() + Math.random(),
    category_id: "",
    item_id: "",
    purchase_price: "",
    sale_price: "",
    quantity: 1,
    total: 0,
  };
}

// Derive payment status label + tone from to_be_paid
function getPaymentStatus(record) {
  const toBePaid = parseFloat(
    record.to_be_paid ?? record.payable - record.paid ?? 0,
  );
  const paid = parseFloat(record.paid || 0);
  if (toBePaid <= 0) return { label: "PAID", tone: "emerald" };
  if (paid > 0) return { label: "PARTIAL", tone: "amber" };
  return { label: "UNPAID", tone: "rose" };
}

// Derive GRN/receipt status label
function getReceiptStatus(record) {
  if (record.order_status === "received") return { label: "RECEIVED", tone: "teal" };
  return { label: "PENDING", tone: "slate" };
}

export default function PurchasePage() {
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [purchasesRecord, setPurchasesRecord] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form state
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [purchaseItems, setPurchaseItems] = useState([createEmptyRow()]);

  // Payment state
  const [discountAmount, setDiscountAmount] = useState("");
  const [givenAmount, setGivenAmount] = useState("");

  useEffect(() => {
    fetchInitialData();
    fetchPurchases();
  }, []);

  async function fetchInitialData() {
    try {
      const [supRes, catRes, itmRes] = await Promise.all([
        axiosInstance.get("/suppliers").catch(() => null),
        axiosInstance.get("/categories").catch(() => null),
        axiosInstance.get("/item-details").catch(() => null),
      ]);
      if (supRes?.data)
        setSuppliers(
          Array.isArray(supRes.data) ? supRes.data : supRes.data.data || [],
        );
      if (catRes?.data)
        setCategories(
          Array.isArray(catRes.data) ? catRes.data : catRes.data.data || [],
        );
      if (itmRes?.data)
        setItems(
          Array.isArray(itmRes.data) ? itmRes.data : itmRes.data.data || [],
        );
    } catch {
      toast.error("Failed to load initial data");
    }
  }

  async function fetchPurchases() {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/purchases");
      setPurchasesRecord(
        Array.isArray(response.data)
          ? response.data
          : response.data?.data || [],
      );
    } catch {
      setPurchasesRecord([]);
    } finally {
      setLoading(false);
    }
  }

  // ── Computed totals ─────────────────────────────────────────────────────────
  const subTotal = useMemo(
    () => purchaseItems.reduce((sum, row) => sum + (Number(row.total) || 0), 0),
    [purchaseItems],
  );

  const payable = useMemo(
    () => Math.max(0, subTotal - (Number(discountAmount) || 0)),
    [subTotal, discountAmount],
  );

  const toBePaid = useMemo(
    () => Math.max(0, payable - (Number(givenAmount) || 0)),
    [payable, givenAmount],
  );

  // ── Row helpers ─────────────────────────────────────────────────────────────
  const addRow = () => setPurchaseItems((prev) => [...prev, createEmptyRow()]);
  const removeRow = (id) => {
    if (purchaseItems.length > 1)
      setPurchaseItems((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id, field, value) => {
    setPurchaseItems((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const newRow = { ...row, [field]: value };
        if (field === "item_id" && value) {
          const found = items.find((i) => String(i.id) === String(value));
          if (found) {
            newRow.purchase_price = found.purchase_price || 0;
            newRow.sale_price = found.sale_price || 0;
          }
        }
        if (field === "category_id") {
          newRow.item_id = "";
          newRow.purchase_price = "";
          newRow.sale_price = "";
        }
        newRow.total =
          (Number(newRow.purchase_price) || 0) * (Number(newRow.quantity) || 0);
        return newRow;
      }),
    );
  };

  const resetForm = () => {
    setEditId(null);
    setSupplierId("");
    setInvoiceNo(""); 
    setPurchaseItems([createEmptyRow()]);
    setDiscountAmount("");
    setGivenAmount("");
  };

  const handleEdit = (rec) => {
    setEditId(rec.id);
    setSupplierId(rec.supplier_id || "");
    setInvoiceNo(rec.invoice_no || ""); 
    setDiscountAmount(rec.discount_amount || "");
    setGivenAmount(rec.paid || rec.paid_amount || "");

    if (rec.items && rec.items.length > 0) {
      setPurchaseItems(
        rec.items.map((i) => ({
          id: Date.now() + Math.random(),
          category_id: i.item_category_id || "",
          item_id: i.item_id || "",
          purchase_price: i.purchase_price || 0,
          sale_price: i.sale_price || 0,
          quantity: i.qty || i.quantity || 1,
          total:
            (parseFloat(i.purchase_price) || 0) *
            (parseInt(i.qty || i.quantity) || 1),
        })),
      );
    } else {
      setPurchaseItems([createEmptyRow()]);
    }

    setIsFormOpen(true);
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this purchase record? Stock will be reversed if already received.",
      )
    )
      return;
    try {
      await axiosInstance.delete(`/purchases/${id}`);
      toast.success("Purchase record deleted");
      if (editId === id) resetForm();
      fetchPurchases();
    } catch {
      toast.error("Failed to delete purchase record.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) {
      toast.error("Please select a supplier.");
      return;
    }
    const validItems = purchaseItems.filter(
      (r) => r.item_id && Number(r.quantity) > 0,
    );
    if (validItems.length === 0) {
      toast.error("Add at least one valid item.");
      return;
    }

    setSubmitting(true);
    const payload = {
      supplier_id: supplierId,
      invoice_number: invoiceNo, // GRN No and Date are managed in the Goods Receipt Note form.
      // GRN No and Date are removed from here as per the request.
      items: validItems.map((i) => ({
        item_id: i.item_id,
        quantity: i.quantity,
        purchase_price: i.purchase_price,
        sale_price: i.sale_price,
        total: i.total,
      })),
      sub_total: subTotal,
      discount_amount: Number(discountAmount) || 0,
      discount_percent: 0,
      payable: payable,
      paid_amount: Number(givenAmount) || 0,
    };

    try {
      if (editId) {
        await axiosInstance.put(`/purchases/${editId}`, payload);
        toast.success("Purchase updated successfully!");
      } else {
        await axiosInstance.post("/purchases", payload);
        toast.success("Purchase saved successfully!");
      }
      resetForm();
      setIsFormOpen(false);
      fetchPurchases();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save purchase.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Inventory Acquisitions
            </h1>
            <p className="text-sm text-slate-500">
              Log purchases and restock inventory via Goods Receipt.
            </p>
          </div>
          <button
            onClick={() => {
              if (isFormOpen && editId) {
                resetForm();
                document
                  .querySelector("main")
                  ?.scrollTo({ top: 0, behavior: "smooth" });
              } else {
                const opening = !isFormOpen;
                setIsFormOpen(opening);
                if (opening) {
                  resetForm();
                  document
                    .querySelector("main")
                    ?.scrollTo({ top: 0, behavior: "smooth" });
                }
              }
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition duration-300 shadow-sm ${
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
                <MdAdd className="h-5 w-5" /> New Acquisition
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
              <Card className="mx-auto max-w-6xl border-l-[6px] border-l-teal-500 p-6 mb-6">
                <SectionHeader
                  title={editId ? "Edit Purchase" : "New Purchase Order"}
                  description="Record supplier invoice and item details. Stock is updated after GRN confirmation."
                  icon={<MdInventory className="h-6 w-6 text-teal-600" />}
                />

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  {/* Vendor Info */}
                  <SectionCard title="Vendor & Invoice Info">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-1">
                      <Field label="Supplier / Vendor" required>
                        <select
                          value={supplierId}
                          onChange={(e) => setSupplierId(e.target.value)}
                          className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-400"
                        >
                          <option value="">Select Supplier...</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.supplier_name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Supplier Invoice #">
                        <input
                          type="text"
                          value={invoiceNo}
                          onChange={(e) => setInvoiceNo(e.target.value)}
                          placeholder="Invoice number from supplier"
                          className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-400"
                        />
                      </Field>
                    </div>
                  </SectionCard>

                  {/* Items */}
                  <SectionCard title="Items to Purchase">
                    <div className="space-y-2">
                      <div className="hidden grid-cols-[140px_1fr_90px_90px_80px_100px_40px] gap-2 px-2 sm:grid uppercase tracking-widest text-[9px] font-bold text-slate-400">
                        <div>Category</div>
                        <div>Product</div>
                        <div>Cost</div>
                        <div>Sale P.</div>
                        <div className="text-center">Qty</div>
                        <div className="text-right">Total</div>
                        <div />
                      </div>

                      {purchaseItems.map((row) => {
                        const availableItems = items.filter(
                          (i) =>
                            String(i.item_category_id) ===
                            String(row.category_id),
                        );
                        return (
                          <div
                            key={row.id}
                            className="grid grid-cols-2 gap-2 sm:grid-cols-[140px_1fr_90px_90px_80px_100px_40px] items-center bg-slate-50/50 p-2 sm:p-0 sm:bg-transparent rounded-xl border border-slate-200 sm:border-0"
                          >
                            <select
                              value={row.category_id}
                              onChange={(e) =>
                                updateRow(row.id, "category_id", e.target.value)
                              }
                              className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px]"
                            >
                              <option value="">Category</option>
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.category_name}
                                </option>
                              ))}
                            </select>
                            <select
                              value={row.item_id}
                              onChange={(e) =>
                                updateRow(row.id, "item_id", e.target.value)
                              }
                              disabled={!row.category_id}
                              className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] disabled:bg-slate-100"
                            >
                              <option value="">Select Item</option>
                              {availableItems.map((i) => (
                                <option key={i.id} value={i.id}>
                                  {i.item_name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              step="0.01"
                              value={row.purchase_price}
                              onChange={(e) =>
                                updateRow(
                                  row.id,
                                  "purchase_price",
                                  e.target.value,
                                )
                              }
                              placeholder="Cost"
                              className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] text-right"
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={row.sale_price}
                              onChange={(e) =>
                                updateRow(row.id, "sale_price", e.target.value)
                              }
                              placeholder="Sale"
                              className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] text-right"
                            />
                            <input
                              type="number"
                              min="1"
                              value={row.quantity}
                              onChange={(e) =>
                                updateRow(row.id, "quantity", e.target.value)
                              }
                              className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-center text-[11px] font-bold"
                            />
                            <div className="text-right font-black text-slate-800 text-[11px]">
                              PKR {(Number(row.total) || 0).toLocaleString()}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeRow(row.id)}
                              className="text-rose-400 hover:text-rose-600 transition-colors flex justify-center"
                            >
                              <svg
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.8}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        );
                      })}

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={addRow}
                          className="inline-flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-2 text-[12px] font-bold text-teal-700 border border-teal-200 hover:bg-teal-100 transition"
                        >
                          <MdAdd className="h-4 w-4" /> Add Item Line
                        </button>
                      </div>
                    </div>
                  </SectionCard>

                  {/* Payment */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <SectionCard title="Payment Summary">
                      <div className="space-y-3 py-1 text-sm">
                        <div className="flex justify-between items-center text-slate-500">
                          <span>Sub-Total</span>
                          <span className="font-bold text-slate-800">
                            PKR {subTotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 flex-1">
                            Discount
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={discountAmount}
                            onChange={(e) => setDiscountAmount(e.target.value)}
                            placeholder="0.00"
                            className="h-8 w-32 rounded border border-slate-300 text-right px-2 text-[12px] focus:border-teal-400 outline-none"
                          />
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                          <span className="font-bold text-slate-700">
                            NET PAYABLE
                          </span>
                          <span className="text-xl font-black text-teal-600 font-mono">
                            PKR {payable.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard title="Cash Settlement">
                      <div className="space-y-4 py-1">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                            Amount Paid Now
                          </p>
                          <input
                            type="number"
                            value={givenAmount}
                            onChange={(e) => setGivenAmount(e.target.value)}
                            placeholder="0.00"
                            className="h-10 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 text-lg font-black text-emerald-700 outline-none focus:border-emerald-500 focus:bg-white transition"
                          />
                        </div>
                        {payable > 0 && (
                          <div
                            className={`p-3 rounded-xl border-2 flex items-center justify-between ${
                              toBePaid <= 0
                                ? "bg-emerald-50 border-emerald-100"
                                : Number(givenAmount) > 0
                                  ? "bg-amber-50 border-amber-100"
                                  : "bg-rose-50 border-rose-100"
                            }`}
                          >
                            <span
                              className={`text-[11px] font-black uppercase tracking-widest ${
                                toBePaid <= 0
                                  ? "text-emerald-700"
                                  : Number(givenAmount) > 0
                                    ? "text-amber-700"
                                    : "text-rose-700"
                              }`}
                            >
                              {toBePaid <= 0
                                ? "FULLY PAID"
                                : Number(givenAmount) > 0
                                  ? "PARTIAL — DUE"
                                  : "UNPAID"}
                            </span>
                            <span
                              className={`font-mono font-black text-lg ${
                                toBePaid <= 0
                                  ? "text-emerald-600"
                                  : Number(givenAmount) > 0
                                    ? "text-amber-600"
                                    : "text-rose-600"
                              }`}
                            >
                              PKR {toBePaid.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </SectionCard>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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
                      disabled={submitting || payable <= 0}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-10 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition disabled:opacity-50"
                    >
                      <MdShoppingBag className="h-5 w-5" />
                      {submitting
                        ? "Saving..."
                        : editId
                          ? "Update Purchase"
                          : "Save Purchase"}
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Purchase Records Table */}
        <Card className="mx-auto max-w-6xl p-0 overflow-hidden">
          <SectionHeader
            title="Purchase Records"
            description="All purchase orders with payment and receipt status."
            icon={<MdInventory className="h-6 w-6 text-teal-600" />}
            action={
              <div className="p-4">
                <button
                  type="button"
                  onClick={fetchPurchases}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  <MdRefresh className="inline mr-1" /> Refresh
                </button>
              </div>
            }
          />

          {loading ? (
            <TableState message="Loading purchases..." />
          ) : purchasesRecord.length === 0 ? (
            <TableState message="No purchase records found. Click 'New Acquisition' to begin." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">#</th>
                    <th className="px-5 py-4">Supplier / Invoice</th>
                    <th className="px-5 py-4 text-right">Payable</th>
                    <th className="px-5 py-4 text-right">Paid</th>
                    <th className="px-5 py-4 text-right">Due</th>
                    <th className="px-5 py-4 text-center">Payment</th>
                    <th className="px-5 py-4 text-center">Receipt</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {purchasesRecord.map((s, index) => {
                    const payStatus = getPaymentStatus(s);
                    const receiptStatus = getReceiptStatus(s);
                    const toBePaidAmt = parseFloat(
                      s.to_be_paid ?? s.payable - s.paid ?? 0,
                    );
                    return (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`group transition-colors hover:bg-teal-50/20 ${editId === s.id ? "bg-teal-50/50" : ""}`}
                      >
                        <td className="px-5 py-4 text-[11px] text-slate-400 font-mono">
                          {index + 1}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-[12px]">
                              {s.supplier_name || `Supplier #${s.supplier_id}`}
                            </span>
                            <span className="text-[10px] text-teal-600 font-mono">
                              {s.invoice_no || "No Invoice #"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {s.created_at
                                ? new Date(s.created_at).toLocaleDateString()
                                : ""}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-slate-700 text-[12px]">
                          PKR {Number(s.payable || 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-emerald-600 text-[12px]">
                          PKR {Number(s.paid || 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-[12px]">
                          <span
                            className={
                              toBePaidAmt > 0
                                ? "text-rose-600"
                                : "text-slate-400"
                            }
                          >
                            PKR {toBePaidAmt.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <StatusChip
                            label={payStatus.label}
                            tone={payStatus.tone}
                          />
                        </td>
                        <td className="px-5 py-4 text-center">
                          <StatusChip
                            label={receiptStatus.label}
                            tone={receiptStatus.tone}
                          />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <ActionButton
                              label="Edit"
                              tone="teal"
                              onClick={() => handleEdit(s)}
                            />
                            <ActionButton
                              label="Delete"
                              tone="rose"
                              onClick={() => handleDelete(s.id)}
                            />
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
