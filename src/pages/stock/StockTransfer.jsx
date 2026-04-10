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
} from "../../components/layout/PageShell.jsx";
import axiosInstance from "../../services/axiosInstance";
import {
  MdAdd,
  MdRemove,
  MdHistory,
  MdSwapHoriz,
  MdArrowForward,
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
    item_id: "",
    quantity: 1,
    current_stock: 0,
  };
}

export default function StockTransfer() {
  const [units, setUnits] = useState([]); // Business Units (Warehouses/Branches)
  const [items, setItems] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [fromUnitId, setFromUnitId] = useState("");
  const [toUnitId, setToUnitId] = useState("");
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [referenceNo, setReferenceNo] = useState("");
  const [transferItems, setTransferItems] = useState([createEmptyRow()]);

  useEffect(() => {
    fetchInitialData();
    fetchTransfers();
  }, []);

  async function fetchInitialData() {
    try {
      // Note: You might need to create an endpoint for business units
      const [unitRes, itmRes] = await Promise.all([
        axiosInstance.get("/business-units").catch(() => ({ data: [] })),
        axiosInstance.get("/item-details").catch(() => ({ data: [] })),
      ]);
      setUnits(
        Array.isArray(unitRes.data) ? unitRes.data : unitRes.data.data || [],
      );
      setItems(
        Array.isArray(itmRes.data) ? itmRes.data : itmRes.data.data || [],
      );
    } catch (e) {
      toast.error("Failed to load dependency data");
    }
  }

  async function fetchTransfers() {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/stock-transfers");
      const data = response.data;
      setTransfers(Array.isArray(data) ? data : data.data || []);
    } catch {
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  }

  const addRow = () => setTransferItems([...transferItems, createEmptyRow()]);
  const removeRow = (id) => {
    if (transferItems.length > 1)
      setTransferItems(transferItems.filter((r) => r.id !== id));
  };

  const updateRow = (id, field, value) => {
    setTransferItems((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          const newRow = { ...row, [field]: value };
          if (field === "item_id" && value) {
            const selectedItem = items.find(
              (i) => String(i.id) === String(value),
            );
            // Stock fetching logic from source unit would go here
            newRow.current_stock = selectedItem?.current_stock || 0;
          }
          return newRow;
        }
        return row;
      }),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fromUnitId || !toUnitId || fromUnitId === toUnitId) {
      toast.error("Please select different Source and Destination units.");
      return;
    }

    const validItems = transferItems.filter((r) => r.item_id && r.quantity > 0);
    if (validItems.length === 0) {
      toast.error("Add at least one item.");
      return;
    }

    setSubmitting(true);
    const payload = {
      from_unit_id: fromUnitId,
      to_unit_id: toUnitId,
      transfer_date: transferDate,
      reference_no: referenceNo,
      items: validItems.map((r) => ({
        item_id: r.item_id,
        quantity: r.quantity,
      })),
    };

    try {
      await axiosInstance.post("/stock-transfers", payload);
      toast.success("Stock transfer recorded successfully!");
      resetForm();
      setIsFormOpen(false);
      fetchTransfers();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save transfer.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFromUnitId("");
    setToUnitId("");
    setTransferDate(new Date().toISOString().split("T")[0]);
    setReferenceNo("");
    setTransferItems([createEmptyRow()]);
  };

  const inputCls =
    "h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100";

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Stock Transfer / Movement
            </h1>
            <p className="text-sm text-slate-500">
              Internal inventory transfer between branches or warehouses.
            </p>
          </div>
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition duration-300 shadow-sm ${
              isFormOpen
                ? "bg-slate-100 text-slate-700"
                : "bg-teal-600 text-white hover:bg-teal-700"
            }`}
          >
            {isFormOpen ? (
              <MdRemove className="h-5 w-5" />
            ) : (
              <MdAdd className="h-5 w-5" />
            )}
            {isFormOpen ? "Close Form" : "New Transfer"}
          </button>
        </div>

        {/* Collapsible Form */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="overflow-hidden"
            >
              <Card className="mx-auto max-w-6xl border-l-[6px] border-l-teal-500 p-6 mb-6">
                <SectionHeader
                  title="Create Transfer Order"
                  description="Select units and items to move."
                  icon={<MdSwapHoriz className="h-6 w-6 text-teal-600" />}
                />

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <SectionCard title="Transfer Routing">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Source Unit (From)" required>
                          <select
                            value={fromUnitId}
                            onChange={(e) => setFromUnitId(e.target.value)}
                            className={inputCls}
                          >
                            <option value="">Select Location</option>
                            {units.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Destination Unit (To)" required>
                          <select
                            value={toUnitId}
                            onChange={(e) => setToUnitId(e.target.value)}
                            className={inputCls}
                          >
                            <option value="">Select Location</option>
                            {units.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                    </SectionCard>

                    <SectionCard title="Reference Details">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Transfer Date">
                          <input
                            type="date"
                            value={transferDate}
                            onChange={(e) => setTransferDate(e.target.value)}
                            className={inputCls}
                          />
                        </Field>
                        <Field label="Reference / Challan No">
                          <input
                            type="text"
                            value={referenceNo}
                            onChange={(e) => setReferenceNo(e.target.value)}
                            placeholder="e.g. TR-1001"
                            className={inputCls}
                          />
                        </Field>
                      </div>
                    </SectionCard>
                  </div>

                  <SectionCard title="Item Movement List">
                    <div className="space-y-2">
                      <div className="hidden sm:grid grid-cols-[1fr_120px_120px_50px] gap-3 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <div>Select Item</div>
                        <div className="text-right">Available Stock</div>
                        <div className="text-center">Transfer Qty</div>
                        <div></div>
                      </div>

                      {transferItems.map((row) => (
                        <div
                          key={row.id}
                          className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_50px] gap-2 items-center bg-slate-50/50 p-2 sm:p-0 sm:bg-transparent rounded-xl"
                        >
                          <select
                            value={row.item_id}
                            onChange={(e) =>
                              updateRow(row.id, "item_id", e.target.value)
                            }
                            className={inputCls}
                          >
                            <option value="">Search Item...</option>
                            {items.map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.item_name}
                              </option>
                            ))}
                          </select>
                          <div className="text-right text-[12px] font-bold text-slate-500">
                            {row.current_stock}
                          </div>
                          <input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={(e) =>
                              updateRow(row.id, "quantity", e.target.value)
                            }
                            className={`${inputCls} text-center font-bold`}
                          />
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => removeRow(row.id)}
                              className="text-rose-400 hover:text-rose-600"
                            >
                              <MdRemove className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addRow}
                        className="mt-2 inline-flex items-center gap-1 text-teal-600 font-bold text-[12px] hover:underline"
                      >
                        <MdAdd /> Add Line Item
                      </button>
                    </div>
                  </SectionCard>

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
                      className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition disabled:opacity-50"
                    >
                      <MdSwapHoriz className="h-5 w-5" />{" "}
                      {submitting ? "Transferring..." : "Post Transfer"}
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transfer History Table */}
        <Card className="mx-auto max-w-6xl p-0 overflow-hidden">
          <SectionHeader
            title="Movement Registry"
            description="Log of all internal stock transfers."
            icon={<MdHistory className="h-6 w-6 text-teal-600" />}
          />

          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/50">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">From Unit</th>
                  <th className="px-5 py-3 text-center"></th>
                  <th className="px-5 py-3">To Unit</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Items</th>
                  <th className="px-5 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="7">
                      <TableState message="Loading history..." />
                    </td>
                  </tr>
                ) : transfers.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <TableState message="No transfers found." />
                    </td>
                  </tr>
                ) : (
                  transfers.map((trf) => (
                    <motion.tr
                      key={trf.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group transition-colors hover:bg-teal-50/30"
                    >
                      <td className="px-5 py-4 font-mono text-[11px] font-bold text-slate-400">
                        #TR-{String(trf.id).slice(-4)}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700 text-[12px]">
                        {trf.from_unit_name}
                      </td>
                      <td className="px-2 py-4 text-center text-slate-300">
                        <MdArrowForward className="h-4 w-4" />
                      </td>
                      <td className="px-5 py-4 font-bold text-teal-600 text-[12px]">
                        {trf.to_unit_name}
                      </td>
                      <td className="px-5 py-4 text-[12px] text-slate-500">
                        {trf.transfer_date}
                      </td>
                      <td className="px-5 py-4 text-right font-black text-slate-700 text-[12px]">
                        {trf.total_items}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <StatusChip label="POSTED" tone="emerald" />
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
