import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  Field,
  PageShell,
  SectionHeader,
  Toggle,
  TableState,
  ActionButton,
  StatusChip,
} from "../../components/layout/PageShell.jsx";
import axiosInstance from "../../services/axiosInstance";
import { usePermissions } from "../../hooks/usePermissions";
import { MdLock } from "react-icons/md";

export default function SubCategory() {
  const { canCreate, canRead, canUpdate, canDelete, isAdmin } =
    usePermissions();
  const MODULE_NAME = "Sub Category";

  const [form, setForm] = useState({
    category_id: "",
    subcategory_name: "",
    is_enable: true,
  });
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Permission checks
  const canCreateSubCategory = isAdmin || canCreate(MODULE_NAME);
  const canReadSubCategory = isAdmin || canRead(MODULE_NAME);
  const canUpdateSubCategory = isAdmin || canUpdate(MODULE_NAME);
  const canDeleteSubCategory = isAdmin || canDelete(MODULE_NAME);

  useEffect(() => {
    if (canReadSubCategory) {
      fetchCategories();
      fetchSubcategories();
    }
  }, [canReadSubCategory]);

  const enabledCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.is_enable === 1 || category.is_enable === true,
      ),
    [categories],
  );

  async function fetchCategories() {
    try {
      const response = await axiosInstance.get("/categories");
      const data = response.data;
      setCategories(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to load category options.",
      );
    }
  }

  async function fetchSubcategories() {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/sub-categories");
      const data = response.data;
      setSubcategories(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to load subcategories.",
      );
      setSubcategories([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canCreateSubCategory && !canUpdateSubCategory) {
      toast.error("You don't have permission to save subcategories.");
      return;
    }

    if (!form.category_id) {
      toast.error("Please select a category first.");
      return;
    }

    if (!form.subcategory_name.trim()) {
      toast.error("Subcategory name is required.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        category_id: form.category_id,
        sub_category_name: form.subcategory_name.trim(),
        is_enable: form.is_enable ? 1 : 0,
      };
      if (editId) {
        if (!canUpdateSubCategory) {
          toast.error("You don't have permission to update subcategories.");
          return;
        }
        await axiosInstance.put(`/sub-categories/${editId}`, payload);
        toast.success("Subcategory updated successfully.");
      } else {
        if (!canCreateSubCategory) {
          toast.error("You don't have permission to create subcategories.");
          return;
        }
        await axiosInstance.post("/sub-categories", payload);
        toast.success("Subcategory created successfully.");
      }

      resetForm();
      setIsFormOpen(false);
      fetchSubcategories();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to save subcategory.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!canDeleteSubCategory) {
      toast.error("You don't have permission to delete subcategories.");
      return;
    }
    if (!window.confirm("Delete this subcategory?")) return;

    try {
      await axiosInstance.delete(`/sub-categories/${id}`);
      toast.success("Subcategory deleted successfully.");
      fetchSubcategories();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to delete subcategory.",
      );
    }
  }

  function handleEdit(subcategory) {
    if (!canUpdateSubCategory) {
      toast.error("You don't have permission to edit subcategories.");
      return;
    }
    setEditId(subcategory.id);
    setForm({
      category_id: `${subcategory.category_id ?? ""}`,
      subcategory_name: subcategory.sub_category_name || "",
      is_enable: subcategory.is_enable === 1 || subcategory.is_enable === true,
    });
    setIsFormOpen(true);
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditId(null);
    setForm({
      category_id: "",
      subcategory_name: "",
      is_enable: true,
    });
  }

  function getCategoryName(id) {
    return (
      categories.find((category) => `${category.id}` === `${id}`)
        ?.category_name || "Unknown category"
    );
  }

  // Access Denied
  if (!canReadSubCategory) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-red-100">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdLock className="text-5xl text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Access Denied
            </h2>
            <p className="text-slate-500 mb-4">
              You don't have permission to view Subcategories.
            </p>
            <div className="bg-slate-50 rounded-lg p-3 text-left">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                Required Permission:
              </p>
              <p className="text-[12px] font-mono text-slate-700">
                Read Sub Category
              </p>
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
            <h1 className="text-xl font-bold text-slate-900">
              Subcategory Setup
            </h1>
            <p className="text-sm text-slate-500">
              Link each subcategory to a parent category for organized
              inventory.
            </p>
          </div>
          {canCreateSubCategory && (
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
                  Add New Subcategory
                </>
              )}
            </button>
          )}
        </div>

        {/* Collapsible Form - Only show if user can create */}
        <AnimatePresence>
          {isFormOpen && canCreateSubCategory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <Card className="border-l-[6px] border-l-teal-500 p-3 mb-6">
                <SectionHeader
                  title={editId ? "Edit Subcategory" : "New Subcategory"}
                  description="Choose a category, then enter the subcategory name."
                  icon={<SubCategoryIcon className="h-5 w-5" />}
                />

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid gap-2 md:grid-cols-[200px_minmax(0,300px)]">
                    <Field
                      label="Parent category"
                      required
                      hint="Only enabled categories are shown."
                    >
                      <div className="relative">
                        <select
                          value={form.category_id}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              category_id: event.target.value,
                            }))
                          }
                          className="h-8 w-full appearance-none rounded-md border border-slate-300 bg-white px-2.5 pr-7 text-[12px] text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                        >
                          <option value="">Select a category</option>
                          {enabledCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.category_name}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400">
                          <ChevronDownIcon className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </Field>

                    <Field
                      label="Subcategory name"
                      required
                      hint={
                        form.category_id
                          ? `Selected: ${getCategoryName(form.category_id)}`
                          : "Select a category to continue."
                      }
                    >
                      <input
                        type="text"
                        value={form.subcategory_name}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            subcategory_name: event.target.value,
                          }))
                        }
                        disabled={!form.category_id}
                        placeholder="Enter subcategory name"
                        className="h-8 w-full max-w-sm rounded-md border border-slate-300 bg-white px-2.5 text-[12px] text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </Field>
                  </div>

                  <Toggle
                    enabled={form.is_enable}
                    onChange={(value) =>
                      setForm((current) => ({ ...current, is_enable: value }))
                    }
                    label="Enable subcategory"
                    description="Use the toggle when the subcategory should appear in active selection lists."
                  />

                  <div className="flex flex-wrap justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex min-w-[120px] items-center justify-center rounded-xl bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? "Saving..." : editId ? "Update" : "Add"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setIsFormOpen(false);
                      }}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List card */}
        <Card className="p-0 overflow-hidden">
          <SectionHeader
            title="Subcategory list"
            description={`${subcategories.length} subcategories linked to categories`}
            icon={<ListIcon className="h-5 w-5" />}
            action={
              <div className="p-4">
                <button
                  type="button"
                  onClick={fetchSubcategories}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Refresh
                </button>
              </div>
            }
          />

          {loading ? (
            <TableState message="Loading subcategories..." />
          ) : subcategories.length === 0 ? (
            <TableState message="No subcategories found yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3 w-12">#</th>
                    <th className="px-5 py-3">Subcategory</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {subcategories.map((subcategory, index) => (
                    <motion.tr
                      key={subcategory.id ?? index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group transition-colors hover:bg-teal-50/30"
                    >
                      <td className="px-5 py-4 text-[11px] text-slate-400 font-mono">
                        {index + 1}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {subcategory.sub_category_name}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                          {getCategoryName(subcategory.category_id)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusChip
                          enabled={
                            subcategory.is_enable === 1 ||
                            subcategory.is_enable === true
                          }
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {canUpdateSubCategory && (
                            <ActionButton
                              label="Edit"
                              tone="teal"
                              onClick={() => handleEdit(subcategory)}
                            />
                          )}
                          {canDeleteSubCategory && (
                            <ActionButton
                              label="Delete"
                              tone="rose"
                              onClick={() => handleDelete(subcategory.id)}
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

function SubCategoryIcon({ className }) {
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
        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a3 3 0 006 0M9 5a3 3 0 016 0"
      />
    </svg>
  );
}

function ListIcon({ className }) {
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
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
      />
    </svg>
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
