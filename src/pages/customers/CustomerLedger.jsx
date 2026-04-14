import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import {
  Card,
  Field,
  PageShell,
  SectionHeader,
  TableState,
} from "../../components/layout/PageShell.jsx";
import axiosInstance from "../../services/axiosInstance";

function BookIcon({ className }) {
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
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

const CREDIT_LIMIT = 50000;

export default function CustomerLedger() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledgerData, setLedgerData] = useState(null); // { customer, ledger, closingBalance }
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tableSearch, setTableSearch] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      const res = await axiosInstance.get("/customers");
      setCustomers(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch {
      toast.error("Failed to load customers.");
    }
  }

  // Filter dropdown suggestions
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim() || selectedCustomer) return [];
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.customer_name?.toLowerCase().includes(q) ||
        c.mobile_number?.includes(q),
    );
  }, [searchQuery, customers, selectedCustomer]);

  useEffect(() => {
    setShowDropdown(filteredCustomers.length > 0);
  }, [filteredCustomers]);

  const fetchLedger = useCallback(async (id) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/customer-ledger/${id}`);
      setLedgerData(res.data); // expects { customer, ledger, closingBalance }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load ledger.");
      setLedgerData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleCustomerSelect(customer) {
    setSelectedCustomer(customer);
    setSearchQuery(customer.customer_name);
    setShowDropdown(false);
    setTableSearch("");
    await fetchLedger(customer.id);
  }

  function clearSelection() {
    setSelectedCustomer(null);
    setSearchQuery("");
    setLedgerData(null);
    setTableSearch("");
    setShowDropdown(false);
  }

  const ledger = ledgerData?.ledger || [];
  const closingBalance = ledgerData?.closingBalance ?? 0;
  const openingBalance = parseFloat(selectedCustomer?.previous_balance || 0);

  const filteredLedger = useMemo(() => {
    const q = tableSearch.toLowerCase();
    if (!q) return ledger;
    return ledger.filter(
      (t) =>
        t.description?.toLowerCase().includes(q) ||
        t.reference?.toLowerCase().includes(q),
    );
  }, [ledger, tableSearch]);

  const totalDebit = useMemo(
    () => filteredLedger.reduce((s, r) => s + (r.debit || 0), 0),
    [filteredLedger],
  );
  const totalCredit = useMemo(
    () => filteredLedger.reduce((s, r) => s + (r.credit || 0), 0),
    [filteredLedger],
  );

  const creditUsedPercent = Math.min(
    100,
    (closingBalance / CREDIT_LIMIT) * 100,
  );

  // Safe date formatter — handles both strings and Date objects from backend
  function fmtDate(val) {
    if (!val) return "—";
    try {
      return new Date(val).toLocaleDateString();
    } catch {
      return String(val);
    }
  }

  return (
    <PageShell
      title="Customer Ledger"
      description="Detailed transaction history for individual customers."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-5 max-w-6xl mx-auto">
        {/* Customer Selector */}
        <Card className="p-5 border-l-[6px] border-l-teal-500">
          <SectionHeader
            title="Customer Selection"
            description="Search and select a customer to view their statement."
            icon={<BookIcon className="h-5 w-5" />}
          />
          <div className="mt-4 relative max-w-lg">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (selectedCustomer) setSelectedCustomer(null);
                  }}
                  placeholder="Search by name or mobile number..."
                  className="h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 pl-9 pr-3 text-[12px] outline-none focus:border-teal-400 transition"
                />
                <svg
                  className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              {selectedCustomer && (
                <button
                  onClick={clearSelection}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-[12px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Clear
                </button>
              )}
              {selectedCustomer && (
                <button
                  onClick={() => fetchLedger(selectedCustomer.id)}
                  className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-[12px] font-medium text-teal-600 hover:bg-teal-100 transition"
                >
                  ↻ Reload
                </button>
              )}
            </div>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 shadow-lg max-h-48 overflow-y-auto transition-colors">
                {filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleCustomerSelect(c)}
                    className="w-full px-3 py-2 text-left text-[12px] hover:bg-teal-50 dark:hover:bg-teal-900/30 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 last:border-0 transition"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {c.customer_name}
                      </span>
                      <span className="ml-2 text-slate-400 text-[11px]">
                        {c.mobile_number}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      PKR {parseFloat(c.previous_balance || 0).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Summary Cards */}
        {selectedCustomer && !loading && ledgerData && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: "Customer",
                value: selectedCustomer.customer_name,
                color: "text-slate-800 dark:text-slate-100",
              },
              {
                label: "Opening Balance",
                value: `PKR ${openingBalance.toFixed(2)}`,
                color: "text-slate-700 dark:text-slate-300",
              },
              {
                label: "Total Debit",
                value: `PKR ${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                color: "text-rose-600 dark:text-rose-400",
              },
              {
                label: "Net Balance",
                value: `PKR ${Math.abs(closingBalance).toFixed(2)} ${closingBalance > 0 ? "DR" : closingBalance < 0 ? "CR" : ""}`,
                color:
                  closingBalance > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400",
              },
            ].map(({ label, value, color }) => (
              <Card key={label} className="p-3">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest block">
                  {label}
                </span>
                <p className={`text-[13px] font-bold truncate mt-0.5 ${color} dark:text-slate-50`}>
                  {value}
                </p>
              </Card>
            ))}
          </div>
        )}

        {/* Credit usage bar */}
        {selectedCustomer && ledgerData && (
          <Card className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Credit Limit Usage
              </span>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {creditUsedPercent.toFixed(1)}% of PKR{" "}
                {CREDIT_LIMIT.toLocaleString()}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${creditUsedPercent > 80 ? "bg-rose-500" : creditUsedPercent > 50 ? "bg-amber-400" : "bg-teal-500"}`}
                style={{ width: `${creditUsedPercent}%` }}
              />
            </div>
          </Card>
        )}

        {/* Ledger Table */}
        {selectedCustomer && (
          <Card className="overflow-hidden p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 transition-colors">
              <div>
                <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">
                  Statement —{" "}
                  {ledgerData?.customer?.customer_name ||
                    selectedCustomer.customer_name}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
                  {filteredLedger.length} transaction{filteredLedger.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Filter transactions..."
                  className="h-8 w-48 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 text-[12px] outline-none focus:border-teal-400 transition"
                />
                <div className="text-right shrink-0">
                  <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-400 block tracking-widest">Balance</span>
                  <span
                    className={`text-base font-black font-mono transition-colors ${closingBalance > 0 ? "text-rose-600 dark:text-rose-400" : closingBalance < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}
                  >
                    PKR {Math.abs(closingBalance).toFixed(2)}
                    {closingBalance !== 0 && (
                      <span className="ml-1 text-[10px]">
                        {closingBalance > 0 ? "DR" : "CR"}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left transition-colors">
                <thead className="bg-white dark:bg-slate-900 sticky top-0 shadow-[0_1px_0_0_#f1f5f9] dark:shadow-[0_1px_0_0_#1e293b] z-10">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-100">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3 text-right">Credit (−)</th>
                    <th className="px-5 py-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-900 transition-colors">
                  {loading ? (
                    <tr>
                      <td colSpan="6">
                        <div className="flex justify-center items-center py-10 gap-3">
                          <div className="h-6 w-6 rounded-full border-2 border-teal-200 border-t-teal-600 animate-spin" />
                          <span className="text-sm text-slate-500 dark:text-slate-300">
                            Loading ledger...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan="6">
                        <TableState message="No transactions found." />
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map((txn, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors text-sm"
                      >
                        <td className="px-5 py-3 text-[11px] font-mono text-slate-500 whitespace-nowrap">
                          {fmtDate(txn.date || txn.dateTime)}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-[11px] font-bold font-mono ${txn.reference === "OPENING" ? "text-amber-600" : "text-slate-700"}`}
                          >
                            {txn.reference || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[12px] text-slate-500 dark:text-slate-200">
                          {txn.description}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-rose-600 dark:text-rose-400 font-mono text-[12px]">
                          {txn.debit > 0 
                            ? `PKR ${Number(txn.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}` 
                            : '—'}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-emerald-600 font-mono text-[12px]">
                          {txn.credit > 0
                            ? `PKR ${Number(txn.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            : "—"}
                        </td>
                        <td
                          className={`px-5 py-3 text-right font-bold font-mono text-[12px] ${Number(txn.balance) > 0 ? "text-rose-700" : Number(txn.balance) < 0 ? "text-emerald-700" : "text-slate-400"}`}
                        >
                          PKR{" "}
                          {Math.abs(Number(txn.balance || 0)).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                          {Number(txn.balance) !== 0 && (
                            <span className="ml-1 text-[9px]">
                              {Number(txn.balance) > 0 ? "DR" : "CR"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {!loading && filteredLedger.length > 0 && (
                  <tfoot className="bg-slate-50 dark:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-700 transition-colors">
                    <tr>
                      <td
                        colSpan="3"
                        className="px-5 py-3 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 text-right"
                      >
                        Totals
                      </td>
                      <td className="px-5 py-3 text-right font-black text-rose-600 dark:text-rose-400 font-mono text-[12px]">
                        PKR{" "}
                        {totalDebit.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-5 py-3 text-right font-black text-emerald-600 dark:text-emerald-400 font-mono text-[12px]">
                        PKR{" "}
                        {totalCredit.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td
                        className={`px-5 py-3 text-right font-black font-mono text-[13px] transition-colors ${closingBalance > 0 ? "text-rose-700 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400"}`}
                      >
                        PKR{" "}
                        {Math.abs(closingBalance).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                        <span className="ml-1 text-[10px]">
                          {closingBalance > 0
                            ? "DR"
                            : closingBalance < 0
                              ? "CR"
                              : ""}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
