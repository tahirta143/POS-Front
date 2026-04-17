import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Card,
  SectionHeader,
  Field,
  TableState,
  ActionButton,
} from "../../components/layout/PageShell.jsx";
import { MdArrowBack, MdVpnKey, MdRefresh } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";

export default function UserModule() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [modules, setModules] = useState([]);
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ userId: "", moduleId: "" });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [uRes, mRes, gRes] = await Promise.all([
        axiosInstance
          .get("/company-users")
          .catch(() => axiosInstance.get("/users")),
        axiosInstance.get("/modules"),
        axiosInstance.get("/user-module-access").catch(() => ({ data: [] })),
      ]);
      setUsers(Array.isArray(uRes.data) ? uRes.data : uRes.data?.data || []);
      setModules(Array.isArray(mRes.data) ? mRes.data : mRes.data?.data || []);
      setGrants(Array.isArray(gRes.data) ? gRes.data : gRes.data?.data || []);
    } catch (err) {
      toast.error("Failed to load access data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGrant(e) {
    e.preventDefault();
    if (!form.userId || !form.moduleId)
      return toast.error("Select both user and module.");
    setSubmitting(true);
    try {
      await axiosInstance.post("/user-module-access", form);
      toast.success("Access granted successfully.");
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to grant access.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(id) {
    if (!window.confirm("Revoke this access grant?")) return;
    try {
      await axiosInstance.delete(`/user-module-access/${id}`);
      toast.success("Access revoked.");
      fetchData();
    } catch (err) {
      toast.error("Failed to revoke access.");
    }
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <button
        onClick={() => navigate("/security")}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-teal-300 bg-teal-50 px-3 py-1.5 text-[11px] font-semibold text-teal-700 hover:bg-teal-100 transition"
      >
        <MdArrowBack /> Back to Overview
      </button>
      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <SectionHeader
          title="User Module Access"
          description="Grant direct module access to individual system users."
          icon={<MdVpnKey className="text-teal-600 text-3xl" />}
        />
        <form
          onSubmit={handleGrant}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
        >
          <Field label="Access ID">
            <input
              type="text"
              className="h-8 w-full rounded-md border border-slate-100 bg-slate-50 px-2.5 text-[12px] font-mono text-slate-500"
              value="Auto-generated"
              disabled
            />
          </Field>
          <Field label="Module Dropdown">
            <select
              value={form.moduleId}
              onChange={(e) => setForm({ ...form, moduleId: e.target.value })}
              className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              <option value="">Select Module</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.module_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="User Dropdown">
            <select
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              <option value="">Select User</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.username}
                </option>
              ))}
            </select>
          </Field>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-teal-700 transition h-[38px]"
          >
            Grant Access
          </button>
        </form>
      </Card>

      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-slate-700">
            Active Access Grants
          </h3>
          <button
            onClick={fetchData}
            className="text-teal-600 hover:text-teal-700 transition"
          >
            <MdRefresh className="text-xl" />
          </button>
        </div>

        {loading ? (
          <TableState message="Loading access permissions..." />
        ) : grants.length === 0 ? (
          <TableState message="No active access grants found." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Access ID</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Module</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {grants.map((grant) => (
                  <tr
                    key={grant.id}
                    className="hover:bg-slate-50/50 transition"
                  >
                    <td className="px-6 py-3 font-mono text-xs">
                      #ACC-{String(grant.id).padStart(3, "0")}
                    </td>
                    <td className="px-6 py-3 font-semibold">
                      {grant.user_name}
                    </td>
                    <td className="px-6 py-3">{grant.module_name}</td>
                    <td className="px-6 py-3 text-right">
                      <ActionButton
                        tone="rose"
                        label="Delete"
                        onClick={() => handleRevoke(grant.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
