import { useCallback, useEffect, useState, useMemo } from "react";
import {
  Card,
  PageShell,
  SectionHeader,
  TableState,
} from "../../components/layout/PageShell.jsx";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import {
  MdSecurity,
  MdRefresh,
  MdDateRange,
  MdSearch,
  MdAccountBalance,
  MdLock,
} from "react-icons/md";
import { usePermissions } from "../../hooks/usePermissions";

function CalendarIcon({ className }) {
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
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

const TYPE_STYLES = {
  SALE: "bg-teal-100 text-teal-700",
  RECEIPT: "bg-emerald-100 text-emerald-700",
  EXPENSE: "bg-orange-100 text-orange-700",
  PURCHASE: "bg-blue-100 text-blue-700",
  PAYMENT: "bg-rose-100 text-rose-700",
  RETURN: "bg-amber-100 text-amber-700",
  OPENING: "bg-slate-100 text-slate-600",
  MANUAL: "bg-purple-100 text-purple-700",
};

function TypeBadge({ type }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${TYPE_STYLES[type] || "bg-slate-100 text-slate-600"}`}
    >
      {type}
    </span>
  );
}

function fmtTime(val) {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function Daybook() {
  const { user } = useSelector((state) => state.auth);
  const { canAccess, canCreate, canUpdate, canDelete, canRead, isAdmin } =
    usePermissions();

  const MODULE_NAME = "Day Book";

  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [search, setSearch] = useState("");
  const [permissionError, setPermissionError] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [showObModal, setShowObModal] = useState(false);
  const [obInput, setObInput] = useState("");
  const [savingOb, setSavingOb] = useState(false);

  // Permission checks - using canRead instead of canDo
  const hasReadPermission = useMemo(() => {
    if (isAdmin) return true;
    return canAccess(MODULE_NAME) && canRead(MODULE_NAME);
  }, [isAdmin, canAccess, canRead]);

  const canUpdateOpeningBalance = useMemo(() => {
    if (isAdmin) return true;
    return canUpdate(MODULE_NAME) || canCreate(MODULE_NAME);
  }, [isAdmin, canUpdate, canCreate]);

  const fetchDaybookData = useCallback(async () => {
    if (!hasReadPermission) {
      setPermissionError(true);
      return;
    }

    setLoading(true);
    setPermissionError(false);
    setApiError(null);

    try {
      const res = await axiosInstance.get(`/daybook?date=${selectedDate}`);
      const data = res.data || {};
      setTransactions(data.transactions || []);
      setOpeningBalance(data.openingBalance || 0);
    } catch (err) {
      console.error("Daybook fetch error:", err);

      if (err.response?.status === 401) {
        setApiError("Session expired. Please login again.");
        toast.error("Session expired. Please login again.");
      } else if (err.response?.status === 403) {
        setPermissionError(true);
        toast.error("You don't have permission to view the daybook.");
      } else if (err.response?.status === 404) {
        setApiError("Daybook endpoint not found. Please contact support.");
        toast.error("Daybook service unavailable.");
      } else {
        setApiError(err?.response?.data?.message || "Failed to load daybook.");
        toast.error(err?.response?.data?.message || "Failed to load daybook.");
      }

      setTransactions([]);
      setOpeningBalance(0);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, hasReadPermission]);

  useEffect(() => {
    if (hasReadPermission) {
      fetchDaybookData();
    } else {
      setPermissionError(true);
    }
  }, [fetchDaybookData, hasReadPermission, selectedDate]);

  async function handleSetOpeningBalance(e) {
    e.preventDefault();

    if (!canUpdateOpeningBalance) {
      toast.error("You don't have permission to update opening balance.");
      return;
    }

    const amount = parseFloat(obInput);

    if (isNaN(amount)) {
      toast.error("Please enter a valid amount.");
      return;
    }

    if (amount < 0) {
      toast.error("Opening balance cannot be negative.");
      return;
    }

    setSavingOb(true);
    try {
      await axiosInstance.post("/daybook/opening-balance", {
        amount,
        date: selectedDate,
      });
      toast.success("Opening balance updated successfully.");
      setShowObModal(false);
      setObInput("");
      fetchDaybookData();
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error("You don't have permission to update opening balance.");
      } else {
        toast.error(
          err?.response?.data?.message || "Failed to set opening balance.",
        );
      }
    } finally {
      setSavingOb(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return transactions;

    return transactions.filter(
      (t) =>
        t.description?.toLowerCase().includes(q) ||
        String(t.reference)?.toLowerCase().includes(q) ||
        t.type?.toLowerCase().includes(q),
    );
  }, [transactions, search]);

  const summary = useMemo(() => {
    const cashIn = transactions.reduce((s, t) => s + (t.cashIn || 0), 0);
    const cashOut = transactions.reduce((s, t) => s + (t.cashOut || 0), 0);
    const netFlow = cashIn - cashOut;
    return { cashIn, cashOut, netFlow, closing: openingBalance + netFlow };
  }, [transactions, openingBalance]);

  // Access Denied State
  if (!hasReadPermission || permissionError) {
    return (
      <PageShell
        title="Access Denied"
        description="You don't have permission to view this page."
        accent="from-rose-600 to-red-700"
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-red-100">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdLock className="text-5xl text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Access Denied
            </h2>
            <p className="text-slate-500 mb-4">
              You don't have permission to view the Day Book.
            </p>
            <div className="bg-slate-50 rounded-lg p-3 text-left">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                Required Permission:
              </p>
              <p className="text-[12px] font-mono text-slate-700">
                Read Day Book
              </p>
              {!isAdmin && (
                <p className="text-[10px] text-slate-400 mt-2">
                  Contact your administrator to request access.
                </p>
              )}
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  // API Error State
  if (apiError) {
    return (
      <PageShell
        title="Daybook"
        description="Chronological daily financial log."
        accent="from-teal-600 via-emerald-600 to-cyan-700"
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-amber-100">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdAccountBalance className="text-5xl text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Unable to Load Daybook
            </h2>
            <p className="text-slate-500 mb-4">{apiError}</p>
            <button
              onClick={fetchDaybookData}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Daybook"
      description="Chronological daily financial log."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-4 max-w-6xl mx-auto">
        {/* Header Controls */}
        <Card className="border-l-[6px] border-l-teal-500 p-4">
          <SectionHeader
            title="Daybook"
            description="All cash inflows and outflows for the selected date."
            icon={<CalendarIcon className="h-5 w-5" />}
          />
          <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
              <button
                onClick={fetchDaybookData}
                disabled={loading}
                className="flex items-center gap-2 h-9 px-4 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 disabled:opacity-50 transition"
              >
                <MdRefresh
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                {loading ? "Loading..." : "Refresh"}
              </button>
              {canUpdateOpeningBalance && (
                <button
                  onClick={() => {
                    setObInput(String(openingBalance));
                    setShowObModal(true);
                  }}
                  className="h-9 px-4 border border-teal-200 bg-teal-50 text-teal-700 rounded-lg text-sm font-bold hover:bg-teal-100 transition"
                >
                  Set Opening Balance
                </button>
              )}
            </div>
            <div className="text-sm text-slate-500 flex items-center gap-2">
              <MdDateRange className="h-4 w-4" />
              <span>
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Opening Balance",
              value: openingBalance,
              color: "bg-slate-50",
              text: "text-slate-700",
              icon: MdAccountBalance,
            },
            {
              label: "Cash In",
              value: summary.cashIn,
              color: "bg-teal-50/50",
              text: "text-teal-700",
              icon: null,
            },
            {
              label: "Cash Out",
              value: summary.cashOut,
              color: "bg-rose-50/50",
              text: "text-rose-700",
              icon: null,
            },
            {
              label: "Net Flow",
              value: summary.netFlow,
              color: summary.netFlow >= 0 ? "bg-emerald-50" : "bg-rose-50",
              text: summary.netFlow >= 0 ? "text-emerald-700" : "text-rose-700",
              icon: null,
            },
          ].map(({ label, value, color, text }) => (
            <Card
              key={label}
              className={`p-3 ${color} transition-all hover:shadow-md`}
            >
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                {label}
              </span>
              <p className={`text-[16px] font-bold mt-0.5 font-mono ${text}`}>
                {value >= 0 ? "" : "−"}PKR{" "}
                {Math.abs(value).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </Card>
          ))}
        </div>

        {/* Closing Balance Banner */}
        <Card className="p-3 bg-gradient-to-r from-teal-600 to-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">
              Closing Balance / Drawer Cash
            </span>
            <span className="text-xl font-black text-white font-mono">
              PKR{" "}
              {summary.closing.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </Card>

        {/* Transactions Table */}
        <Card className="overflow-hidden p-0">
          <SectionHeader
            title={`Transactions — ${selectedDate}`}
            description={`${filtered.length} record${filtered.length !== 1 ? "s" : ""}`}
            icon={<CalendarIcon className="h-5 w-5" />}
            action={
              <div className="p-4">
                <div className="relative">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search reference, description or type..."
                    className="h-8 w-64 pl-8 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-[12px] outline-none focus:border-teal-400 focus:bg-white transition"
                  />
                </div>
              </div>
            }
          />

          <div className="overflow-x-auto max-h-[480px] custom-scrollbar">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/80 sticky top-0 z-10">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Cash In</th>
                  <th className="px-4 py-3 text-right">Cash Out</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="7">
                      <div className="flex justify-center items-center py-12 gap-3">
                        <div className="h-6 w-6 rounded-full border-2 border-teal-200 border-t-teal-600 animate-spin" />
                        <span className="text-sm text-slate-500">
                          Loading daybook...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <TableState
                        message={
                          search
                            ? "No matching records found."
                            : "No transactions for this date."
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((txn, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-[11px] font-mono text-slate-400 whitespace-nowrap">
                        {fmtTime(txn.dateTime)}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-[11px] text-slate-700 font-mono">
                        {txn.reference || "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <TypeBadge type={txn.type} />
                      </td>
                      <td
                        className="px-4 py-2.5 text-[12px] text-slate-600 max-w-[250px] truncate"
                        title={txn.description}
                      >
                        {txn.description || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold font-mono text-[12px] text-teal-700">
                        {txn.cashIn > 0
                          ? `PKR ${txn.cashIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold font-mono text-[12px] text-rose-600">
                        {txn.cashOut > 0
                          ? `PKR ${txn.cashOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex justify-end gap-1">
                          {canUpdateOpeningBalance && (
                            <button
                              onClick={() =>
                                toast.info("Edit functionality coming soon")
                              }
                              className="p-1 text-teal-600 hover:bg-teal-50 rounded transition"
                              title="Edit Transaction"
                            >
                              <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z"
                                />
                              </svg>
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() =>
                                toast.info("Delete functionality coming soon")
                              }
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded transition"
                              title="Delete Transaction"
                            >
                              <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {!loading && filtered.length > 0 && (
                <tfoot className="bg-slate-50 border-t-2 border-slate-200 sticky bottom-0">
                  <tr>
                    <td
                      colSpan="4"
                      className="px-4 py-3 text-[11px] font-bold uppercase text-slate-500 text-right"
                    >
                      Totals
                    </td>
                    <td className="px-4 py-3 text-right font-black text-teal-700 font-mono text-[13px]">
                      PKR{" "}
                      {summary.cashIn.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-rose-600 font-mono text-[13px]">
                      PKR{" "}
                      {summary.cashOut.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      </div>

      {/* Opening Balance Modal - Only show if user has permission */}
      {showObModal && canUpdateOpeningBalance && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowObModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[15px] font-bold text-slate-800 mb-1">
              Set Opening Balance
            </h3>
            <p className="text-[12px] text-slate-500 mb-4">
              Cash in drawer at the start of {selectedDate}
            </p>
            <form onSubmit={handleSetOpeningBalance} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-600 mb-1">
                  Amount (PKR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={obInput}
                  onChange={(e) => setObInput(e.target.value)}
                  placeholder="0.00"
                  className="h-10 w-full rounded-lg border-2 border-slate-200 bg-slate-50 px-3 text-lg font-black text-teal-700 outline-none focus:border-teal-400 focus:bg-white transition"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowObModal(false);
                    setObInput("");
                  }}
                  className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOb}
                  className="flex-1 rounded-xl bg-teal-600 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50 transition"
                >
                  {savingOb ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
