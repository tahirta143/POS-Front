import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  Field,
  PageShell,
  SectionHeader,
  StatusAlert,
  TableState,
  ActionButton,
} from "../../components/layout/PageShell.jsx";
import axiosInstance from "../../services/axiosInstance";
import { usePermissions } from "../../hooks/usePermissions";
import { MdSecurity, MdLock } from "react-icons/md";

const sectionStyles = {
  emerald: {
    accent: "bg-emerald-500",
    header: "border-emerald-100 bg-emerald-50/80",
  },
  teal: { accent: "bg-teal-500", header: "border-teal-100 bg-teal-50/80" },
  cyan: { accent: "bg-cyan-500", header: "border-cyan-100 bg-cyan-50/80" },
};

function SectionCard({ color, title, children }) {
  const style = sectionStyles[color] ?? sectionStyles.teal;
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
          className="h-8 w-full appearance-none rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 pr-8 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:opacity-75 transition-colors"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400 dark:text-slate-500 transition-colors">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </Field>
  );
}

function DocumentIcon({ className }) {
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
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function createEmptyForm() {
  return {
    date: new Date().toISOString().split("T")[0],
    expenseHeadId: "",
    details: "",
    amount: "",
  };
}

export default function ExpenseVoucherPage() {
  const { canCreate, canRead, canUpdate, canDelete, canPrint, isAdmin } = usePermissions();
  const MODULE_NAME = "Expense Voucher";

  const [form, setForm] = useState(createEmptyForm);
  const [heads, setHeads] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loadingHeads, setLoadingHeads] = useState(false);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Permission checks
  const canCreateVoucher = isAdmin || canCreate(MODULE_NAME);
  const canReadVoucher = isAdmin || canRead(MODULE_NAME);
  const canUpdateVoucher = isAdmin || canUpdate(MODULE_NAME);
  const canDeleteVoucher = isAdmin || canDelete(MODULE_NAME);
  const canPrintVoucher = isAdmin || canPrint(MODULE_NAME);

  useEffect(() => {
    if (canReadVoucher) {
      fetchHeads();
      fetchVouchers();
    }
  }, [canReadVoucher]);

  async function fetchHeads() {
    setLoadingHeads(true);
    try {
      const response = await axiosInstance.get("/expense-heads");
      const data = response.data;
      setHeads(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Unable to load Expense Heads. Ensure the module is configured.",
      );
    } finally {
      setLoadingHeads(false);
    }
  }

  async function fetchVouchers() {
    setLoadingVouchers(true);
    try {
      const response = await axiosInstance.get("/expense-vouchers");
      const data = response.data;
      setVouchers(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Unable to load Expense Vouchers.",
      );
    } finally {
      setLoadingVouchers(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.expenseHeadId) {
      toast.error("Please select an Expense Head.");
      return;
    }

    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        voucher_date: form.date,
        head_id: Number(form.expenseHeadId),
        details: form.details.trim(),
        amount: parseFloat(form.amount),
      };

      if (editId) {
        if (!canUpdateVoucher) {
          toast.error("You don't have permission to update vouchers.");
          return;
        }
        await axiosInstance.put(`/expense-vouchers/${editId}`, payload);
        toast.success("Voucher updated successfully.");
      } else {
        if (!canCreateVoucher) {
          toast.error("You don't have permission to create vouchers.");
          return;
        }
        await axiosInstance.post("/expense-vouchers", payload);
        toast.success("Expense Voucher recorded successfully.");
      }

      resetForm();
      setIsFormOpen(false);
      fetchVouchers();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Unable to record voucher.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!canDeleteVoucher) {
      toast.error("You don't have permission to delete vouchers.");
      return;
    }
    
    if (!window.confirm("Delete this expense voucher?")) return;

    try {
      await axiosInstance.delete(`/expense-vouchers/${id}`);
      toast.success("Voucher deleted successfully.");
      fetchVouchers();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete voucher.");
    }
  }

  function handleEdit(v) {
    if (!canUpdateVoucher) {
      toast.error("You don't have permission to edit vouchers.");
      return;
    }
    
    setEditId(v.id);
    setForm({
      date: v.voucher_date
        ? new Date(v.voucher_date).toISOString().split("T")[0]
        : "",
      expenseHeadId: v.head_id || "",
      details: v.details || "",
      amount: v.amount || "",
    });
    setIsFormOpen(true);
    toast.dismiss();
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditId(null);
    setForm(createEmptyForm());
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const inputCls =
    "h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors";

  // Access Denied
  if (!canReadVoucher) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-red-100">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdLock className="text-5xl text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
            <p className="text-slate-500 mb-4">
              You don't have permission to view Expense Vouchers.
            </p>
            <div className="bg-slate-50 rounded-lg p-3 text-left">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Required Permission:</p>
              <p className="text-[12px] font-mono text-slate-700">Read Expense Voucher</p>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Expense Vouchers
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Record operational costs against specific expense heads for
              accountability.
            </p>
          </div>
          {canCreateVoucher && (
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
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                  : "bg-teal-600 text-white hover:bg-teal-700 hover:shadow-teal-100"
              }`}
            >
              {isFormOpen ? (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Close Form
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Issue Voucher
                </>
              )}
            </button>
          )}
        </div>

        {/* Collapsible Form - Only show if user can create */}
        <AnimatePresence>
          {isFormOpen && canCreateVoucher && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <Card className="mx-auto max-w-4xl border-l-[6px] border-l-teal-500 p-3.5 mb-6">
                <SectionHeader
                  title={editId ? "Edit Voucher" : "Issue Voucher"}
                  description="Log an expense entry to deduct from your accounts."
                  icon={<DocumentIcon className="h-6 w-6" />}
                />

                <form onSubmit={handleSubmit} className="space-y-4">
                  <SectionCard color="teal" title="Transaction Details">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Field label="Voucher Date" required>
                        <input
                          type="date"
                          value={form.date}
                          onChange={(e) => updateField("date", e.target.value)}
                          className={inputCls}
                        />
                      </Field>

                      <div className="sm:col-span-1 lg:col-span-2">
                        <SelectField
                          label="Expense Head"
                          required
                          value={form.expenseHeadId}
                          onChange={(v) => updateField("expenseHeadId", v)}
                          placeholder={
                            loadingHeads ? "Loading..." : "Select Head..."
                          }
                          options={heads.map((h) => ({
                            value: h.id,
                            label: h.head,
                          }))}
                        />
                      </div>

                      <Field
                        label="Description / Details"
                        className="sm:col-span-2 lg:col-span-2"
                      >
                        <textarea
                          rows={2}
                          value={form.details}
                          onChange={(e) =>
                            updateField("details", e.target.value)
                          }
                          placeholder="Short description of the transaction"
                          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                        />
                      </Field>

                      <Field
                        label="Amount"
                        required
                        className="sm:col-span-2 lg:col-span-1"
                      >
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={form.amount}
                            onChange={(e) =>
                              updateField("amount", e.target.value)
                            }
                            placeholder="0.00"
                            className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 pr-12 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 transition-colors">
                            PKR
                          </span>
                        </div>
                      </Field>
                    </div>
                  </SectionCard>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setIsFormOpen(false);
                      }}
                      className="inline-flex min-w-[100px] items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex min-w-[120px] items-center justify-center rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm shadow-teal-100"
                    >
                      {submitting ? "Saving..." : editId ? "Update" : "Save"}
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List Card below form */}
        <Card className="mx-auto max-w-4xl p-0 overflow-hidden">
          <SectionHeader
            title="Voucher Log"
            description={`${vouchers.length} vouchers recorded in system`}
            icon={<DocumentIcon className="h-6 w-6" />}
            action={
              <div className="p-4">
                <button
                  type="button"
                  onClick={fetchVouchers}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Refresh Logs
                </button>
              </div>
            }
          />

          {loadingVouchers ? (
            <TableState message="Loading vouchers..." />
          ) : vouchers.length === 0 ? (
            <TableState message="No vouchers recorded yet." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left transition-colors">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-teal-400">
                    <th className="px-5 py-3 w-28">Date</th>
                    <th className="px-5 py-3">Expense Head</th>
                    <th className="px-5 py-3">Details</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-900 transition-colors">
                  {vouchers.map((v) => (
                    <motion.tr
                      key={v.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group transition-colors hover:bg-teal-50/30 dark:hover:bg-teal-900/10"
                    >
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap text-[12px]">
                        {new Date(v.voucher_date).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">
                        {v.head_name || v.head?.name || `Head #${v.head_id}`}
                      </td>
                      <td className="px-5 py-4">
                        {v.details ? (
                          <div className="max-w-[200px] truncate text-[12px] text-slate-600 dark:text-slate-400">
                            {v.details}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-[13px] font-black text-rose-600 dark:text-rose-400">
                          PKR {parseFloat(v.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {canUpdateVoucher && (
                            <ActionButton
                              label="Edit"
                              tone="teal"
                              onClick={() => handleEdit(v)}
                            />
                          )}
                          {canDeleteVoucher && (
                            <ActionButton
                              label="Delete"
                              tone="rose"
                              onClick={() => handleDelete(v.id)}
                            />
                          )}
                          {canPrintVoucher && (
                            <ActionButton
                              label="Print"
                              tone="purple"
                              onClick={() => window.print()}
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