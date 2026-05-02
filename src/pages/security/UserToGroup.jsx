import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPageData();
  }, []);

  async function fetchPageData() {
    setLoading(true);
    try {
      // Note: Make sure /groups includes the users array in the response
      const [groupsRes, usersRes] = await Promise.all([
        axiosInstance.get("/group-users"), // Use the group-users base route to get enriched data
        axiosInstance.get("/auth/users"),
      ]);
      setGroups(Array.isArray(groupsRes.data) ? groupsRes.data : []);
      const ud = usersRes.data.data;
      setUsers(Array.isArray(ud) ? ud : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  const selectedGroup = useMemo(
    () => groups.find((g) => String(g.id) === String(selectedGroupId)),
    [groups, selectedGroupId],
  );

  function handleGroupChange(id) {
    setSelectedGroupId(id);
    const grp = groups.find((g) => String(g.id) === String(id));
    // Reset selection to currently assigned members from the DB
    if (grp) {
      setSelectedUserIds((grp.users || []).map((u) => String(u.id)));
    } else {
      setSelectedUserIds([]);
    }
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
      // MATCHES BACKEND: router.put("/:groupId/users", setGroupUsers);
      // Note: We use /group-users as the base because of your main router config
      await axiosInstance.put(`/group-users/${selectedGroupId}/users`, {
        userIds: selectedUserIds.map(Number),
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
      // MATCHES BACKEND: router.delete("/:groupId/user/:userId", removeUserFromGroup);
      await axiosInstance.delete(`/group-users/${groupId}/user/${userId}`);

      toast.success(`${userName} removed.`);
      fetchPageData();

      // Update local checkbox state if the group being edited is the one we just removed from
      if (String(groupId) === String(selectedGroupId)) {
        setSelectedUserIds((prev) =>
          prev.filter((id) => String(id) !== String(userId)),
        );
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove user.");
    }
  }

  // Pre-calculate assignments for the table view
  const allAssignments = useMemo(() => {
    return groups.flatMap((g) =>
      (g.users || []).map((u) => ({
        groupId: g.id,
        groupName: g.group_name,
        userId: u.id,
        userName: u.name || u.username || u.email || `User #${u.id}`,
        email: u.email,
      })),
    );
  }, [groups]);

  const currentMemberIds = useMemo(
    () => new Set((selectedGroup?.users || []).map((u) => String(u.id))),
    [selectedGroup],
  );

  return (
    <div className="space-y-5 animate-in slide-in-from-right-4">
      <button
        onClick={() => navigate("/security")}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-teal-300 bg-teal-50 px-3 py-1.5 text-[11px] font-semibold text-teal-700 hover:bg-teal-100 transition"
      >
        <MdArrowBack /> Back to Overview
      </button>

      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <SectionHeader
          title="Assign Users to Group"
          description="Select a group and tick all users who should belong to it."
          icon={<MdAppRegistration className="text-teal-600 text-2xl" />}
        />

        <form onSubmit={handleSave} className="mt-6 space-y-5">
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
                  {g.group_name} ({(g.users || []).length} members)
                </option>
              ))}
            </select>
          </Field>

          {selectedGroupId && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold uppercase text-slate-600">
                  Select Members ({selectedUserIds.length} of {users.length})
                </label>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-[11px] font-semibold text-teal-600"
                >
                  {selectedUserIds.length === users.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden max-h-64 overflow-y-auto">
                {users.map((user) => {
                  const uid = String(user.id);
                  const checked = selectedUserIds.includes(uid);
                  const wasIn = currentMemberIds.has(uid);
                  return (
                    <label
                      key={user.id}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b last:border-0 ${
                        checked
                          ? "bg-teal-50/60"
                          : "bg-white hover:bg-slate-50/60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleUser(uid)}
                        className="h-4 w-4 rounded border-slate-300 text-teal-600"
                      />
                      <div className="flex-1">
                        <p className="text-[12px] font-semibold text-slate-800">
                          {user.name || user.username}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {user.email}
                        </p>
                      </div>
                      {wasIn && (
                        <span className="text-[9px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </motion.div>
          )}

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="submit"
              disabled={submitting || !selectedGroupId}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2 text-sm font-bold text-white shadow-lg disabled:opacity-50"
            >
              <MdSave />
              {submitting ? "Saving..." : "Save Group Members"}
            </button>
          </div>
        </form>
      </Card>

      <Card className="border-l-[6px] border-l-teal-500 p-0 overflow-hidden">
        <SectionHeader
          title="Current Group Assignments"
          description={`${allAssignments.length} total assignments`}
          icon={<MdGroup className="text-teal-600 text-xl" />}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 text-[10px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Group</th>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-[12px]">
              {allAssignments.map((a) => (
                <tr
                  key={`${a.groupId}-${a.userId}`}
                  className="hover:bg-teal-50/20"
                >
                  <td className="px-5 py-3">
                    <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-bold">
                      {a.groupName}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-slate-700">
                    {a.userName}
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
      </Card>
    </div>
  );
}
