import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Card,
  SectionHeader,
  TableState,
  ActionButton,
} from "../../components/layout/PageShell.jsx";
import { MdArrowBack, MdHistory, MdRefresh } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";

export default function SecurityLogPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [logsRes] = await Promise.all([
        axiosInstance.get("/security-logs").catch((err) => {
          console.error("Security Logs API missing or failing:", err);
          return { data: [] };
        }),
      ]);

      const logData = logsRes.data;
      setLogs(Array.isArray(logData) ? logData : logData?.data || []);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to load security logs.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this log entry?")) return;
    try {
      await axiosInstance.delete(`/security-logs/${id}`);
      toast.success("Log entry removed.");
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete log.");
    }
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4">
      <button
        onClick={() => navigate("/security")}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-teal-300 bg-teal-50 px-3 py-1.5 text-[11px] font-semibold text-teal-700 hover:bg-teal-100 transition"
      >
        <MdArrowBack /> Back to Overview
      </button>

      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <SectionHeader
          title="System Audit Trail"
          description="Automatically captured system activities and access logs"
          icon={<MdHistory className="text-teal-600 text-3xl" />}
        />
      </Card>

      {/* DATA TABLE */}
      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-slate-700">
            Security Log History
          </h3>
          <button
            onClick={fetchData}
            className="text-teal-600 hover:text-teal-700 transition"
          >
            <MdRefresh className="text-xl" />
          </button>
        </div>

        {loading ? (
          <TableState message="Fetching system logs..." />
        ) : logs.length === 0 ? (
          <TableState message="No security logs recorded yet." />
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Log ID</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Activity Time</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">IP Address</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-3 font-mono text-[11px]">
                      #LOG-{String(log.id).padStart(5, "0")}
                    </td>
                    <td className="px-6 py-3 font-semibold">
                      {log.user_name || `User #${log.user_id}`}
                    </td>
                    <td className="px-6 py-3 text-[11px]">
                      {new Date(
                        log.created_at || log.activity_time,
                      ).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-[12px]">{log.description}</td>
                    <td className="px-6 py-3 font-mono text-[11px] text-slate-500">
                      {log.ip_address || "—"}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <ActionButton
                        tone="rose"
                        label="Delete"
                        onClick={() => handleDelete(log.id)}
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
