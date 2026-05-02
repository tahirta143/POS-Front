import { useEffect, useState, useRef } from "react";
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
import {
  MdAdd,
  MdRemove,
  MdArrowBack,
  MdBusiness,
  MdCloudUpload,
  MdEmail,
  MdPhone,
  MdLanguage,
  MdLocationOn,
  MdRefresh,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";

const sectionStyles = {
  teal: { accent: "bg-teal-500", header: "border-teal-100 bg-teal-50/80" },
  emerald: {
    accent: "bg-emerald-500",
    header: "border-emerald-100 bg-emerald-50/80",
  },
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
  return {
    companyName: "",
    email: "",
    address: "",
    phoneNumber: "",
    website: "",
    renewableLicense: false,
    expiryDate: "",
    companyLogo: null,
  };
}

function LicenceBadge({ renewable, expiryDate }) {
  if (!renewable)
    return (
      <span className="text-xs text-slate-400 italic font-medium">
        No Licence
      </span>
    );
  const expired = expiryDate && new Date(expiryDate) < new Date();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
        expired
          ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
          : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
      }`}
    >
      {expired ? "Expired" : "Active"}
    </span>
  );
}

export default function CompanyPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(createEmptyForm);
  const [logoPreview, setLogoPreview] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get("/companies");
      const data = response.data;
      setCompanies(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load companies.");
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.companyName.trim() || !form.email.trim())
      return setError("Company Name and Email are required.");

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const fd = new FormData();
      fd.append("companyName", form.companyName.trim());
      fd.append("email", form.email.trim());
      fd.append("address", form.address.trim());
      fd.append("phoneNumber", form.phoneNumber.trim());
      fd.append("website", form.website.trim());
      fd.append("renewableLicense", form.renewableLicense);
      fd.append("expiryDate", form.expiryDate);
      if (form.companyLogo instanceof File)
        fd.append("companyLogo", form.companyLogo);

      if (editId) {
        await axiosInstance.put(`/companies/${editId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axiosInstance.post("/companies", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setSuccess(
        editId
          ? "Company updated successfully."
          : "Company created successfully.",
      );
      resetForm();
      setIsFormOpen(false);
      fetchCompanies();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to save the company.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this company?")) return;
    try {
      await axiosInstance.delete(`/companies/${id}`);
      setSuccess("Company deleted successfully.");
      if (editId === id) resetForm();
      fetchCompanies();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete company.");
    }
  }

  function handleEdit(company) {
    setEditId(company.id);
    setForm({
      companyName: company.company_name || "",
      email: company.email || "",
      address: company.address || "",
      phoneNumber: company.phone_number || "",
      website: company.website || "",
      renewableLicense: !!company.renewable_license,
      expiryDate: company.expiry_date ? company.expiry_date.split("T")[0] : "",
      companyLogo: null,
    });
    setLogoPreview(
      company.company_logo
        ? `${axiosInstance.defaults.baseURL?.replace("/api", "")}/${company.company_logo}`
        : null,
    );
    setError("");
    setSuccess("");
    setIsFormOpen(true);
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditId(null);
    setForm(createEmptyForm());
    setLogoPreview(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function updateField(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "renewableLicense" && !value ? { expiryDate: "" } : {}),
    }));
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    updateField("companyLogo", file || null);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  }

  const inputCls =
    "h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100";

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/security")}
              className="group flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 transition hover:border-teal-200 hover:bg-teal-50 dark:hover:bg-slate-700 hover:text-teal-600"
            >
              <MdArrowBack className="h-5 w-5 transition group-hover:-translate-x-0.5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Company Profiles
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage registered entities and system branding.
              </p>
            </div>
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
                <MdRemove className="h-5 w-5" /> Close Form
              </>
            ) : (
              <>
                <MdAdd className="h-5 w-5" /> Add Company
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
              <Card className="mx-auto max-w-6xl border-l-[6px] border-l-teal-500 p-6 mb-6">
                <SectionHeader
                  title={
                    editId ? "Edit Organization" : "Register New Organization"
                  }
                  description="Setup company profile, contact data and licensing Information."
                  icon={<MdBusiness className="h-6 w-6 text-teal-600" />}
                />

                <StatusAlert type="error" message={error} />
                <StatusAlert type="success" message={success} />

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <SectionCard color="teal" title="General Information">
                      <div className="grid gap-3">
                        <Field label="Company Name" required>
                          <div className="relative">
                            <input
                              type="text"
                              value={form.companyName}
                              onChange={(e) =>
                                updateField("companyName", e.target.value)
                              }
                              placeholder="Full legal name"
                              className={inputCls}
                            />
                            <MdBusiness className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          </div>
                        </Field>
                        <Field label="Email Address" required>
                          <div className="relative">
                            <input
                              type="email"
                              value={form.email}
                              onChange={(e) =>
                                updateField("email", e.target.value)
                              }
                              placeholder="official@company.com"
                              className={inputCls}
                            />
                            <MdEmail className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          </div>
                        </Field>
                        <Field label="Company Website">
                          <div className="relative">
                            <input
                              type="text"
                              value={form.website}
                              onChange={(e) =>
                                updateField("website", e.target.value)
                              }
                              placeholder="www.company.com"
                              className={inputCls}
                            />
                            <MdLanguage className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          </div>
                        </Field>
                        <Field label="Contact Phone">
                          <div className="relative">
                            <input
                              type="text"
                              value={form.phoneNumber}
                              onChange={(e) =>
                                updateField("phoneNumber", e.target.value)
                              }
                              placeholder="Landline or mobile"
                              className={inputCls}
                            />
                            <MdPhone className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          </div>
                        </Field>
                      </div>
                    </SectionCard>

                    <div className="flex flex-col gap-4">
                      <SectionCard color="emerald" title="Licensing & Identity">
                        <div className="grid gap-3">
                          <div className="flex items-center justify-between px-1">
                            <div>
                              <p className="text-[11px] font-bold text-slate-400 dark:text-teal-400 uppercase tracking-widest">
                                Renewable Licence
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                Toggle if this system requires periodic renewal.
                              </p>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                              <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={form.renewableLicense}
                                onChange={(e) =>
                                  updateField(
                                    "renewableLicense",
                                    e.target.checked,
                                  )
                                }
                              />
                              <div className="h-6 w-11 rounded-full bg-slate-200 dark:bg-slate-700 peer-checked:bg-teal-600 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                            </label>
                          </div>

                          <Field
                            label="Expiry Date"
                            required={form.renewableLicense}
                          >
                            <input
                              type="date"
                              value={form.expiryDate}
                              onChange={(e) =>
                                updateField("expiryDate", e.target.value)
                              }
                              disabled={!form.renewableLicense}
                              className={`${inputCls} ${!form.renewableLicense ? "bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed border-dashed" : ""}`}
                            />
                          </Field>

                          <Field label="Company Branding / Logo">
                            <label className="flex h-12 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-teal-300 dark:hover:border-teal-500/50 cursor-pointer">
                              {logoPreview ? (
                                <img
                                  src={logoPreview}
                                  alt="Logo preview"
                                  className="h-full object-contain p-2"
                                />
                              ) : (
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                                  <MdCloudUpload className="text-teal-600 text-lg" />
                                  {editId
                                    ? "Replace Logo"
                                    : "Upload Organization Logo"}
                                </div>
                              )}
                              <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                              />
                            </label>
                          </Field>
                        </div>
                      </SectionCard>

                      <Field label="Office Location / Address">
                        <div className="relative">
                          <textarea
                            rows={2}
                            value={form.address}
                            onChange={(e) =>
                              updateField("address", e.target.value)
                            }
                            placeholder="Physical office HQ address..."
                            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1.5 pl-8 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
                          />
                          <MdLocationOn className="absolute left-2.5 top-3 text-slate-400" />
                        </div>
                      </Field>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setIsFormOpen(false);
                      }}
                      className="rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex min-w-[160px] items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 shadow-lg shadow-teal-100 disabled:opacity-50"
                    >
                      {submitting
                        ? "Saving..."
                        : editId
                          ? "Update Organization"
                          : "Register Organization"}
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Directory Table */}
        <Card className="mx-auto max-w-5xl p-0 overflow-hidden">
          <SectionHeader
            title="Registered Organizations"
            description={`${companies.length} active company profiles`}
            icon={<MdBusiness className="h-6 w-6 text-teal-600" />}
            action={
              <div className="p-4">
                <button
                  type="button"
                  onClick={fetchCompanies}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <MdRefresh className="inline mr-1" /> Refresh
                </button>
              </div>
            }
          />

          {loading ? (
            <TableState message="Loading organizations..." />
          ) : companies.length === 0 ? (
            <TableState message="No organizations registered yet." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left transition-colors">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-teal-400">
                    <th className="px-5 py-3">Entity</th>
                    <th className="px-5 py-3">Contact Details</th>
                    <th className="px-5 py-3">Licensing</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-900 transition-colors">
                  {companies.map((c) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`group transition-colors hover:bg-teal-50/30 dark:hover:bg-teal-900/10 ${editId === c.id ? "bg-teal-50/50 dark:bg-teal-900/20" : ""}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {c.company_logo &&
                          typeof c.company_logo === "string" ? (
                            <img
                              src={`${axiosInstance.defaults.baseURL?.replace("/api", "")}/${c.company_logo}`}
                              alt={c.company_name}
                              className="h-10 w-10 rounded-lg object-contain border dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
                            />
                          ) : (
                            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50">
                              <MdBusiness className="text-xl" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {c.company_name}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate max-w-[150px]">
                              {c.address || "No address set"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                            {c.email}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {c.phone_number || "No Phone"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <LicenceBadge
                          renewable={c.renewable_license}
                          expiryDate={c.expiry_date}
                        />
                        {c.expiry_date && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                            {new Date(c.expiry_date).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionButton
                            label="Edit"
                            tone="teal"
                            onClick={() => handleEdit(c)}
                          />
                          <ActionButton
                            label="Delete"
                            tone="rose"
                            onClick={() => handleDelete(c.id)}
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
