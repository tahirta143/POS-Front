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

function FactoryIcon({ className }) {
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
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  );
}

function createEmptyForm() {
  return {
    manufacturerId: "",
    manufacturerName: "",
    address: "",
    email: "",
    phone: "",
    contactPerson: "",
    mobileNumber: "",
    designation: "",
    ntn: "",
    gstNumber: "",
    status: true,
  };
}

export default function Manufacturers() {
  const { canCreate, canRead, canUpdate, canDelete, isAdmin } = usePermissions()
  const MODULE_NAME = "Manufacturer"

  const [form, setForm] = useState(createEmptyForm);
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Permission checks
  const canCreateManufacturer = isAdmin || canCreate(MODULE_NAME)
  const canReadManufacturer = isAdmin || canRead(MODULE_NAME)
  const canUpdateManufacturer = isAdmin || canUpdate(MODULE_NAME)
  const canDeleteManufacturer = isAdmin || canDelete(MODULE_NAME)

  useEffect(() => {
    if (canReadManufacturer) {
      fetchManufacturers();
    }
  }, [canReadManufacturer]);

  async function fetchManufacturers() {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/manufacturers");
      const data = response.data;
      setManufacturers(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to load manufacturers.",
      );
      setManufacturers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canCreateManufacturer && !canUpdateManufacturer) {
      toast.error("You don't have permission to save manufacturers.")
      return
    }

    if (!form.manufacturerId.trim() || !form.manufacturerName.trim()) {
      toast.error("Manufacturer ID and Name are required.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        manufacturerId: form.manufacturerId.trim(),
        manufacturerName: form.manufacturerName.trim(),
        contactPerson: form.contactPerson.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        mobileNumber: form.mobileNumber.trim(),
        designation: form.designation.trim(),
        ntn: form.ntn.trim(),
        gstNumber: form.gstNumber.trim(),
        status: form.status,
      };

      if (editId) {
        if (!canUpdateManufacturer) {
          toast.error("You don't have permission to update manufacturers.")
          return
        }
        await axiosInstance.put(`/manufacturers/${editId}`, payload);
        toast.success("Manufacturer updated successfully.");
      } else {
        if (!canCreateManufacturer) {
          toast.error("You don't have permission to create manufacturers.")
          return
        }
        await axiosInstance.post("/manufacturers", payload);
        toast.success("Manufacturer saved successfully.");
      }

      resetForm();
      setIsFormOpen(false);
      fetchManufacturers();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Unable to save the manufacturer.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!canDeleteManufacturer) {
      toast.error("You don't have permission to delete manufacturers.")
      return
    }
    if (!window.confirm("Delete this manufacturer?")) return;

    try {
      await axiosInstance.delete(`/manufacturers/${id}`);
      toast.success("Manufacturer deleted successfully.");
      fetchManufacturers();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to delete manufacturer.",
      );
    }
  }

  function handleEdit(m) {
    if (!canUpdateManufacturer) {
      toast.error("You don't have permission to edit manufacturers.")
      return
    }
    setEditId(m.id);
    setForm({
      manufacturerId: m.manufacturer_id || "",
      manufacturerName: m.manufacturer_name || "",
      address: m.address || "",
      email: m.email || "",
      phone: m.phone || "",
      contactPerson: m.contact_person || "",
      mobileNumber: m.mobile || "",
      designation: m.designation || "",
      ntn: m.ntn || "",
      gstNumber: m.gst || "",
      status: m.status === 1 || m.status === true,
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

  // Access Denied
  if (!canReadManufacturer) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-red-100">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdLock className="text-5xl text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
            <p className="text-slate-500 mb-4">
              You don't have permission to view Manufacturers.
            </p>
            <div className="bg-slate-50 rounded-lg p-3 text-left">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Required Permission:</p>
              <p className="text-[12px] font-mono text-slate-700">Read Manufacturers</p>
            </div>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Manufacturers
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Register and manage manufacturers to link with your inventory
              items.
            </p>
          </div>
          {canCreateManufacturer && (
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
                  Add Manufacturer
                </>
              )}
            </button>
          )}
        </div>

        {/* Collapsible Form - Only show if user can create */}
        <AnimatePresence>
          {isFormOpen && canCreateManufacturer && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <Card className="mx-auto max-w-5xl border-l-[6px] border-l-teal-500 p-3 mb-6">
                <SectionHeader
                  title={
                    editId ? "Edit Manufacturer" : "Manufacturer Registration"
                  }
                  description="Enter primary, contact, and tax details for the manufacturer."
                  icon={<FactoryIcon className="h-5 w-5" />}
                />

                <form onSubmit={handleSubmit} className="space-y-3">
                  <SectionCard color="teal" title="Primary Details">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      <Field label="Manufacturer ID" required>
                        <input
                          type="text"
                          value={form.manufacturerId}
                          onChange={(e) =>
                            updateField("manufacturerId", e.target.value)
                          }
                          placeholder="e.g. MFG-001"
                          className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                        />
                      </Field>
                      <Field
                        label="Manufacturer Name"
                        required
                        className="lg:col-span-2"
                      >
                        <input
                          type="text"
                          value={form.manufacturerName}
                          onChange={(e) =>
                            updateField("manufacturerName", e.target.value)
                          }
                          placeholder="Full name of manufacturer"
                          className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                        />
                      </Field>
                    </div>
                  </SectionCard>

                  <SectionCard color="emerald" title="Contact & Personnel">
                    <div className="space-y-2">
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        <Field label="Contact Person">
                          <input
                            type="text"
                            value={form.contactPerson}
                            onChange={(e) =>
                              updateField("contactPerson", e.target.value)
                            }
                            placeholder="Representative name"
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
                            placeholder="e.g. Sales Manager"
                            className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                          />
                        </Field>
                        <Field label="Email Address">
                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) =>
                              updateField("email", e.target.value)
                            }
                            placeholder="contact@manufacturer.com"
                            className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                          />
                        </Field>
                        <Field label="Phone/Landline">
                          <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) =>
                              updateField("phone", e.target.value)
                            }
                            placeholder="Phone number"
                            className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                          />
                        </Field>
                        <Field label="Mobile Number">
                          <input
                            type="tel"
                            value={form.mobileNumber}
                            onChange={(e) =>
                              updateField("mobileNumber", e.target.value)
                            }
                            placeholder="Mobile number"
                            className="h-8 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                          />
                        </Field>
                      </div>
                      <div className="grid gap-2">
                        <Field label="Physical Address">
                          <textarea
                            rows={2}
                            value={form.address}
                            onChange={(e) =>
                              updateField("address", e.target.value)
                            }
                            placeholder="Complete headquarters or factory address"
                            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                          />
                        </Field>
                      </div>
                    </div>
                  </SectionCard>

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.85fr)]">
                    <SectionCard color="cyan" title="Tax Information">
                      <div className="grid gap-2 sm:grid-cols-2">
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
                      <SectionCard color="teal" title="System Settings">
                        <Toggle
                          enabled={form.status}
                          onChange={(v) => updateField("status", v)}
                          label="Manufacturer Status"
                          description="Active manufacturers are selectable."
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
            title="Manufacturer List"
            description={`${manufacturers.length} manufacturers registered in system`}
            icon={<FactoryIcon className="h-5 w-5" />}
            action={
              <div className="p-4">
                <button
                  type="button"
                  onClick={fetchManufacturers}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <MdRefresh className="inline mr-1" /> Refresh
                </button>
              </div>
            }
          />
          {loading ? (
            <TableState message="Loading manufacturers..." />
          ) : manufacturers.length === 0 ? (
            <TableState message="No manufacturers found yet." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left transition-colors">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-teal-400">
                    <th className="px-5 py-3">MFG-ID</th>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-900 transition-colors">
                  {manufacturers.map((m) => (
                    <motion.tr
                      key={m.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group transition-colors hover:bg-teal-50/30 dark:hover:bg-teal-900/10"
                    >
                      <td className="px-5 py-4 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                        {m.manufacturer_id}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">
                        {m.manufacturer_name}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-medium text-slate-700 dark:text-slate-300">
                            {m.phone || m.mobile || "-"}
                          </span>
                          {m.contact_person && (
                            <span className="text-[10px] text-teal-600 font-semibold uppercase">
                              {m.contact_person}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusChip
                          label={m.status === 1 ? "Active" : "Inactive"}
                          tone={m.status === 1 ? "emerald" : "rose"}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {canUpdateManufacturer && (
                            <ActionButton
                              label="Edit"
                              tone="teal"
                              onClick={() => handleEdit(m)}
                            />
                          )}
                          {canDeleteManufacturer && (
                            <ActionButton
                              label="Delete"
                              tone="rose"
                              onClick={() => handleDelete(m.id)}
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