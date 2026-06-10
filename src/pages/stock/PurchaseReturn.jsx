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
  StatusChip,
} from "../../components/layout/PageShell.jsx";
import axiosInstance from "../../services/axiosInstance";
import {
  MdAdd,
  MdRemove,
  MdHistory,
  MdKeyboardReturn,
  MdRefresh,
  MdReceipt,
  MdBusiness,
  MdPriceCheck,
} from "react-icons/md";
import { usePermissions } from "../../hooks/usePermissions";import { confirmAction } from '../../components/ui/ConfirmDialog.jsx'
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

export default function PurchaseReturnPage() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [recentReturns, setRecentReturns] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();

  const canC = canCreate("Purchase Return");
  const canR = canRead("Purchase Return");
  const canU = canUpdate("Purchase Return");
  const canD = canDelete("Purchase Return");

  useEffect(() => {
    fetchPurchases();
    fetchRecentReturns();
  }, []);

  async function fetchPurchases() {
    try {
      const [purchasesResponse, suppliersResponse] = await Promise.all([
        axiosInstance.get("/purchases"),
        axiosInstance.get("/suppliers").catch(() => ({ data: [] })),
      ]);
      const purchasesData = purchasesResponse.data;
      const suppliersData = suppliersResponse.data;
      setPurchases(
        Array.isArray(purchasesData)
          ? purchasesData
          : purchasesData?.data || [],
      );
      setSuppliers(
        Array.isArray(suppliersData)
          ? suppliersData
          : suppliersData?.data || [],
      );
    } catch {
      toast.error("Failed to load purchase history.");
    }
  }

  async function fetchRecentReturns() {
    setLoadingReturns(true);
    try {
      const response = await axiosInstance.get("/purchase-returns");
      setRecentReturns(
        Array.isArray(response.data)
          ? response.data
          : response.data?.data || [],
      );
    } catch (error) {
      setRecentReturns([]);
    } finally {
      setLoadingReturns(false);
    }
  }

  const handlePurchaseChange = (event) => {
    const purchase = purchases.find(
      (row) => String(row.id) === String(event.target.value),
    );
    setSelectedPurchase(purchase || null);
    setReturnItems(
      (purchase?.items || []).map((item) => ({ ...item, returnQty: 0 })),
    );
  };

  const handleQtyChange = (itemId, qty) => {
    setReturnItems((prev) =>
      prev.map((item) => {
        const currentId = item.item_id || item.id;
        if (String(currentId) === String(itemId)) {
          const parsedQty = qty === "" ? 0 : Number(qty);
          const safeQty = Number.isNaN(parsedQty) ? 0 : parsedQty;
          const maxQty = Number(item.qty || item.quantity || 0);
          return { ...item, returnQty: Math.min(Math.max(0, safeQty), maxQty) };
        }
        return item;
      }),
    );
  };

  const totalReturnValue = useMemo(() => {
    return returnItems.reduce((sum, item) => {
      const qty = Number(item.returnQty || 0);
      const rate = Number(item.purchase_price || item.price || 0);
      return sum + qty * rate;
    }, 0);
  }, [returnItems]);

  const selectedSupplierName = useMemo(() => {
    if (!selectedPurchase) return "-";
    return (
      selectedPurchase.supplier_name ||
      suppliers.find(
        (supplier) =>
          String(supplier.id) === String(selectedPurchase.supplier_id),
      )?.supplier_name ||
      "-"
    );
  }, [selectedPurchase, suppliers]);

  function resetForm() {
    setEditId(null);
    setSelectedPurchase(null);
    setReturnItems([]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const itemsToReturn = returnItems.filter(
      (item) => Number(item.returnQty || 0) > 0,
    );
    if (!selectedPurchase) {
      toast.error("Select a purchase first.");
      return;
    }
    if (itemsToReturn.length === 0) {
      toast.error("Add at least one item to return.");
      return;
    }

    setSubmitting(true);
    try {
      const normalizedItems = itemsToReturn.map((item) => {
        const qty = Number(item.returnQty || 0);
        const rate = Number(item.purchase_price || item.price || 0);
        return {
          item_id: item.item_id || item.id,
          qty,
          purchase_price: rate,
          total: qty * rate,
        };
      });

      const payload = {
        purchaseId: selectedPurchase.id,
        supplierId: selectedPurchase.supplier_id,
        returnDate: new Date().toISOString().slice(0, 10),
        items: normalizedItems,
        reason: "Purchase return",
      };

      if (editId) {
        await axiosInstance.put(`/purchase-returns/${editId}`, payload);
        toast.success("Return updated successfully.");
      } else {
        await axiosInstance.post("/purchase-returns", payload);
        toast.success("Return recorded successfully.");
      }

      fetchRecentReturns();
      resetForm();
      setIsFormOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save return.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(record) {
    const purchase = purchases.find(
      (row) => String(row.id) === String(record.purchase_id),
    );
    if (!purchase) {
      toast.error("Original purchase data unavailable.");
      return;
    }

    const returnQtyByItemId = new Map(
      (record.items || []).map((item) => [
        String(item.item_id),
        Number(item.qty || 0),
      ]),
    );

    setEditId(record.id);
    setSelectedPurchase(purchase);
    setReturnItems(
      (purchase.items || []).map((item) => ({
        ...item,
        returnQty: returnQtyByItemId.get(String(item.item_id || item.id)) || 0,
      })),
    );
    setIsFormOpen(true);
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(returnId) {
    const confirmed = await confirmAction({
      title: 'Delete purchase return',
      message: 'This purchase return will be removed from the system. This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      type: 'danger',
    })
    if (!confirmed) return;
    try {
      await axiosInstance.delete(`/purchase-returns/${returnId}`);
      toast.success("Return deleted successfully.");
      fetchRecentReturns();
      if (editId === returnId) resetForm();
    } catch (error) {
      toast.error("Failed to delete return.");
    }
  }

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Purchase Return (Debit Note)
            </h1>
            <p className="text-sm text-slate-500">
              Reverse supply acquisitions and adjust supplier ledger.
            </p>
          </div>
          {canC && (
            <button
              onClick={() => {
                if (isFormOpen && editId) {
                  resetForm();
                } else {
                  setIsFormOpen(!isFormOpen);
                  if (!isFormOpen) resetForm();
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
                  <MdAdd className="h-5 w-5" /> New Return
                </>
              )}
            </button>
          )}
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
                  title={editId ? "Modify Return Entry" : "Process New Return"}
                  description="Select the source acquisition to authorize merchandise returns."
                  icon={<MdKeyboardReturn className="h-6 w-6 text-teal-600" />}
                />

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                    <div className="lg:col-span-2">
                      <SectionCard title="Source Selection">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-1">
                          <Field label="Purchase Reference" required>
                            <div className="relative">
                              <select
                                onChange={handlePurchaseChange}
                                value={selectedPurchase?.id || ""}
                                className="h-8 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[12px] font-semibold text-slate-700 outline-none transition focus:border-teal-400"
                              >
                                <option value="">
                                  Search GRN / Invoice ID...
                                </option>
                                {purchases.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.grn_no || p.invoice_no || `PUR-${p.id}`}{" "}
                                    - {p.supplier_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </Field>

                          {selectedPurchase && (
                            <div className="flex flex-col justify-center rounded-lg bg-teal-50 px-3 py-1 border border-teal-100">
                              <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">
                                Debit Amount
                              </p>
                              <p className="text-sm font-black text-teal-700 truncate font-mono">
                                PKR {totalReturnValue.toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </SectionCard>
                    </div>

                    <SectionCard title="Entity Details">
                      <div className="space-y-2 p-1">
                        <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-slate-400 border border-slate-100">
                            <MdBusiness className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                              Supplier
                            </p>
                            <p className="text-[11px] font-bold text-slate-700 truncate">
                              {selectedSupplierName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-slate-400 border border-slate-100">
                            <MdPriceCheck className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                              Original Ref
                            </p>
                            <p className="text-[11px] font-bold text-slate-700 truncate">
                              {selectedPurchase?.grn_no ||
                                selectedPurchase?.invoice_no ||
                                "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </SectionCard>
                  </div>

                  {selectedPurchase && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 space-y-4"
                    >
                      <SectionCard title="Return Itemization">
                        <div className="rounded-xl border border-slate-100 overflow-hidden">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              <tr>
                                <th className="px-4 py-2">Product Item</th>
                                <th className="px-4 py-2 text-right">
                                  Inward Qty
                                </th>
                                <th className="px-4 py-2 text-right">
                                  Purchase Rate
                                </th>
                                <th className="px-4 py-2 text-center">
                                  Return Qty
                                </th>
                                <th className="px-4 py-2 text-right">Amnt</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                              {returnItems.map((item) => {
                                const inwardQty = Number(
                                  item.qty || item.quantity || 0,
                                );
                                const rate = Number(
                                  item.purchase_price || item.price || 0,
                                );
                                const returnTotal =
                                  rate * Number(item.returnQty || 0);
                                const itemId = item.item_id || item.id;
                                return (
                                  <tr
                                    key={itemId}
                                    className="hover:bg-slate-50/50 transition-colors"
                                  >
                                    <td className="px-4 py-2 font-semibold text-slate-700">
                                      {item.item_name}
                                    </td>
                                    <td className="px-4 py-2 text-right text-slate-500">
                                      {inwardQty}
                                    </td>
                                    <td className="px-4 py-2 text-right font-mono">
                                      PKR {rate.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                      <input
                                        type="number"
                                        min="0"
                                        max={inwardQty}
                                        value={
                                          item.returnQty === 0
                                            ? ""
                                            : item.returnQty
                                        }
                                        placeholder="0"
                                        onChange={(e) =>
                                          handleQtyChange(
                                            itemId,
                                            e.target.value,
                                          )
                                        }
                                        className="h-7 w-16 rounded border border-slate-200 bg-white px-2 text-center font-bold text-teal-700 focus:border-teal-400 outline-none"
                                      />
                                    </td>
                                    <td className="px-4 py-2 text-right font-black text-teal-700">
                                      PKR {returnTotal.toLocaleString()}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </SectionCard>

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={resetForm}
                          className="rounded-xl px-5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 transition"
                        >
                          Discard Changes
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-2 text-sm font-black text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition disabled:opacity-50"
                        >
                          {submitting
                            ? "Recording..."
                            : editId
                              ? "Update Debit Note"
                              : "Authorize Return"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Registry Table */}
        <Card className="mx-auto max-w-5xl p-0 overflow-hidden">
          <SectionHeader
            title="Registry of Debit Notes"
            description="Archive of all processed supplier merchandise returns."
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
            <TableState message="Searching registry archive..." />
          ) : recentReturns.length === 0 ? (
            <TableState message="No purchase returns recorded in system." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">Return ID</th>
                    <th className="px-5 py-4">Supplier Entity</th>
                    <th className="px-5 py-4">Acquisition ID</th>
                    <th className="px-5 py-4">Total Return</th>
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
                        #DBT-{String(record.id).slice(-4)}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800 text-[13px]">
                        {record.supplier_name || "Generic Supplier"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-semibold text-slate-600">
                            {record.purchase_id}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {record.return_date
                              ? new Date(
                                  record.return_date,
                                ).toLocaleDateString()
                              : "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-black text-teal-700 font-mono text-sm">
                        PKR {Number(record.total_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2 text-right">
                          {canU && (
                            <ActionButton
                              label="Edit"
                              tone="teal"
                              onClick={() => handleEdit(record)}
                            />
                          )}
                          {canD && (
                            <ActionButton
                              label="Delete"
                              tone="rose"
                              onClick={() => handleDelete(record.id)}
                            />
                          )}
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
