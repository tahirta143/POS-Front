import { useEffect, useState, useMemo } from "react";
import {
  Card,
  Field,
  PageShell,
  SectionHeader,
  StatusAlert,
} from "../../components/layout/PageShell.jsx";
import axiosInstance from "../../services/axiosInstance";

const sectionStyles = {
  emerald: { accent: "bg-teal-500", header: "border-teal-100 bg-teal-50/80" },
  blue: { accent: "bg-teal-500", header: "border-teal-100 bg-teal-50/80" },
  indigo: { accent: "bg-teal-500", header: "border-teal-100 bg-teal-50/80" },
};

function SectionCard({ color, title, children }) {
  const style = sectionStyles[color] ?? sectionStyles.emerald;
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
      <div className="p-1">{children}</div>
    </div>
  );
}

function SelectField({
  label,
  required = false,
  value,
  onChange,
  options,
  placeholder,
}) {
  return (
    <Field label={label} required={required}>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-full appearance-none rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 pr-8 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
          <ChevronDownIcon className="h-4 w-4" />
        </div>
      </div>
    </Field>
  );
}

function ChevronDownIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ChartIcon({ className }) {
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
        d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
      />
    </svg>
  );
}

export default function ExpenseReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [type, setType] = useState("day");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, fromDate, toDate]);

  async function fetchReport() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.append("type", type);
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);

      const response = await axiosInstance.get(
        `/expense-reports?${params.toString()}`,
      );
      setData(response.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load report data.");
    } finally {
      setLoading(false);
    }
  }

  const totals = useMemo(() => {
    return data.reduce(
      (acc, curr) => {
        acc.sales += Number(curr.sales) || 0;
        acc.expense += Number(curr.expense) || 0;
        acc.profit += Number(curr.profit) || 0;
        return acc;
      },
      { sales: 0, expense: 0, profit: 0 },
    );
  }, [data]);

  return (
    <PageShell
      title="Sales & Expense Report"
      description="View financial performance breaking down sales against recorded expenses."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <Card className="mx-auto max-w-5xl border-l-[6px] border-l-teal-500 p-3.5">
        <SectionHeader
          title="Profitability Report"
          description="Analyze profit margins by day, month, or year."
          icon={<ChartIcon className="h-6 w-6" />}
          action={
            <button
              onClick={fetchReport}
              disabled={loading}
              className="rounded-lg bg-teal-50 dark:bg-white/10 px-3 py-1.5 text-[13px] font-semibold text-teal-700 dark:text-white transition hover:bg-teal-100 dark:hover:bg-white/20 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          }
        />

        <StatusAlert type="error" message={error} />

        <div className="space-y-4">
          <SectionCard color="blue" title="Filters">
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-[1fr_1.5fr_1.5fr]">
              <SelectField
                label="View By"
                value={type}
                onChange={setType}
                options={[
                  { value: "day", label: "Daily" },
                  { value: "month", label: "Monthly" },
                  { value: "year", label: "Yearly" },
                ]}
              />
              <Field label="From Date">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                />
              </Field>
              <Field label="To Date">
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                />
              </Field>
            </div>
          </SectionCard>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900/90 dark:to-slate-900/90 p-4 shadow-sm shadow-emerald-100/50 dark:shadow-none transition-colors">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-teal-400">
                Total Sales
              </p>
              <p className="mt-1 flex items-baseline gap-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                <span className="text-sm font-semibold text-slate-500 dark:text-teal-500/60">
                  PKR
                </span>
                {totals.sales.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-slate-900/90 dark:to-slate-900/90 p-4 shadow-sm shadow-rose-100/50 dark:shadow-none transition-colors">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Total Expenses
              </p>
              <p className="mt-1 flex items-baseline gap-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                <span className="text-sm font-semibold text-slate-500 dark:text-rose-500/60">
                  PKR
                </span>
                {totals.expense.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-slate-900/90 dark:to-slate-900/90 p-4 shadow-sm shadow-teal-100/50 dark:shadow-none transition-colors">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Net Profit
              </p>
              <p
                className={`mt-1 flex items-baseline gap-1 text-2xl font-bold ${totals.profit >= 0 ? "text-teal-700 dark:text-teal-400" : "text-rose-600 dark:text-rose-400"}`}
              >
                <span className="text-sm font-semibold opacity-70">PKR</span>
                {totals.profit.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          <SectionCard color="emerald" title="Report Data">
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-[13px] transition-colors">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] text-slate-700 dark:text-teal-400">
                      Period
                    </th>
                    <th className="px-4 py-3 text-right font-bold uppercase tracking-wider text-[10px] text-slate-700 dark:text-teal-400">
                      Sales (PKR)
                    </th>
                    <th className="px-4 py-3 text-right font-bold uppercase tracking-wider text-[10px] text-slate-700 dark:text-teal-400">
                      Expense (PKR)
                    </th>
                    <th className="px-4 py-3 text-right font-bold uppercase tracking-wider text-[10px] text-slate-700 dark:text-teal-400">
                      Profit (PKR)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 transition-colors">
                  {loading && data.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="py-8 text-center text-slate-400 dark:text-slate-500"
                      >
                        Loading data...
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="py-8 text-center text-slate-400 dark:text-slate-500"
                      >
                        No records found for this period.
                      </td>
                    </tr>
                  ) : (
                    data.map((row, index) => (
                      <tr
                        key={index}
                        className="transition hover:bg-slate-50/50 dark:hover:bg-teal-900/10"
                      >
                        <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-200">
                          {row.label}
                        </td>
                        <td className="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                          {Number(row.sales).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-2.5 text-right text-rose-600 dark:text-rose-400 font-bold">
                          {Number(row.expense).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right font-bold ${Number(row.profit) >= 0 ? "text-teal-600 dark:text-teal-400" : "text-rose-500 dark:text-rose-400"}`}
                        >
                          {Number(row.profit).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {data.length > 0 && (
                  <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 transition-colors">
                    <tr>
                      <td className="px-4 py-3">Total</td>
                      <td className="px-4 py-3 text-right text-emerald-700 dark:text-emerald-400">
                        {totals.sales.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3 text-right text-rose-700 dark:text-rose-400">
                        {totals.expense.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td
                        className={`px-4 py-3 text-right ${totals.profit >= 0 ? "text-teal-700 dark:text-teal-400" : "text-rose-700 dark:text-rose-400"}`}
                      >
                        {totals.profit.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </SectionCard>
        </div>
      </Card>
    </PageShell>
  );
}
