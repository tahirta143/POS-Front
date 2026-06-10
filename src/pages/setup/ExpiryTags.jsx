import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  Field,
  PageShell,
  SectionHeader,
  TableState,
  ActionButton,
} from "../../components/layout/PageShell.jsx";
import axiosInstance from "../../services/axiosInstance";
import { confirmAction } from "../../components/ui/ConfirmDialog.jsx";
import {
  MdAdd,
  MdRemove,
  MdRefresh,
  MdLabel,
  MdHistory,
  MdInventory,
  MdCategory,
  MdShoppingBag,
} from "react-icons/md";

const sectionStyles = {
  teal: { accent: "bg-teal-500", header: "border-teal-100 bg-teal-50/80" },
};

function SectionCard({ title, children }) {
  const style = sectionStyles.teal;
  return (
    <div className="rounded-xl border border-teal-100 dark:border-teal-900/50 bg-teal-50/50 dark:bg-slate-900/50 p-2.5 shadow-sm transition-colors">
      <div
        className={`mb-3 flex items-center gap-2.5 rounded-md border px-2.5 py-1.5 ${style.header} dark:bg-teal-600 dark:border-teal-500/50 transition-colors`}
      >
        <span
          className={`h-4 w-1 rounded-full ${style.accent} dark:bg-white`}
        />
        <h3 className="text-[12px] font-bold text-slate-800 dark:text-white uppercase tracking-tight">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function TagIcon({ className }) {
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
        d="M7 7h.01M3 11l8.586 8.586a2 2 0 002.828 0L21 13.414a2 2 0 000-2.828L12.414 2H5a2 2 0 00-2 2v7z"
      />
    </svg>
  );
}

// Helper to format ISO dates (2024-01-01T00:00:00Z) to Input format (2024-01-01)
function formatDateForInput(dateStr) {
  if (!dateStr) return "";
  return dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
}

function toOptionArray(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.data ?? [];
}

function safeNumber(val) {
  if (val === "" || val === null || val === undefined) return "";
  const n = Number(val);
  return Number.isFinite(n) ? n : "";
}

function normalizeItemCode(item) {
  return item?.barcode ?? item?.item_code ?? item?.code ?? item?.id ?? "";
}

export default function ExpiryTagsPage() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [expiryTags, setExpiryTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [receiptNumber, setReceiptNumber] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [itemId, setItemId] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [supplier, setSupplier] = useState("");
  const [manufacturerDate, setManufacturerDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchLookups();
    fetchExpiryTags();
  }, []);

  const filteredItems = useMemo(() => {
    if (!categoryId) return items;
    return items.filter(
      (i) => String(i.item_category_id) === String(categoryId),
    );
  }, [items, categoryId]);

  function resetForm() {
    setReceiptNumber("");
    setCategoryId("");
    setItemId("");
    setItemCode("");
    setPrice("");
    setSalePrice("");
    setManufacturer("");
    setSupplier("");
    setManufacturerDate("");
    setExpiryDate("");
    setEditId(null);
  }

  async function fetchLookups() {
    setLoading(true);
    try {
      const [catRes, itmRes] = await Promise.all([
        axiosInstance.get("/categories").catch(() => null),
        axiosInstance.get("/item-details").catch(() => null),
      ]);
      if (catRes?.data) setCategories(toOptionArray(catRes.data));
      if (itmRes?.data) setItems(toOptionArray(itmRes.data));
    } catch {
      toast.error("Unable to load lookup data.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchExpiryTags() {
    setLoadingTags(true);
    try {
      const res = await axiosInstance.get("/expiry-tags").catch(() => null);
      if (res?.data) {
        setExpiryTags(toOptionArray(res.data));
      } else {
        setExpiryTags([]);
      }
    } catch {
      setExpiryTags([]);
    } finally {
      setLoadingTags(false);
    }
  }

  function handleEdit(tag) {
    setEditId(tag.id);
    setReceiptNumber(tag.receipt_number || tag.receipt || "");
    setCategoryId(tag.item_category_id || tag.category_id || "");
    setItemId(tag.item_id || tag.itemId || "");
    setItemCode(tag.item_code || tag.code || "");
    setPrice(tag.purchase_price || "");
    setSalePrice(tag.sale_price || "");
    setManufacturer(tag.manufacturer || "");
    setSupplier(tag.supplier || "");
    setManufacturerDate(
      formatDateForInput(tag.manufacturing_date || tag.manufacturer_date),
    );
    setExpiryDate(formatDateForInput(tag.expiry_date));
    setIsFormOpen(true);
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    const confirmed = await confirmAction({
      title: "Delete expiry tag",
      message: "This expiry tag will be removed from the system. This action cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      type: "danger",
    });
    if (!confirmed) return;
    try {
      await axiosInstance.delete(`/expiry-tags/${id}`);
      toast.success("Expiry tag deleted successfully.");
      if (editId === id) resetForm();
      fetchExpiryTags();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to delete expiry tag.",
      );
    }
  }

  function handleSelectItem(nextItemId) {
    setItemId(nextItemId);
    const selected = items.find((i) => String(i.id) === String(nextItemId));
    if (!selected) return;
    setItemCode(normalizeItemCode(selected));
    setPrice(safeNumber(selected.purchase_price ?? selected.price ?? ""));
    setSalePrice(safeNumber(selected.sale_price ?? selected.salePrice ?? ""));
    setManufacturer(selected.manufacturer_name ?? "");
    setSupplier(selected.supplier_name ?? "");
  }

  function handleCategoryChange(nextCategoryId) {
    setCategoryId(nextCategoryId);
    setItemId("");
    setItemCode("");
    setPrice("");
    setSalePrice("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!receiptNumber.trim() || !categoryId || !itemId || !expiryDate) {
      toast.error("Receipt, Category, Item, and Expiry Date are required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        receipt_number: receiptNumber.trim(),
        category_id: categoryId,
        item_id: itemId,
        item_code: itemCode?.toString().trim(),
        purchase_price: Number(price) || 0,
        sale_price: Number(salePrice) || 0,
        manufacturer: manufacturer?.toString().trim(),
        supplier: supplier?.toString().trim(),
        manufacturer_date: manufacturerDate || null,
        expiry_date: expiryDate,
      };
      if (editId) {
        await axiosInstance.put(`/expiry-tags/${editId}`, payload);
        toast.success("Expiry tag updated.");
      } else {
        await axiosInstance.post("/expiry-tags", payload);
        toast.success("Expiry tag saved.");
      }
      resetForm();
      setIsFormOpen(false);
      fetchExpiryTags();
    } catch (err) {
      toast.error("Failed to save expiry tag.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Expiry Date Tracking
            </h1>
            <p className="text-sm text-slate-500">
              Monitor batch manufacturer and expiry dates for inventory items.
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
                <MdAdd className="h-5 w-5" /> Add Expiry Tag
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
                  title={editId ? "Modify Tracking Tag" : "New Tracking Tag"}
                  description="Register manufacturer and expiry timeline for local stock batches."
                  icon={<MdLabel className="h-6 w-6 text-teal-600" />}
                />

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <SectionCard title="Batch Identification">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Field label="Receipt Number" required>
                        <input
                          type="text"
                          value={receiptNumber}
                          onChange={(e) => setReceiptNumber(e.target.value)}
                          placeholder="Batch Code / ID"
                          className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                        />
                      </Field>
                      <Field label="Item Category" required>
                        <select
                          value={categoryId}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                        >
                          <option value="">Select Category</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.category_name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Specific Product" required>
                        <select
                          value={itemId}
                          onChange={(e) => handleSelectItem(e.target.value)}
                          disabled={!categoryId}
                          className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                        >
                          <option value="">Select Product...</option>
                          {filteredItems.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.item_name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Barcode / Code">
                        <input
                          type="text"
                          value={itemCode}
                          readOnly
                          className="h-8 w-full rounded-md border border-slate-100 bg-slate-50 px-2.5 text-[12px] font-mono text-slate-500"
                        />
                      </Field>
                    </div>
                  </SectionCard>

                  <SectionCard title="Financials & Timeline">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Field label="Purchase Cost">
                        <input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="0.00"
                          className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] text-right font-bold focus:border-teal-400"
                        />
                      </Field>
                      <Field label="Target Sale Price">
                        <input
                          type="number"
                          value={salePrice}
                          onChange={(e) => setSalePrice(e.target.value)}
                          placeholder="0.00"
                          className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] text-right font-bold focus:border-teal-400"
                        />
                      </Field>
                      <Field label="Manufacturing Date">
                        <input
                          type="date"
                          value={manufacturerDate}
                          onChange={(e) => setManufacturerDate(e.target.value)}
                          className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-400"
                        />
                      </Field>
                      <Field label="Expiry Date" required>
                        <input
                          type="date"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="h-8 w-full rounded-md border border-teal-300 bg-teal-50 px-2.5 text-[12px] outline-none focus:ring-2 focus:ring-teal-100 font-bold"
                        />
                      </Field>
                    </div>
                  </SectionCard>

                  <div className="grid lg:grid-cols-2 gap-4">
                    <Field label="Manufacturer Entity">
                      <input
                        type="text"
                        value={manufacturer}
                        readOnly
                        className="h-8 w-full rounded-md border border-slate-100 bg-slate-50 px-2.5 text-[12px] text-slate-500 font-medium"
                      />
                    </Field>
                    <Field label="Sourcing Supplier">
                      <input
                        type="text"
                        value={supplier}
                        readOnly
                        className="h-8 w-full rounded-md border border-slate-100 bg-slate-50 px-2.5 text-[12px] text-slate-500 font-medium"
                      />
                    </Field>
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
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition disabled:opacity-50"
                    >
                      <MdLabel />{" "}
                      {submitting
                        ? "Syncing..."
                        : editId
                          ? "Update Tag"
                          : "Create Tag"}
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tags Registry */}
        <Card className="mx-auto max-w-5xl p-0 overflow-hidden">
          <SectionHeader
            title="Registry of Tracking Tags"
            description={`${expiryTags.length} active batches detected in system.`}
            icon={<MdHistory className="h-6 w-6 text-teal-600" />}
            action={
              <div className="p-4">
                <button
                  type="button"
                  onClick={fetchExpiryTags}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <MdRefresh className="inline mr-1" /> Refresh
                </button>
              </div>
            }
          />

          {loadingTags ? (
            <TableState message="Syncing with inventory database..." />
          ) : expiryTags.length === 0 ? (
            <TableState message="No expiry tracking tags defined." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-width-full divide-y divide-slate-100 dark:divide-slate-800 text-left transition-colors">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="px-5 py-4">Receipt/Batch</th>
                    <th className="px-5 py-4">Product Info</th>
                    <th className="px-5 py-4 text-right">Pricing</th>
                    <th className="px-5 py-4">Life Cycle</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-900 transition-colors">
                  {expiryTags.map((t, idx) => {
                    const isExpired =
                      t.expiry_date && new Date(t.expiry_date) < new Date();
                    return (
                      <motion.tr
                        key={t.id || idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`group transition-colors hover:bg-teal-50/20 ${editId === t.id ? "bg-teal-50/50" : ""}`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-[12px]">
                              {t.receipt_number || "No Receipt"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono italic">
                              #TAG-{String(t.id).slice(-4)}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700 text-[12px]">
                              {(() => {
                                const id = t.item_id || t.itemId;
                                const itm = items.find(
                                  (i) => String(i.id) === String(id),
                                );
                                return (
                                  itm?.item_name ||
                                  t.item_name ||
                                  "Generic Item"
                                );
                              })()}
                            </span>
                            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-tighter">
                              {t.item_code || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex flex-col">
                            <span className="text-[12px] font-black text-slate-800">
                              PKR {Number(t.sale_price || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Cost:{" "}
                              {Number(t.purchase_price || 0).toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex w-fit px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isExpired ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}
                            >
                              {isExpired ? "Expired" : "Valid"}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap">
                              EXP: {t.expiry_date || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2 text-right">
                            <ActionButton
                              label="Edit"
                              tone="teal"
                              onClick={() => handleEdit(t)}
                            />
                            <ActionButton
                              label="Delete"
                              tone="rose"
                              onClick={() => handleDelete(t.id)}
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
