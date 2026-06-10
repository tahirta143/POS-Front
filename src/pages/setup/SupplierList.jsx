import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  Field,
  PageShell,
  SectionHeader,
  Toggle,
  TableState,
  StatusChip,
  ActionButton,
} from "../../components/layout/PageShell.jsx";
import axiosInstance from "../../services/axiosInstance";
import { usePermissions } from "../../hooks/usePermissions";
import { confirmAction } from "../../components/ui/ConfirmDialog.jsx";
import { MdLock, MdRefresh } from "react-icons/md";

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
          className="h-8 w-full appearance-none rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 pr-7 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400 dark:text-slate-500 transition-colors">
          <svg
            className="h-3.5 w-3.5"
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

function TruckIcon({ className }) {
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
        d="M8 7h12m0 0l3 5v6H8m12-11V5H3v13h2m0 0a2 2 0 104 0m-4 0a2 2 0 114 0m7 0a2 2 0 104 0m-4 0a2 2 0 114 0M8 7H3"
      />
    </svg>
  );
}

function createEmptyForm() {
  return {
    supplierName: "",
    contactPerson: "",
    designation: "",
    phone: "",
    email: "",
    address: "",
    ntn: "",
    gstNumber: "",
    paymentTerms: "Cash",
    creditLimit: "",
    status: true,
  };
}

