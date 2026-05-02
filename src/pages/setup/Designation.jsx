import { useEffect, useState } from "react";
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
import axiosInstance from "../../services/axiosInstance.js";
import { MdBadge, MdRefresh } from "react-icons/md";

const sectionStyles = {
  teal: { accent: "bg-teal-500", header: "border-teal-100 bg-teal-50/80" },
  emerald: {
    accent: "bg-emerald-500",
    header: "border-emerald-100 bg-emerald-50/80",
  },
  cyan: { accent: "bg-cyan-500", header: "border-cyan-100 bg-cyan-50/80" },
};

function SectionCard({ color = "teal", title, children }) {
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

function createEmptyForm() {
  return { designationName: "", description: "" };
}

export default function Designation() {
  const [form, setForm] = useState(createEmptyForm);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchDesignations();
  }, []);

  async function fetchDesignations() {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/designations");
      const data = res.data;
      setDesignations(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to load designations.",
      );
      setDesignations([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.designationName.trim()) {
      toast.error("Designation Name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        designationName: form.designationName.trim(),
        description: form.description.trim(),
      };
      if (editId) {
        await axiosInstance.put(`/designations/${editId}`, payload);
        toast.success("Designation updated successfully.");
      } else {
        await axiosInstance.post("/designations", payload);
        toast.success("Designation created successfully.");
      }
      resetForm();
      setIsFormOpen(false);
      fetchDesignations();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Unable to save designation.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this designation?")) return;
    try {
      await axiosInstance.delete(`/designations/${id}`);
      toast.success("Designation deleted successfully.");
      if (editId === id) resetForm();
      fetchDesignations();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to delete designation.",
      );
    }
  }

  function handleEdit(desig) {
    setEditId(desig.id);
    setForm({
      designationName: desig.designation_name || "",
      description: desig.description || "",
    });
    setIsFormOpen(true);
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditId(null);
    setForm(createEmptyForm());
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
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
              Designations
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Create and manage employee designations and job titles.
            </p>
          </div>
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
                Add Designation
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
              <Card className="mx-auto max-w-5xl border-l-[6px] border-l-teal-500 p-3 mb-6">
                <SectionHeader
                  title={editId ? "Edit Designation" : "Add Designation"}
                  description="Manage designation records."
                  icon={<MdBadge className="h-5 w-5" />}
                />

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid gap-3 lg:grid-cols-2">
                    <SectionCard color="teal" title="Designation Details">
                      <div className="grid gap-3">
                        <Field label="Designation Name" required>
                          <input
                            type="text"
                            value={form.designationName}
                            onChange={(e) =>
                              updateField("designationName", e.target.value)
                            }
                            placeholder="e.g. Senior Developer"
                            className={inputCls}
                          />
                        </Field>
                        <Field label="Description">
                          <textarea
                            rows={2}
                            value={form.description}
                            onChange={(e) =>
                              updateField("description", e.target.value)
                            }
                            placeholder="Brief description of this designation"
                            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                          />
                        </Field>
                      </div>
                    </SectionCard>

                    <div className="flex flex-col justify-end gap-3 pb-2">
                      <div className="flex justify-end gap-2">
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
                          className="inline-flex min-w-[110px] items-center justify-center rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm shadow-teal-100"
                        >
                          {submitting
                            ? "Saving..."
                            : editId
                              ? "Update"
                              : "Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List Card below form */}
        <Card className="mx-auto max-w-5xl p-0 overflow-hidden">
          <SectionHeader
            title="Designation Registry"
            description={`${designations.length} designations`}
            icon={<MdBadge className="h-5 w-5" />}
            action={
              <div className="p-4">
                <button
                  type="button"
                  onClick={fetchDesignations}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <MdRefresh className="inline mr-1" /> Refresh
                </button>
              </div>
            }
          />
          {loading ? (
            <TableState message="Loading designations..." />
          ) : designations.length === 0 ? (
            <TableState message="No designations found yet." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left transition-colors">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-teal-400">
                    <th className="px-5 py-3 w-12">#</th>
                    <th className="px-5 py-3">Designation Name</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-900 transition-colors">
                  {designations.map((d, i) => (
                    <motion.tr
                      key={d.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group transition-colors hover:bg-teal-50/30 dark:hover:bg-teal-900/10"
                    >
                      <td className="px-5 py-4 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                        {i + 1}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">
                        {d.designation_name}
                      </td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-[11px] max-w-xs truncate">
                        {d.description || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionButton
                            label="Edit"
                            tone="teal"
                            onClick={() => handleEdit(d)}
                          />
                          <ActionButton
                            label="Delete"
                            tone="rose"
                            onClick={() => handleDelete(d.id)}
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
