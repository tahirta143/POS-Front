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
import { MdAdd, MdRemove, MdReceipt, MdPerson, MdSearch, MdLock } from "react-icons/md";
import { usePermissions } from "../hooks/usePermissions";

const sectionStyles = {
  teal: { accent: "bg-teal-500", header: "border-teal-100 bg-teal-50/80" },
};

function SectionCard({ title, children }) {
  const style = sectionStyles.teal;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition-colors">
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

function createEmptyRow() {
  return {
    id: Date.now() + Math.random(),
    categoryId: "",
    itemId: "",
    price: "",
    quantity: 1,
    total: 0,
  };
}

const generateReceiptNumber = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const rand = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `RCP-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${rand}`;
};

export default function Sales() {
  const { canCreate, canRead, canUpdate, canDelete, isAdmin } = usePermissions();
  const MODULE_NAME = "Sale";

  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [salesRecord, setSalesRecord] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form state
  const [mobileNumber, setMobileNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([createEmptyRow()]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [discount, setDiscount] = useState("");
  const [givenAmount, setGivenAmount] = useState("");
  const [description, setDescription] = useState("");
  const [receiptNo, setReceiptNo] = useState(generateReceiptNumber);

  // Permission checks
  const canCreateSale = isAdmin || canCreate(MODULE_NAME);
  const canReadSale = isAdmin || canRead(MODULE_NAME);
  const canUpdateSale = isAdmin || canUpdate(MODULE_NAME);
  const canDeleteSale = isAdmin || canDelete(MODULE_NAME);

  useEffect(() => {
    if (canReadSale) {
      fetchInitialData();
      fetchSales();
    }
  }, [canReadSale]);

  async function fetchInitialData() {
    try {
      const [cusRes, catRes, itmRes] = await Promise.all([
        axiosInstance.get("/customers").catch(() => ({ data: null })),
        axiosInstance.get("/categories").catch(() => ({ data: null })),
        axiosInstance.get("/item-details").catch(() => ({ data: null })),
      ]);
      if (cusRes?.data)
        setCustomers(
          Array.isArray(cusRes.data) ? cusRes.data : cusRes.data.data || [],
        );
      if (catRes?.data)
        setCategories(
          Array.isArray(catRes.data) ? catRes.data : catRes.data.data || [],
        );
      if (itmRes?.data)
        setItems(
          Array.isArray(itmRes.data) ? itmRes.data : itmRes.data.data || [],
        );
    } catch (e) {
      toast.error("Failed to load initial data");
    }
  }

  async function fetchSales() {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/sale-invoices");
      if (res?.data)
        setSalesRecord(
          Array.isArray(res.data) ? res.data : res.data.data || [],
        );
    } catch {
      setSalesRecord([]);
    } finally {
      setLoading(false);
    }
  }

  const matchingCustomers = useMemo(() => {
    if (mobileNumber.length < 4) return [];
    return customers.filter(
      (c) =>
        c.mobile_number?.toLowerCase().includes(mobileNumber.toLowerCase()) ||
        c.customer_name?.toLowerCase().includes(mobileNumber.toLowerCase()),
    );
  }, [mobileNumber, customers]);

  const handleMobileChange = (e) => {
    const val = e.target.value;
    setMobileNumber(val);
    setShowCustomerDropdown(val.length >= 4);
    if (val.length < 4) {
      setCustomerName("");
      setCustomerId(null);
    }
    if (customerId) setCustomerId(null);
  };

  const handleSelectCustomer = (c) => {
    setMobileNumber(c.mobile_number);
    setCustomerName(c.customer_name);
    setCustomerId(c.id);
    setShowCustomerDropdown(false);
  };

  const subTotal = useMemo(
    () => invoiceItems.reduce((sum, r) => sum + (Number(r.total) || 0), 0),
    [invoiceItems],
  );
  const payable = useMemo(
    () => Math.max(0, subTotal - (Number(discount) || 0)),
    [subTotal, discount],
  );
  const remaining = useMemo(
    () => Math.max(0, payable - (Number(givenAmount) || 0)),
    [payable, givenAmount],
  );

  const addRow = () => setInvoiceItems((prev) => [...prev, createEmptyRow()]);
  const removeRow = (id) => {
    if (invoiceItems.length > 1)
      setInvoiceItems((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id, field, value) => {
    setInvoiceItems((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const newRow = { ...row, [field]: value };
        if (field === "itemId" && value) {
          const found = items.find((i) => String(i.id) === String(value));
          if (found) newRow.price = found.sale_price || 0;
        }
        if (field === "categoryId") {
          newRow.itemId = "";
          newRow.price = "";
        }
        newRow.total =
          (Number(newRow.price) || 0) * (Number(newRow.quantity) || 0);
        return newRow;
      }),
    );
  };

  const resetForm = () => {
    setEditId(null);
    setMobileNumber("");
    setCustomerName("");
    setCustomerId(null);
    setInvoiceItems([createEmptyRow()]);
    setDiscount("");
    setGivenAmount("");
    setDescription("");
    setReceiptNo(generateReceiptNumber());
  };

  const handleEdit = (rec) => {
    if (!canUpdateSale) {
      toast.error("You don't have permission to edit sales invoices.");
      return;
    }
    
    setEditId(rec.id);
    setMobileNumber(rec.mobile || "");
    setCustomerName(rec.customer_name || "");
    setCustomerId(rec.customer_id || null);
    setDescription(rec.description || "");
    setDiscount(rec.discount || "");
    setGivenAmount(rec.paid || "");

    if (rec.items && rec.items.length > 0) {
      setInvoiceItems(
        rec.items.map((item) => ({
          id: Date.now() + Math.random(),
          categoryId: item.category_id || "",
          itemId: item.item_id || "",
          price: item.sale_price || 0,
          quantity: item.qty || 1,
          total: item.total || 0,
        })),
      );
    } else {
      setInvoiceItems([createEmptyRow()]);
    }
    setIsFormOpen(true);
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!canDeleteSale) {
      toast.error("You don't have permission to delete sales invoices.");
      return;
    }
    
    if (!window.confirm("Delete this sale record?")) return;
    try {
      await axiosInstance.delete(`/sale-invoices/${id}`);
      toast.success("Sale record deleted successfully");
      if (editId === id) resetForm();
      fetchSales();
    } catch (err) {
      toast.error("Failed to delete sale record.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canCreateSale && !canUpdateSale) {
      toast.error("You don't have permission to save sales invoices.");
      return;
    }

    const validItems = invoiceItems.filter(
      (r) => r.itemId && Number(r.quantity) > 0,
    );
    if (validItems.length === 0) {
      toast.error("Please add at least one valid item.");
      return;
    }

    setSubmitting(true);

    const itemsPayload = validItems.map((r) => ({
      itemId: parseInt(r.itemId),
      quantity: parseInt(r.quantity),
      price: parseFloat(r.price),
      total: parseFloat(r.total),
    }));

    try {
      if (editId) {
        await axiosInstance.put(`/sale-invoices/${editId}`, {
          customerId: customerId || null,
          customerName,
          mobileNumber,
          description: description || null,
          discount: Number(discount) || 0,
          givenAmount: Number(givenAmount) || 0,
          subTotal,
          payable,
          toBePaid: remaining,
          returnAmount: 0,
          returnDescription: null,
          items: itemsPayload,
        });
        toast.success("Invoice updated successfully!");
      } else {
        await axiosInstance.post("/sale-invoices", {
          customerId: customerId || null,
          customerName,
          mobileNumber,
          receiptNo,
          description: description || null,
          discount: Number(discount) || 0,
          givenAmount: Number(givenAmount) || 0,
          subTotal,
          payable,
          toBePaid: remaining,
          returnAmount: 0,
          returnDescription: null,
          items: itemsPayload,
        });
        toast.success("Invoice saved successfully!");
      }
      resetForm();
      setIsFormOpen(false);
      fetchSales();
    } catch (err) {
      toast.error("Failed to save sale invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  // Access Denied
  if (!canReadSale) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-red-100">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdLock className="text-5xl text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
            <p className="text-slate-500 mb-4">
              You don't have permission to view Sales Invoices.
            </p>
            <div className="bg-slate-50 rounded-lg p-3 text-left">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Required Permission:</p>
              <p className="text-[12px] font-mono text-slate-700">Read Sale</p>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        className="space-y-4"
      >
        {/* Header Section */}
        <div className="flex items-center justify-between rounded-3xl border border-white/70 bg-white/70 px-5 py-4 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.65)] ring-1 ring-slate-200/70 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:ring-slate-800/80">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Sales Invoices
            </h1>
            <p className="text-sm text-slate-500">
              Create new sale receipts and track payment history.
            </p>
          </div>
          {canCreateSale && (
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
                  <MdAdd className="h-5 w-5" /> New Invoice
                </>
              )}
            </button>
          )}
        </div>

        {/* Collapsible Form - Only show if user can create */}
        <AnimatePresence mode="wait">
          {isFormOpen && canCreateSale && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <Card className="mx-auto mb-6 max-w-6xl border-l-[6px] border-l-teal-500 p-6">
                <SectionHeader
                  title={editId ? "Edit Invoice" : "New Sales Invoice"}
                  description="Register a new sale for record keeping and reporting."
                  icon={<MdReceipt className="h-6 w-6 text-teal-600" />}
                />

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <SectionCard title="Customer Identification">
                      <div className="flex flex-wrap gap-4 items-end">
                        <Field
                          label="Mobile / Search"
                          required
                          className="flex-1 min-w-[200px]"
                        >
                          <div className="relative">
                            <input
                              type="tel"
                              value={mobileNumber}
                              onChange={handleMobileChange}
                              onFocus={() =>
                                mobileNumber.length >= 4 &&
                                setShowCustomerDropdown(true)
                              }
                              onBlur={() =>
                                setTimeout(
                                  () => setShowCustomerDropdown(false),
                                  200,
                                )
                              }
                              placeholder="Enter mobile..."
                              className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 pr-8 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 relative z-10"
                            />
                            <MdSearch className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 z-10" />
                            {showCustomerDropdown &&
                              matchingCustomers.length > 0 && (
                                <ul className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-1 shadow-xl ring-1 ring-slate-200/70 transition-colors">
                                  {matchingCustomers.map((c) => (
                                    <li
                                      key={c.id}
                                      onClick={() => handleSelectCustomer(c)}
                                      className="block w-full cursor-pointer px-3 py-1.5 text-left hover:bg-teal-50 dark:hover:bg-slate-800 transition"
                                    >
                                      <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                                        {c.customer_name}
                                      </p>
                                      <p className="text-[10px] text-slate-500">
                                        {c.mobile_number}
                                      </p>
                                    </li>
                                  ))}
                                </ul>
                              )}
                          </div>
                        </Field>
                        <Field
                          label="Customer Name"
                          required
                          className="flex-1 min-w-[200px]"
                        >
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Walk-in Customer"
                            className={`h-8 w-full rounded-md border text-[12px] outline-none transition px-2.5 transition-colors ${customerId ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 font-bold text-emerald-800 dark:text-emerald-400" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100"}`}
                          />
                        </Field>
                      </div>
                    </SectionCard>
                    <SectionCard title="Internal Reference">
                      <div className="flex gap-4">
                        <Field label="Receipt Number" className="flex-1">
                          <input
                            type="text"
                            value={receiptNo}
                            readOnly
                            className="h-8 w-full rounded-md border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-2.5 text-[12px] font-mono font-bold text-slate-500 dark:text-slate-400"
                          />
                        </Field>
                        <Field label="Description / Note" className="flex-1">
                          <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Internal remarks..."
                            className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                          />
                        </Field>
                      </div>
                    </SectionCard>
                  </div>

                  <SectionCard title="Cart Items">
                    <div className="space-y-2">
                      <div className="hidden grid-cols-[180px_1fr_100px_80px_100px_50px] gap-3 px-3 sm:grid uppercase tracking-[0.18em] text-[10px] font-bold text-teal-500/80 dark:text-teal-400">
                        <div>Category</div>
                        <div>Select Item</div>
                        <div className="text-right">Price</div>
                        <div className="text-center">Qty</div>
                        <div className="text-right">Total</div>
                        <div></div>
                      </div>
                      {invoiceItems.map((row) => {
                        const availableItems = items.filter(
                          (i) =>
                            String(i.item_category_id) ===
                            String(row.categoryId),
                        );
                        return (
                          <div
                            key={row.id}
                            className="grid grid-cols-2 gap-2 transition-all duration-200 sm:grid-cols-[140px_1fr_90px_90px_80px_100px_40px]"
                          >
                            <div className="col-span-2 sm:col-span-1">
                              <select
                                value={row.categoryId}
                                onChange={(e) =>
                                  updateRow(
                                    row.id,
                                    "categoryId",
                                    e.target.value,
                                  )
                                }
                                className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 text-[12px] outline-none focus:border-indigo-400 transition-colors"
                              >
                                <option value="">Category</option>
                                {categories.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.category_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                              <select
                                value={row.itemId}
                                onChange={(e) =>
                                  updateRow(row.id, "itemId", e.target.value)
                                }
                                disabled={!row.categoryId}
                                className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 text-[12px] outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800/50 focus:border-indigo-400 transition-colors"
                              >
                                <option value="">Select Item</option>
                                {availableItems.map((i) => (
                                  <option key={i.id} value={i.id}>
                                    {i.item_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              value={row.price}
                              onChange={(e) =>
                                updateRow(row.id, "price", e.target.value)
                              }
                              placeholder="0.00"
                              className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 text-right text-[12px] font-medium"
                            />
                            <input
                              type="number"
                              min="1"
                              value={row.quantity}
                              onChange={(e) =>
                                updateRow(row.id, "quantity", e.target.value)
                              }
                              className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 text-center text-[12px] font-bold"
                            />
                            <div className="rounded-xl bg-white/80 px-2 py-2 text-right text-[12px] font-black text-slate-800 ring-1 ring-slate-200/70 dark:bg-slate-900/80 dark:text-slate-200 dark:ring-slate-700/60">
                              PKR {Number(row.total || 0).toLocaleString()}
                            </div>
                            <div className="flex justify-center">
                              <button
                                type="button"
                                onClick={() => removeRow(row.id)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl text-rose-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20"
                                title="Remove Item"
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
                          </div>
                        );
                      })}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={addRow}
                          className="group inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-[12px] font-bold text-teal-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-900/20 dark:text-teal-400"
                        >
                          <MdAdd className="h-4 w-4 group-hover:rotate-90 transition duration-300" />{" "}
                          Add Line
                        </button>
                      </div>
                    </div>
                  </SectionCard>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <SectionCard title="Financial Summary">
                      <div className="space-y-3 py-1">
                        <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
                          <span className="text-slate-500">Gross Total</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            PKR {subTotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 text-xs flex-1">
                            Discount Amount
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={discount}
                            onChange={(e) => setDiscount(e.target.value)}
                            placeholder="0.00"
                            className="h-8 w-32 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-right px-2 text-[12px] font-bold outline-none focus:border-teal-400"
                          />
                        </div>
                        <div className="pt-2 flex justify-between items-center transition-colors">
                          <span className="font-black text-slate-700 dark:text-slate-300 text-sm">
                            TOTAL PAYABLE
                          </span>
                          <span className="text-lg font-black text-teal-600 font-mono tracking-tighter">
                            PKR {payable.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </SectionCard>
                    <SectionCard title="Settlement Details">
                      <div className="flex flex-wrap gap-6 items-end py-1">
                        <Field
                          label="Payment Received"
                          className="flex-1 min-w-[150px]"
                        >
                          <input
                            type="number"
                            value={givenAmount}
                            onChange={(e) => setGivenAmount(e.target.value)}
                            placeholder="0.00"
                            className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 text-sm font-black text-emerald-700 dark:text-emerald-400 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-700 transition"
                          />
                        </Field>
                        <div className="flex-1 min-w-[200px]">
                          {payable > 0 && givenAmount > 0 && (
                            <div
                              className={`p-3 rounded-xl border-2 flex items-center justify-between transition-colors ${Number(givenAmount) >= payable ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30" : "bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30"}`}
                            >
                              <div className="flex flex-col">
                                <span
                                  className={`text-[10px] font-black uppercase tracking-widest ${Number(givenAmount) >= payable ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}
                                >
                                  {Number(givenAmount) >= payable
                                    ? "COMPLETE"
                                    : "PARTIAL DUE"}
                                </span>
                                <span
                                  className={`font-mono font-black text-lg ${Number(givenAmount) >= payable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                                >
                                  PKR{" "}
                                  {Math.abs(
                                    Number(givenAmount) - payable,
                                  ).toLocaleString()}
                                </span>
                              </div>
                              <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${Number(givenAmount) >= payable ? "bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200" : "bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-200"}`}
                              >
                                {Number(givenAmount) >= payable ? "✓" : "!"}
                              </div>
                            </div>
                          )}
                        </div>
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
                      className="rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      Discard Changes
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || payable <= 0}
                      className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-8 py-2.5 text-sm font-black text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition disabled:opacity-50"
                    >
                      <MdReceipt className="h-5 w-5" />{" "}
                      {submitting
                        ? "Authenticating..."
                        : editId
                          ? "Save & Sync"
                          : "Generate Invoice"}
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List Section */}
        <Card className="mx-auto max-w-6xl p-0 overflow-hidden">
          <SectionHeader
            title="Sales History Log"
            description="Chronological record of completed transactions and billing."
            icon={<MdReceipt className="h-6 w-6 text-teal-600" />}
            action={
              <div className="pr-1">
                <button
                  type="button"
                  onClick={fetchSales}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Sync Records
                </button>
              </div>
            }
          />

          {loading ? (
            <TableState message="Syncing with master sales database..." />
          ) : salesRecord.length === 0 ? (
            <TableState message="No sales records detected in history." />
          ) : (
            <div className="custom-scrollbar overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left">
                <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur dark:bg-slate-800/80">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-teal-400">
                    <th className="px-5 py-3">Receipt & Date</th>
                    <th className="px-5 py-3">Customer Info</th>
                    <th className="px-5 py-3 text-right">Payable</th>
                    <th className="px-5 py-3 text-right">Received</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-900 transition-colors">
                  {salesRecord.map((s) => {
                    const statusPayload =
                      s.paid >= s.payable
                        ? { label: "PAID", tone: "emerald" }
                        : s.paid > 0
                          ? { label: "PARTIAL", tone: "amber" }
                          : { label: "DUE", tone: "rose" };

                    return (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`group transition-colors hover:bg-teal-50/30 dark:hover:bg-teal-900/10 ${editId === s.id ? "bg-teal-50/50 dark:bg-teal-900/20" : ""}`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {s.receipt_no}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {s.created_at || "Recently"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-[12px]">
                              {s.customer_name || "Walk-in Customer"}
                            </span>
                            <span className="text-[10px] text-teal-600 font-bold tracking-tighter">
                              {s.mobile || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
                            PKR {Number(s.payable || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400">
                            PKR {Number(s.paid || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <StatusChip
                            label={statusPayload.label}
                            tone={statusPayload.tone}
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {canUpdateSale && (
                              <ActionButton
                                label="Edit"
                                tone="teal"
                                onClick={() => handleEdit(s)}
                              />
                            )}
                            {canDeleteSale && (
                              <ActionButton
                                label="Delete"
                                tone="rose"
                                onClick={() => handleDelete(s.id)}
                              />
                            )}
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
      </motion.div>
    </PageShell>
  );
}