export default function SupplierPage() {
  const { canCreate, canRead, canUpdate, canDelete, isAdmin } =
    usePermissions();
  const MODULE_NAME = "Supplier";

  const [form, setForm] = useState(createEmptyForm);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Permission checks
  const canCreateSupplier = isAdmin || canCreate(MODULE_NAME);
  const canReadSupplier = isAdmin || canRead(MODULE_NAME);
  const canUpdateSupplier = isAdmin || canUpdate(MODULE_NAME);
  const canDeleteSupplier = isAdmin || canDelete(MODULE_NAME);

  useEffect(() => {
    if (canReadSupplier) {
      fetchSuppliers();
    }
  }, [canReadSupplier]);

  async function fetchSuppliers() {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/suppliers");
      const data = response.data;
      setSuppliers(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load suppliers.");
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canCreateSupplier && !canUpdateSupplier) {
      toast.error("You don't have permission to save suppliers.");
      return;
    }

    if (!form.supplierName.trim() || !form.paymentTerms) {
      toast.error("Supplier Name and Payment Terms are required.");
      return;
    }

    if (
      form.paymentTerms === "Credit" &&
      (!form.creditLimit || parseFloat(form.creditLimit) <= 0)
    ) {
      toast.error("A valid Credit Limit is required when Terms are Credit.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        supplierName: form.supplierName.trim(),
        contactPerson: form.contactPerson.trim(),
        designation: form.designation.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        ntn: form.ntn.trim(),
        gstNumber: form.gstNumber.trim(),
        paymentTerms: form.paymentTerms,
        creditLimit:
          form.paymentTerms === "Credit" ? parseFloat(form.creditLimit) : null,
        status: form.status,
      };

      if (editId) {
        if (!canUpdateSupplier) {
          toast.error("You don't have permission to update suppliers.");
          return;
        }
        await axiosInstance.put(`/suppliers/${editId}`, payload);
        toast.success("Supplier updated successfully.");
      } else {
        if (!canCreateSupplier) {
          toast.error("You don't have permission to create suppliers.");
          return;
        }
        await axiosInstance.post("/suppliers", payload);
        toast.success("Supplier saved successfully.");
      }

      resetForm();
      setIsFormOpen(false);
      fetchSuppliers();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Unable to save the supplier.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!canDeleteSupplier) {
      toast.error("You don't have permission to delete suppliers.");
      return;
    }
    const confirmed = await confirmAction({
      title: 'Delete supplier',
      message: 'This supplier will be removed from the system. This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      type: 'danger',
    })
    if (!confirmed) return

    try {
      await axiosInstance.delete(`/suppliers/${id}`);
      toast.success("Supplier deleted successfully.");
      fetchSuppliers();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete supplier.");
    }
  }

  function handleEdit(s) {
    if (!canUpdateSupplier) {
      toast.error("You don't have permission to edit suppliers.");
      return;
    }
    setEditId(s.id);
    setForm({
      supplierName: s.supplier_name || "",
      contactPerson: s.contact_person || "",
      designation: s.designation || "",
      phone: s.phone || "",
      email: s.email || "",
      address: s.address || "",
      ntn: s.ntn || "",
      gstNumber: s.gst || "",
      paymentTerms: s.payment_terms || "Cash",
      creditLimit: s.credit_limit || "",
      status: s.status === 1 || s.status === true,
    });
    setIsFormOpen(true);
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditId(null);
    setForm(createEmptyForm());
  }

  function updateField(key, value) {
    setForm((current) => {
      const updated = { ...current, [key]: value };
      if (key === "paymentTerms" && value === "Cash") {
        updated.creditLimit = "";
      }
      return updated;
    });
  }

  // Access Denied
  if (!canReadSupplier) {
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
              You don't have permission to view Suppliers.
            </p>
            <div className="bg-slate-50 rounded-lg p-3 text-left">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                Required Permission:
              </p>
              <p className="text-[12px] font-mono text-slate-700">
                Read Supplier
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
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Suppliers
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Register and manage material suppliers for your inventory.
            </p>
          </div>
          {canCreateSupplier && (
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
                  Add Supplier
                </>
              )}
            </button>
          )}
        </div>

        {/* Collapsible Form - Only show if user can create */}
        <AnimatePresence>
          {isFormOpen && canCreateSupplier && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <Card className="mx-auto max-w-5xl border-l-[6px] border-l-teal-500 p-3 mb-6">
                <SectionHeader
                  title={editId ? "Edit Supplier" : "Supplier Registration"}
                  description="Enter vendor contact, operation location, and commercial terms."
                  icon={<TruckIcon className="h-5 w-5" />}
                />

                <form onSubmit={handleSubmit} className="space-y-3">
                  <SectionCard color="teal" title="Business & Contact Details">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      <Field
                        label="Supplier Name"
                        required
                        className="lg:col-span-3"
                      >
                        <input
                          type="text"
                          value={form.supplierName}
                          onChange={(e) =>
                            updateField("supplierName", e.target.value)
                          }
                          placeholder="Official company or provider name"
                          className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                        />
                      </Field>
                      <Field label="Contact Person">
                        <input
                          type="text"
                          value={form.contactPerson}
                          onChange={(e) =>
                            updateField("contactPerson", e.target.value)
                          }
                          placeholder="Key account representative"
                          className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                        />
                      </Field>
                      <Field label="Designation">
                        <input
                          type="text"
                          value={form.designation}
                          onChange={(e) =>
                            updateField("designation", e.target.value)
                          }
                          placeholder="e.g. Distributor Manager"
                          className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                        />
                      </Field>
                      <Field label="Phone/Mobile Number">
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                          placeholder="Dial number"
                          className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                        />
                      </Field>
                      <Field label="Email Address">
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          placeholder="supplier@domain.com"
                          className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                        />
                      </Field>
                      <Field
                        label="Commercial Address"
                        className="sm:col-span-2"
                      >
                        <input
                          type="text"
                          value={form.address}
                          onChange={(e) =>
                            updateField("address", e.target.value)
                          }
                          placeholder="Operating address"
                          className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                        />
                      </Field>
                    </div>
                  </SectionCard>

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.85fr)]">
                    <SectionCard color="emerald" title="Financial & Tax">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <SelectField
                          label="Payment Terms"
                          required
                          value={form.paymentTerms}
                          onChange={(v) => updateField("paymentTerms", v)}
                          options={[
                            { value: "Cash", label: "Cash" },
                            { value: "Credit", label: "Credit" },
                          ]}
                        />
                        <Field
                          label="Credit Limit"
                          required={form.paymentTerms === "Credit"}
                        >
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              disabled={form.paymentTerms === "Cash"}
                              value={form.creditLimit}
                              onChange={(e) =>
                                updateField("creditLimit", e.target.value)
                              }
                              placeholder="0.00"
                              className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 pr-10 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:opacity-60 transition-colors"
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 transition-colors">
                              PKR
                            </span>
                          </div>
                        </Field>
                        <Field label="NTN">
                          <input
                            type="text"
                            value={form.ntn}
                            onChange={(e) => updateField("ntn", e.target.value)}
                            placeholder="National Tax Number"
                            className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                          />
                        </Field>
                        <Field label="GST Number">
                          <input
                            type="text"
                            value={form.gstNumber}
                            onChange={(e) =>
                              updateField("gstNumber", e.target.value)
                            }
                            placeholder="Sales Tax Number"
                            className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                          />
                        </Field>
                      </div>
                    </SectionCard>

                    <div className="flex flex-col gap-3">
                      <SectionCard color="cyan" title="System Settings">
                        <Toggle
                          enabled={form.status}
                          onChange={(v) => updateField("status", v)}
                          label="Supplier Status"
                          description="Active suppliers can be invoiced."
                        />
                      </SectionCard>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-4">
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
                      className="inline-flex min-w-[120px] items-center justify-center rounded-xl bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
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
        <Card className="mx-auto max-w-5xl p-0 overflow-hidden">
          <SectionHeader
            title="Supplier List"
            description={`${suppliers.length} vendors registered in system`}
            icon={<TruckIcon className="h-5 w-5" />}
            action={
              <div className="p-4">
                <button
                  type="button"
                  onClick={fetchSuppliers}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <MdRefresh className="inline mr-1" /> Refresh
                </button>
              </div>
            }
          />
          {loading ? (
            <TableState message="Loading suppliers..." />
          ) : suppliers.length === 0 ? (
            <TableState message="No suppliers found yet." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left transition-colors">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-teal-400">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3 text-center">Payment Terms</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-900 transition-colors">
                  {suppliers.map((s) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group transition-colors hover:bg-teal-50/30 dark:hover:bg-teal-900/10"
                    >
                      <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">
                        {s.supplier_name}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-medium text-slate-700 dark:text-slate-300">
                            {s.phone || "-"}
                          </span>
                          {s.contact_person && (
                            <span className="text-[10px] text-teal-600 font-semibold uppercase">
                              {s.contact_person}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-center">
                          <StatusChip
                            enabled={true}
                            label={s.payment_terms}
                            colorClass={
                              s.payment_terms === "Cash"
                                ? "bg-cyan-50 text-cyan-700"
                                : "bg-amber-50 text-amber-700"
                            }
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusChip
                          label={s.status === 1 ? "Active" : "Inactive"}
                          tone={s.status === 1 ? "emerald" : "rose"}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {canUpdateSupplier && (
                            <ActionButton
                              label="Edit"
                              tone="teal"
                              onClick={() => handleEdit(s)}
                            />
                          )}
                          {canDeleteSupplier && (
                            <ActionButton
                              label="Delete"
                              tone="rose"
                              onClick={() => handleDelete(s.id)}
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
