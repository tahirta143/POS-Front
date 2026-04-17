import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdAdd,
  MdRemove,
  MdArrowBack,
  MdRefresh,
  MdViewModule,
} from "react-icons/md";
import axiosInstance from "../../services/axiosInstance";
import {
  ActionButton,
  Card,
  Field,
  PageShell,
  SectionHeader,
  StatusAlert,
  TableState,
} from "../../components/layout/PageShell.jsx";

function emptyForm() {
  return { groupName: "" };
}

export default function SoftwareGroup() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [groups, setGroups] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    setLoading(true);
    setMessage("");
    try {
      const response = await axiosInstance.get("/groups");
      setGroups(Array.isArray(response.data) ? response.data : []);
    } catch {
      setGroups([]);
      setMessage("Software groups could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.groupName.trim()) {
      toast.error("Software group name is required.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const payload = { group_name: form.groupName.trim() };
      if (editId) {
        await axiosInstance.put(`/groups/${editId}`, payload);
        toast.success("Software group updated successfully.");
      } else {
        await axiosInstance.post("/groups", payload);
        toast.success("Software group created successfully.");
      }
      resetForm();
      setIsFormOpen(false);
      fetchGroups();
    } catch (error) {
      setMessage(
        error?.response?.data?.message || "Unable to save software group.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(group) {
    setEditId(group.id);
    setForm({ groupName: group.group_name || "" });
    setMessage("");
    setIsFormOpen(true);
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(group) {
    if (!window.confirm(`Delete "${group.group_name}"?`)) return;
    try {
      await axiosInstance.delete(`/groups/${group.id}`);
      toast.success("Software group deleted successfully.");
      if (editId === group.id) resetForm();
      fetchGroups();
    } catch (error) {
      setMessage(
        error?.response?.data?.message || "Unable to delete software group.",
      );
    }
  }

  function resetForm() {
    setEditId(null);
    setForm(emptyForm());
    setMessage("");
  }

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/security")}
              className="group flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-600"
            >
              <MdArrowBack className="h-5 w-5 transition group-hover:-translate-x-0.5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Software Groups
              </h1>
              <p className="text-sm text-slate-500">
                Manage security groups for role-based access control.
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
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                : "bg-teal-600 text-white hover:bg-teal-700 hover:shadow-teal-100"
            }`}
          >
            {isFormOpen ? (
              <>
                <MdRemove className="h-5 w-5" /> Close Form
              </>
            ) : (
              <>
                <MdAdd className="h-5 w-5" /> New Group
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
              <Card className="mx-auto max-w-5xl border-l-[6px] border-l-teal-500 p-6 mb-6">
                <SectionHeader
                  title={editId ? "Edit Software Group" : "Define New Group"}
                  description="Setup a security container for user assignment."
                  icon={<MdViewModule className="h-6 w-6 text-teal-600" />}
                />

                <StatusAlert type="error" message={message} />

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <Field label="Group Code">
                      <input
                        type="text"
                        className="h-8 w-full rounded-md border border-slate-100 bg-slate-50 px-2.5 text-[12px] font-mono text-slate-500"
                        value={
                          editId
                            ? `GRP-${String(editId).padStart(4, "0")}`
                            : "Auto generated"
                        }
                        disabled
                      />
                    </Field>
                    <Field label="Group Name" required>
                      <input
                        type="text"
                        className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 shadow-sm"
                        placeholder="e.g. System Administrators"
                        required
                        value={form.groupName}
                        onChange={(event) =>
                          setForm({ groupName: event.target.value })
                        }
                      />
                    </Field>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setIsFormOpen(false);
                      }}
                      className="rounded-xl px-6 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2 text-sm font-bold text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition disabled:opacity-50"
                    >
                      {submitting
                        ? "Saving..."
                        : editId
                          ? "Update Group"
                          : "Register Group"}
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Groups List Table */}
        <Card className="mx-auto max-w-5xl p-0 overflow-hidden">
          <SectionHeader
            title="Software Authority Groups"
            description={`${groups.length} defined security groups`}
            icon={<MdViewModule className="h-6 w-6 text-teal-600" />}
            action={
              <div className="p-4">
                <button
                  type="button"
                  onClick={fetchGroups}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  <MdRefresh className="inline mr-1" /> Refresh
                </button>
              </div>
            }
          />

          {loading ? (
            <TableState message="Loading software groups..." />
          ) : groups.length === 0 ? (
            <TableState message="No software groups found." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Ref Code</th>
                    <th className="px-6 py-4">Group Name</th>
                    <th className="px-6 py-4">Statistics</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {groups.map((group) => (
                    <motion.tr
                      key={group.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`group transition-colors hover:bg-teal-50/30 ${editId === group.id ? "bg-teal-50/50" : ""}`}
                    >
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                        #GRP-{String(group.id).padStart(3, "0")}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800">
                          {group.group_name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                            {group.users?.length || 0} assigned users
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionButton
                            label="Edit"
                            tone="teal"
                            onClick={() => handleEdit(group)}
                          />
                          <ActionButton
                            label="Delete"
                            tone="rose"
                            onClick={() => handleDelete(group)}
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
