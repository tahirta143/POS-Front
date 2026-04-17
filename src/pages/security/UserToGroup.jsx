import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdAppRegistration,
  MdArrowBack,
  MdSave,
  MdGroup,
  MdPerson,
} from "react-icons/md";
import axiosInstance from "../../services/axiosInstance";
import {
  ActionButton,
  Card,
  Field,
  SectionHeader,
  TableState,
} from "../../components/layout/PageShell.jsx";

export default function UserToGroup() {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]); // multi-select
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);

  useEffect(() => {
    fetchPageData();
  }, []);

  async function fetchPageData() {
    setLoading(true);
    try {
      const [groupsRes, usersRes] = await Promise.all([
        axiosInstance.get("/groups"), // returns groups with their users[]
        axiosInstance
          .get("/company-users")
          .catch(() => axiosInstance.get("/users")),
      ]);
      setGroups(Array.isArray(groupsRes.data) ? groupsRes.data : []);
      const ud = usersRes.data;
      setUsers(Array.isArray(ud) ? ud : ud?.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  // When a group is selected, pre-tick its current members
  const selectedGroup = useMemo(
    () => groups.find((g) => String(g.id) === String(selectedGroupId)),
    [groups, selectedGroupId],
  );

  function handleGroupChange(id) {
    setSelectedGroupId(id);
    const grp = groups.find((g) => String(g.id) === String(id));
    setSelectedUserIds((grp?.users || []).map((u) => String(u.id)));
  }

  function toggleUser(userId) {
    const id = String(userId);
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleAll() {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map((u) => String(u.id)));
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!selectedGroupId) {
      toast.error("Please select a group.");
      return;
    }

    setSubmitting(true);
    try {
      // Update group members via the /groups endpoint
      await axiosInstance.put(`/groups/${selectedGroupId}`, {
        group_name: selectedGroup?.group_name,
        users: selectedUserIds.map(Number),
      });
      toast.success("Group members updated successfully.");
      fetchPageData();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to update group members.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function removeUser(groupId, userId, userName) {
    if (!window.confirm(`Remove ${userName} from this group?`)) return;
    try {
      // Recalculate members list and update via PUT /groups/:id
      const targetGroup = groups.find((g) => String(g.id) === String(groupId));
      const remainingUserIds = (targetGroup?.users || [])
        .filter((u) => String(u.id) !== String(userId))
        .map((u) => u.id);

      await axiosInstance.put(`/groups/${groupId}`, {
        group_name: targetGroup?.group_name,
        users: remainingUserIds,
      });

      toast.success(`${userName} removed.`);
      fetchPageData();
      // Update local selection if this group is open
      if (String(groupId) === String(selectedGroupId)) {
        setSelectedUserIds((prev) =>
          prev.filter((id) => String(id) !== String(userId)),
        );
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove user.");
    }
  }

  // Users not yet in the selected group (for the "not assigned" count)
  const currentMemberIds = useMemo(
    () => new Set((selectedGroup?.users || []).map((u) => String(u.id))),
    [selectedGroup],
  );

  const allAssignments = useMemo(
    () =>
      groups.flatMap((g) =>
        (g.users || []).map((u) => ({
          groupId: g.id,
          groupName: g.group_name,
          userId: u.id,
          userName: u.name || u.username || u.email || `User #${u.id}`,
          email: u.email,
        })),
      ),
    [groups],
  );

  return (
    <div className="space-y-5 animate-in slide-in-from-right-4">
      {/* Back */}
      <button
        onClick={() => navigate("/security")}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-teal-300 bg-teal-50 px-3 py-1.5 text-[11px] font-semibold text-teal-700 hover:bg-teal-100 transition"
      >
        <MdArrowBack /> Back to Overview
      </button>

      {/* Assignment Form */}
      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <SectionHeader
          title="Assign Users to Group"
          description="Select a group and tick all users who should belong to it."
          icon={<MdAppRegistration className="text-teal-600 text-2xl" />}
        />

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          {/* Group selector */}
          <Field label="Select Group" required>
            <select
              value={selectedGroupId}
              onChange={(e) => handleGroupChange(e.target.value)}
              className="h-9 w-full max-w-sm rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              required
            >
              <option value="">Choose a group...</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.group_name} ({(g.users || []).length} member
                  {(g.users || []).length !== 1 ? "s" : ""})
                </option>
              ))}
            </select>
          </Field>

          {/* User multi-select checkboxes */}
          {selectedGroupId && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  Select Members
                  <span className="ml-2 font-normal text-slate-400 normal-case tracking-normal">
                    ({selectedUserIds.length} of {users.length} selected)
                  </span>
                </label>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 transition"
                >
                  {selectedUserIds.length === users.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden max-h-64 overflow-y-auto">
                {users.length === 0 ? (
                  <div className="py-6 text-center text-[12px] text-slate-400">
                    No users found.
                  </div>
                ) : (
                  users.map((user, idx) => {
                    const uid = String(user.id);
                    const checked = selectedUserIds.includes(uid);
                    const wasIn = currentMemberIds.has(uid);
                    return (
                      <label
                        key={user.id}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-b last:border-0 ${
                          checked
                            ? "bg-teal-50/60"
                            : "bg-white hover:bg-slate-50/60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleUser(uid)}
                          className="h-4 w-4 rounded border-slate-300 text-teal-600 accent-teal-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-slate-800 truncate">
                            {user.name || user.username || `User #${user.id}`}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {user.email || "—"}
                          </p>
                        </div>
                        {wasIn && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full shrink-0">
                            Current
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => {
                setSelectedGroupId("");
                setSelectedUserIds([]);
              }}
              className="px-6 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedGroupId}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2 text-sm font-bold text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition disabled:opacity-50"
            >
              <MdSave />
              {submitting ? "Saving..." : "Save Group Members"}
            </button>
          </div>
        </form>
      </Card>

      {/* All Assignments Table */}
      <Card className="border-l-[6px] border-l-teal-500 p-0 overflow-hidden">
        <SectionHeader
          title="Current Group Assignments"
          description={`${allAssignments.length} user–group assignment${allAssignments.length !== 1 ? "s" : ""}`}
          icon={<MdGroup className="text-teal-600 text-xl" />}
          action={
            <div className="p-4">
              <button
                type="button"
                onClick={fetchPageData}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Refresh
              </button>
            </div>
          }
        />

        {loading ? (
          <TableState message="Loading assignments..." />
        ) : allAssignments.length === 0 ? (
          <TableState message="No assignments yet. Select a group above and save members." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Group</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {allAssignments.map((a, idx) => (
                  <tr
                    key={`${a.groupId}-${a.userId}`}
                    className="hover:bg-teal-50/20 transition-colors"
                  >
                    <td className="px-5 py-3 text-[11px] text-slate-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-teal-700">
                        <MdGroup className="text-xs" />
                        {a.groupName}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-700 text-[12px]">
                      <span className="inline-flex items-center gap-1.5">
                        <MdPerson className="text-slate-400 text-sm" />
                        {a.userName}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[11px] text-slate-400">
                      {a.email || "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <ActionButton
                        label="Delete"
                        tone="rose"
                        onClick={() =>
                          removeUser(a.groupId, a.userId, a.userName)
                        }
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
