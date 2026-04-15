import { useState, useEffect } from "react";
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
      {children}
    </div>
  );
}

function GridIcon({ className }) {
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
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  );
}

function createEmptyForm() {
  return {
    head: "",
    description: "",
  };
}

export default function ExpenseHeadPage() {
  const [form, setForm] = useState(createEmptyForm);
  const [expenseHeads, setExpenseHeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchHeads();
  }, []);

  async function fetchHeads() {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/expense-heads");
      const data = response.data;
      setExpenseHeads(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to load expense heads.",
      );
      setExpenseHeads([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.head.trim()) {
      toast.error("Expense head name is required.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        head: form.head.trim(),
        description: form.description.trim(),
      };

      if (editId) {
        await axiosInstance.put(`/expense-heads/${editId}`, payload);
      } else {
        await axiosInstance.post("/expense-heads", payload);
      }

      toast.success(
        editId
          ? "Expense Head updated successfully."
          : "Expense Head defined successfully.",
      );
      resetForm();
      setIsFormOpen(false);
      fetchHeads();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Unable to save expense head.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this expense head?")) return;

    try {
      await axiosInstance.delete(`/expense-heads/${id}`);
      toast.success("Expense Head deleted successfully.");
      fetchHeads();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to delete expense head.",
      );
    }
  }

  function handleEdit(eh) {
    setEditId(eh.id);
    setForm({
      head: eh.head || "",
      description: eh.description || "",
    });
    setIsFormOpen(true);
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

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Expense Heads
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Define distinct expense categories or heads for financial
              tracking.
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
                Add Head
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
              <Card className="mx-auto max-w-4xl border-l-[6px] border-l-teal-500 p-3.5 mb-6">
                <SectionHeader
                  title={editId ? "Edit Expense Head" : "Create Expense Head"}
                  description="Categorize your operational and fixed costs."
                  icon={<GridIcon className="h-6 w-6" />}
                />

                <form onSubmit={handleSubmit} className="space-y-4">
                  <SectionCard color="teal" title="Head Details">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Head Name"
                        required
                        className="sm:col-span-2"
                      >
                        <input
                          type="text"
                          value={form.head}
                          onChange={(e) => updateField("head", e.target.value)}
                          placeholder="e.g. Office Rent, Utility Bills, Salaries"
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Description" className="sm:col-span-2">
                        <textarea
                          rows={2}
                          value={form.description}
                          onChange={(e) =>
                            updateField("description", e.target.value)
                          }
                          placeholder="Details about what falls under this expense head"
                          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                        />
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
            title="Registered Expense Heads"
            description={`${expenseHeads.length} categories found`}
            icon={<GridIcon className="h-6 w-6" />}
            action={
              <div className="p-4">
                <button
                  type="button"
                  onClick={fetchHeads}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Refresh Heads
                </button>
              </div>
            }
          />

          {loading ? (
            <TableState message="Loading expense heads..." />
          ) : expenseHeads.length === 0 ? (
            <TableState message="No expense heads configured." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left transition-colors">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-teal-400">
                    <th className="px-5 py-3 w-16">ID</th>
                    <th className="px-5 py-3 w-1/3">Head Name</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-900 transition-colors">
                  {expenseHeads.map((eh) => (
                    <motion.tr
                      key={eh.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group transition-colors hover:bg-teal-50/30 dark:hover:bg-teal-900/10"
                    >
                      <td className="px-5 py-4 text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                        #{eh.id}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">
                        {eh.head}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-[12px] text-slate-600 dark:text-slate-400 max-w-sm truncate">
                          {eh.description || "-"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionButton
                            label="Edit"
                            tone="teal"
                            onClick={() => handleEdit(eh)}
                          />
                          <ActionButton
                            label="Delete"
                            tone="rose"
                            onClick={() => handleDelete(eh.id)}
                          />
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
