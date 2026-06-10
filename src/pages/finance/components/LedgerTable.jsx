import { useMemo, useState } from "react";
import { Card, TableState } from "../../../components/layout/PageShell.jsx";

export default function LedgerTable({ ledger = [], closingBalance = 0, loading = false, entityName = "" }) {
  const [search, setSearch] = useState("");

  const filteredLedger = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return ledger;
    return ledger.filter(
      (t) =>
        t.reference?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q),
    );
  }, [ledger, search]);

  const totalDebit = useMemo(
    () => filteredLedger.reduce((s, r) => s + (r.debit || 0), 0),
    [filteredLedger],
  );
  const totalCredit = useMemo(
    () => filteredLedger.reduce((s, r) => s + (r.credit || 0), 0),
    [filteredLedger],
  );

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50 dark:bg-slate-800/40">
        <div>
          <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">
            Statement of Account{entityName ? ` — ${entityName}` : ""}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {filteredLedger.length} transaction{filteredLedger.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by reference or description..."
            className="h-8 w-56 rounded-lg border border-slate-200 bg-white px-3 text-[12px] outline-none focus:border-teal-400 transition dark:border-slate-700 dark:bg-slate-900"
          />
          <div className="text-right shrink-0">
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">
              Balance
            </span>
            <span
              className={`text-base font-black font-mono ${
                closingBalance > 0
                  ? "text-rose-600"
                  : closingBalance < 0
                    ? "text-emerald-600"
                    : "text-slate-500"
              }`}
            >
              PKR {Math.abs(closingBalance).toFixed(2)}
              <span className="ml-1 text-[10px] font-bold">
                {closingBalance > 0 ? "DR" : closingBalance < 0 ? "CR" : ""}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[500px]">
        <table className="min-w-full divide-y divide-slate-100 text-left">
          <thead className="bg-white dark:bg-slate-900 sticky top-0 shadow-[0_1px_0_0_#f1f5f9]">
            <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Reference</th>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3 text-right">Debit (+)</th>
              <th className="px-5 py-3 text-right">Credit (−)</th>
              <th className="px-5 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-white dark:bg-slate-900/50">
            {loading ? (
              <tr>
                <td colSpan="6">
                  <TableState message="Loading ledger..." />
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
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors text-sm">
                  <td className="px-5 py-3 text-[11px] font-mono text-slate-500 whitespace-nowrap">
                    {txn.date || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-[11px] font-bold font-mono ${
                        txn.reference === "OPENING" ? "text-amber-600" : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {txn.reference}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-slate-500">{txn.description}</td>
                  <td className="px-5 py-3 text-right font-semibold text-rose-600 font-mono text-[12px]">
                    {txn.debit > 0
                      ? `PKR ${txn.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-emerald-600 font-mono text-[12px]">
                    {txn.credit > 0
                      ? `PKR ${txn.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      : "—"}
                  </td>
                  <td
                    className={`px-5 py-3 text-right font-bold font-mono text-[12px] ${
                      txn.balance > 0
                        ? "text-rose-700"
                        : txn.balance < 0
                          ? "text-emerald-700"
                          : "text-slate-400"
                    }`}
                  >
                    PKR {Math.abs(txn.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    {txn.balance !== 0 && (
                      <span className="ml-1 text-[9px] font-bold">
                        {txn.balance > 0 ? "DR" : "CR"}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {filteredLedger.length > 0 && (
            <tfoot className="bg-slate-50 dark:bg-slate-800/40 border-t-2 border-slate-200">
              <tr>
                <td colSpan="3" className="px-5 py-3 text-[11px] font-bold uppercase text-slate-500 text-right">
                  Totals
                </td>
                <td className="px-5 py-3 text-right font-black text-rose-600 font-mono text-[12px]">
                  PKR {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-3 text-right font-black text-emerald-600 font-mono text-[12px]">
                  PKR {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td
                  className={`px-5 py-3 text-right font-black font-mono text-[13px] ${
                    closingBalance > 0 ? "text-rose-700" : "text-emerald-700"
                  }`}
                >
                  PKR {Math.abs(closingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  <span className="ml-1 text-[10px]">
                    {closingBalance > 0 ? "DR" : closingBalance < 0 ? "CR" : ""}
                  </span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Card>
  );
}
