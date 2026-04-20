import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../services/axiosInstance";
import {
  MdSave,
  MdSearch,
  MdClose,
  MdPeople,
  MdSecurity,
  MdViewModule,
  MdCheck,
  MdDelete,
  MdRefresh,
  MdShield,
  MdHistory,
  MdExpandMore,
  MdExpandLess,
} from "react-icons/md";

// ─── Shared Components ────────────────────────────────────────────────────────
function TabButton({ active, onClick, children, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 text-[14px] font-bold transition-all border-b-2 ${
        active
          ? "text-teal-600 border-teal-600 bg-teal-50/30"
          : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50/50"
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

const ACTION_COLORS = {
  CREATE: "bg-emerald-100 text-emerald-700",
  READ:   "bg-blue-100   text-blue-700",
  UPDATE: "bg-amber-100  text-amber-700",
  DELETE: "bg-rose-100   text-rose-700",
  PRINT:  "bg-purple-100 text-purple-700",
  USE:    "bg-teal-100   text-teal-700",
};

function ActionBadge({ action }) {
  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 ${ACTION_COLORS[action] || "bg-slate-100 text-slate-600"}`}>
      {action}
    </span>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// GROUPS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function GroupsTab({ groups, modules, functionalities, onRefresh }) {
  const [selectedGroup, setSelectedGroup]   = useState(null);
  const [assignedRightIds, setAssignedRightIds] = useState(new Set());
  const [assignedModuleIds, setAssignedModuleIds] = useState(new Set());
  const [saving, setSaving]                 = useState(false);
  const [searchAvailable, setSearchAvailable] = useState("");
  const [searchAssigned, setSearchAssigned]   = useState("");
  const [expandedAvailable, setExpandedAvailable] = useState(new Set());
  const [expandedAssigned, setExpandedAssigned]   = useState(new Set());

  function toggleExpand(setFn, moduleId) {
    setFn(prev => {
      const next = new Set(prev);
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
      return next;
    });
  }

  function expandAll(setFn, tree) {
    setFn(new Set(tree.map(m => m.moduleId)));
  }

  function collapseAll(setFn) {
    setFn(new Set());
  }

  useEffect(() => {
    if (!selectedGroup) return;
    loadGroupRights(selectedGroup.id);
  }, [selectedGroup]);

  async function loadGroupRights(groupId) {
    try {
      const res = await axiosInstance.get(`/add-rights?groupId=${groupId}`);
      const data = Array.isArray(res.data) ? res.data : [];
      const funcIds = new Set();
      const modIds  = new Set();
      data.forEach(r => {
        const funcs = r.functionalities || [];
        // Only add module if it has at least one functionality assigned
        if (funcs.length > 0) {
          modIds.add(r.module_id);
          funcs.forEach(f => funcIds.add(f.id));
        }
      });
      setAssignedModuleIds(modIds);
      setAssignedRightIds(funcIds);
    } catch {
      setAssignedModuleIds(new Set());
      setAssignedRightIds(new Set());
    }
  }

  const tree = useMemo(() => {
    return modules.map(m => ({
      id:       `mod-${m.id}`,
      moduleId: m.id,
      label:    m.module_name,
      children: functionalities
        .filter(f => f.module_id === m.id)
        .map(f => ({
          id:          `func-${f.id}`,
          funcId:      f.id,
          moduleId:    m.id,
          label:       f.name,
          action:      f.slug?.toUpperCase() || inferAction(f.name),
        })),
    }));
  }, [modules, functionalities]);

  function inferAction(name) {
    const n = name.toUpperCase();
    if (n.includes("CREATE") || n.includes("ADD")) return "CREATE";
    if (n.includes("DELETE") || n.includes("REMOVE")) return "DELETE";
    if (n.includes("UPDATE") || n.includes("EDIT")) return "UPDATE";
    if (n.includes("READ") || n.includes("VIEW") || n.includes("GET")) return "READ";
    return null;
  }

  function toggleNode(node) {
    if (node.moduleId && !node.funcId) {
      // Toggling a module header
      const childFuncIds = (node.children || []).map(c => c.funcId).filter(Boolean);
      const allChecked   = childFuncIds.every(id => assignedRightIds.has(id));

      setAssignedModuleIds(prev => {
        const next = new Set(prev);
        allChecked ? next.delete(node.moduleId) : next.add(node.moduleId);
        return next;
      });
      setAssignedRightIds(prev => {
        const next = new Set(prev);
        if (allChecked) childFuncIds.forEach(id => next.delete(id));
        else            childFuncIds.forEach(id => next.add(id));
        return next;
      });
    } else if (node.funcId) {
      // Toggling a single functionality
      setAssignedRightIds(prev => {
        const next = new Set(prev);
        next.has(node.funcId) ? next.delete(node.funcId) : next.add(node.funcId);

        // Check if any sibling functionalities remain selected after this toggle
        const siblingFuncIds = tree
          .find(m => m.moduleId === node.moduleId)
          ?.children.map(c => c.funcId) || [];
        const anyRemaining = siblingFuncIds.some(id => next.has(id));

        // Add or remove parent module based on whether any children remain
        setAssignedModuleIds(prev2 => {
          const next2 = new Set(prev2);
          anyRemaining ? next2.add(node.moduleId) : next2.delete(node.moduleId);
          return next2;
        });

        return next;
      });
    }
  }

  // Only show modules in "Assigned" panel that have at least one selected functionality
  const assignedTree = useMemo(() => {
    return tree
      .map(m => ({
        ...m,
        children: m.children.filter(c => assignedRightIds.has(c.funcId)),
      }))
      .filter(m => m.children.length > 0);
  }, [tree, assignedRightIds]);

  const filteredAvailable = useMemo(() => {
    const q = searchAvailable.toLowerCase();
    return tree.map(m => ({
      ...m,
      children: m.children.filter(c => c.label.toLowerCase().includes(q) || m.label.toLowerCase().includes(q)),
    })).filter(m => m.children.length > 0 || m.label.toLowerCase().includes(q));
  }, [tree, searchAvailable]);

  const filteredAssigned = useMemo(() => {
    const q = searchAssigned.toLowerCase();
    return assignedTree.map(m => ({
      ...m,
      children: m.children.filter(c => c.label.toLowerCase().includes(q) || m.label.toLowerCase().includes(q)),
    })).filter(m => m.children.length > 0 || m.label.toLowerCase().includes(q));
  }, [assignedTree, searchAssigned]);

  async function handleSave() {
    if (!selectedGroup) return;
    setSaving(true);
    try {
      const byModule = {};
      assignedRightIds.forEach(funcId => {
        const f = functionalities.find(x => x.id === funcId);
        if (!f) return;
        if (!byModule[f.module_id]) byModule[f.module_id] = [];
        byModule[f.module_id].push(funcId);
      });
      assignedModuleIds.forEach(modId => {
        if (!byModule[modId]) byModule[modId] = [];
      });

      await axiosInstance.delete(`/add-rights/group/${selectedGroup.id}`);
      for (const [moduleId, funcIds] of Object.entries(byModule)) {
        await axiosInstance.post("/add-rights", {
          group:           selectedGroup.id,
          module:          Number(moduleId),
          functionalities: funcIds,
        });
      }
      toast.success(`Permissions updated for "${selectedGroup.group_name}"`);
      onRefresh();
    } catch (err) {
      toast.error("Failed to save permissions");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-280px)]">
      <div className="w-64 flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-[12px] font-bold text-slate-700 uppercase tracking-wide">Groups</span>
          <MdPeople className="text-slate-400" />
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => setSelectedGroup(g)}
              className={`w-full text-left px-4 py-3 transition-all border-l-4 ${
                selectedGroup?.id === g.id
                  ? "bg-teal-50 border-teal-500 text-teal-700"
                  : "border-transparent text-slate-600 hover:bg-slate-50"
              }`}
            >
              <p className="text-[14px] font-bold">{g.group_name}</p>
              <p className="text-[10px] opacity-60 uppercase tracking-widest mt-0.5">{g.group_name}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-[12px] font-bold text-slate-700 uppercase tracking-wide">Available Permissions</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => expandAll(setExpandedAvailable, filteredAvailable)}
              className="text-[10px] text-teal-600 hover:text-teal-700 font-bold hover:bg-teal-50 px-2 py-1 rounded transition"
              title="Expand All"
            >Expand All</button>
            <button
              onClick={() => collapseAll(setExpandedAvailable)}
              className="text-[10px] text-slate-500 hover:text-slate-700 font-bold hover:bg-slate-100 px-2 py-1 rounded transition"
              title="Collapse All"
            >Collapse</button>
            <div className="relative">
              <MdSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchAvailable}
                onChange={e => setSearchAvailable(e.target.value)}
                className="pl-7 pr-3 py-1 text-[11px] rounded-lg border border-slate-200 outline-none focus:border-teal-500 w-32 focus:w-48 transition-all"
              />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredAvailable.map(m => {
            const isExpanded = expandedAvailable.has(m.moduleId);
            const allChecked = m.children.length > 0 && m.children.every(c => assignedRightIds.has(c.funcId));
            const someChecked = m.children.some(c => assignedRightIds.has(c.funcId));
            return (
              <div key={m.id} className="rounded-lg border border-slate-100 overflow-hidden">
                {/* Module Header */}
                <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50/80 hover:bg-slate-100/80 transition-colors">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                    onChange={() => toggleNode(m)}
                    onClick={e => e.stopPropagation()}
                    className="rounded accent-teal-600 cursor-pointer"
                  />
                  <button
                    onClick={() => toggleExpand(setExpandedAvailable, m.moduleId)}
                    className="flex items-center gap-1.5 flex-1 min-w-0"
                  >
                    <MdViewModule className="text-teal-500 h-4 w-4 shrink-0" />
                    <span className="text-[12px] font-bold text-slate-800 truncate">{m.label}</span>
                    <span className="text-[9px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded-full ml-auto shrink-0">
                      {m.children.filter(c => assignedRightIds.has(c.funcId)).length}/{m.children.length}
                    </span>
                    {isExpanded
                      ? <MdExpandLess className="text-slate-400 h-5 w-5 shrink-0" />
                      : <MdExpandMore className="text-slate-400 h-5 w-5 shrink-0" />}
                  </button>
                </div>

                {/* Collapsible Functionalities */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="py-1 border-t border-slate-100">
                        {m.children.map(c => (
                          <div
                            key={c.id}
                            className="flex items-center gap-2 pl-9 pr-3 py-1.5 hover:bg-teal-50/50 cursor-pointer transition-colors"
                            onClick={() => toggleNode(c)}
                          >
                            <input
                              type="checkbox"
                              checked={assignedRightIds.has(c.funcId)}
                              onChange={() => toggleNode(c)}
                              onClick={e => e.stopPropagation()}
                              className="rounded accent-teal-600 cursor-pointer"
                            />
                            <span className="text-[11px] text-slate-600 flex-1">{c.label}</span>
                            {c.action && <ActionBadge action={c.action} />}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-[12px] font-bold text-teal-700 uppercase tracking-wide">Assigned to Group</span>
          <button
            onClick={handleSave}
            disabled={saving || !selectedGroup}
            className="flex items-center gap-2 px-3 py-1 bg-teal-600 text-white rounded-lg text-[11px] font-bold hover:bg-teal-700 transition disabled:opacity-50"
          >
            <MdSave className="h-3 w-3" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
        <div className="px-4 py-2 border-b border-slate-50">
          <div className="relative">
            <MdSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search assigned..."
              value={searchAssigned}
              onChange={e => setSearchAssigned(e.target.value)}
              className="w-full h-8 pl-7 pr-3 py-1 text-[11px] rounded-lg border border-slate-200 outline-none focus:border-teal-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredAssigned.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
              <MdShield className="h-10 w-10 mb-2" />
              <p className="text-[12px]">No permissions assigned</p>
            </div>
          ) : (
            filteredAssigned.map(m => {
              const isExpanded = expandedAssigned.has(m.moduleId);
              return (
                <div key={m.id} className="rounded-lg border border-teal-100 overflow-hidden">
                  <button
                    onClick={() => toggleExpand(setExpandedAssigned, m.moduleId)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 bg-teal-50/50 hover:bg-teal-50 transition-colors"
                  >
                    <MdCheck className="text-teal-500 h-4 w-4 shrink-0" />
                    <span className="text-[11px] font-bold text-teal-800 flex-1 text-left truncate">{m.label}</span>
                    <span className="text-[9px] bg-teal-200 text-teal-800 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                      {m.children.length}
                    </span>
                    {isExpanded
                      ? <MdExpandLess className="text-teal-400 h-5 w-5 shrink-0" />
                      : <MdExpandMore className="text-teal-400 h-5 w-5 shrink-0" />}
                  </button>
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="py-1 border-t border-teal-100">
                          {m.children.map(c => (
                            <div key={c.id} className="flex items-center gap-2 pl-9 pr-3 py-1.5">
                              <MdCheck className="text-emerald-400 h-3 w-3 shrink-0" />
                              <span className="text-[11px] text-slate-600 flex-1">{c.label}</span>
                              {c.action && <ActionBadge action={c.action} />}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// USERS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function UsersTab({ groups, allUsers, onRefresh }) {
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [saving, setSaving]                   = useState(false);
  const [search, setSearch]                   = useState("");

  const selectedGroup = groups.find(g => String(g.id) === String(selectedGroupId));
  
  function handleGroupChange(id) {
    setSelectedGroupId(id);
    const g = groups.find(x => String(x.id) === String(id));
    setSelectedUserIds((g?.users || []).map(u => String(u.id)));
  }

  function toggleUser(uid) {
    const id = String(uid);
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    // Deduplicate users by ID (in case backend returns duplicates due to group joins)
    const uniqueUsers = Array.from(new Map(allUsers.map(u => [u.id, u])).values());
    
    return uniqueUsers.filter(u =>
      !q || (u.username || u.name)?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }, [allUsers, search]);

  async function handleSave() {
    if (!selectedGroupId) { toast.error("Select a group first"); return; }
    setSaving(true);
    try {
      await axiosInstance.put(`/group-users/${selectedGroupId}/users`, {
        userIds: selectedUserIds.map(Number),
      });
      toast.success("Group members updated");
      onRefresh();
    } catch (err) {
      toast.error("Failed to update group members");
    } finally {
      setSaving(false);
    }
  }

  const allAssignments = useMemo(() =>
    groups.flatMap(g =>
      (g.users || []).map(u => ({ groupId: g.id, groupName: g.group_name, userId: u.id, username: u.username || u.name, email: u.email }))
    ),
    [groups]
  );

  async function removeAssignment(groupId, userId) {
    if (!window.confirm("Remove this user from the group?")) return;
    try {
      await axiosInstance.delete(`/group-users/${groupId}/user/${userId}`);
      toast.success("User removed");
      onRefresh();
    } catch (err) {
      toast.error("Failed to remove user");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[600px]">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[15px] font-black text-slate-800 uppercase tracking-tight">Assign Users</h3>
            <p className="text-[12px] text-slate-500">Add or remove users from the selected group.</p>
          </div>
          <div className="p-4 border-b border-slate-50 space-y-4">
            <div className="flex gap-3">
              <select
                value={selectedGroupId}
                onChange={e => handleGroupChange(e.target.value)}
                className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-[13px] outline-none focus:border-teal-500 transition-all bg-white"
              >
                <option value="">— Select a Group —</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.group_name} ({(g.users || []).length} users)</option>
                ))}
              </select>
              <button
                onClick={handleSave}
                disabled={!selectedGroupId || saving}
                className="px-4 py-2 bg-teal-600 text-white rounded-xl text-[13px] font-bold hover:bg-teal-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <MdSave className="h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-[13px] rounded-xl border border-slate-200 outline-none focus:border-teal-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {filtered.map(user => {
              const uid = String(user.id);
              const checked = selectedUserIds.includes(uid);
              return (
                <label key={user.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${checked ? 'bg-teal-50 border border-teal-100' : 'hover:bg-slate-50 border border-transparent'}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleUser(uid)}
                    className="h-4 w-4 rounded accent-teal-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 truncate">{user.username || user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email || 'No email'}</p>
                  </div>
                  <ActionBadge action={user.role === 'admin' ? 'ADMIN' : 'USER'} />
                </label>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[600px]">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[15px] font-black text-slate-800 uppercase tracking-tight">Active Assignments</h3>
            <p className="text-[12px] text-slate-500">Current group memberships across the system.</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr className="text-[11px] font-bold uppercase text-slate-400 border-b border-slate-100">
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Group</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allAssignments.map(a => (
                  <tr key={`${a.groupId}-${a.userId}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <p className="text-[13px] font-bold text-slate-700">{a.username}</p>
                      <p className="text-[10px] text-slate-400">{a.email}</p>
                    </td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-black uppercase">
                        {a.groupName}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => removeAssignment(a.groupId, a.userId)}
                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <MdDelete className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERMISSIONS CATALOG TAB
// ═══════════════════════════════════════════════════════════════════════════════
function PermissionsTab({ modules, functionalities }) {
  const [search, setSearch] = useState("");
  const [expandedModules, setExpandedModules] = useState(new Set());

  const grouped = useMemo(() => {
    const q = search.toLowerCase();
    return modules.map(m => ({
      ...m,
      funcs: functionalities.filter(f =>
        f.module_id === m.id &&
        (!q || f.name.toLowerCase().includes(q) || m.module_name.toLowerCase().includes(q))
      ),
    })).filter(m => m.funcs.length > 0 || !q);
  }, [modules, functionalities, search]);

  function inferAction(name) {
    const n = name.toUpperCase();
    if (n.includes("CREATE") || n.includes("ADD")) return "CREATE";
    if (n.includes("DELETE") || n.includes("REMOVE")) return "DELETE";
    if (n.includes("UPDATE") || n.includes("EDIT")) return "UPDATE";
    if (n.includes("READ") || n.includes("VIEW") || n.includes("GET")) return "READ";
    return null;
  }

  function toggleModule(moduleId) {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
      return next;
    });
  }

  function expandAll() {
    setExpandedModules(new Set(grouped.map(m => m.id)));
  }

  function collapseAll() {
    setExpandedModules(new Set());
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm w-full">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search permission keys..."
            className="w-full h-11 pl-10 pr-4 text-[14px] rounded-xl border border-slate-300 bg-white outline-none focus:border-teal-500 shadow-sm transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={expandAll}
            className="text-[11px] text-teal-600 hover:text-teal-700 font-bold hover:bg-teal-50 px-3 py-1.5 rounded-lg transition"
          >Expand All</button>
          <button
            onClick={collapseAll}
            className="text-[11px] text-slate-500 hover:text-slate-700 font-bold hover:bg-slate-100 px-3 py-1.5 rounded-lg transition"
          >Collapse All</button>
          <div className="bg-teal-50 text-teal-700 px-4 py-2 rounded-xl text-[13px] font-bold">
            {functionalities.length} total permissions
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {grouped.map(m => {
          const isExpanded = expandedModules.has(m.id);
          return (
            <div key={m.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <button
                onClick={() => toggleModule(m.id)}
                className="w-full px-5 py-3.5 flex items-center justify-between bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MdViewModule className="text-teal-500 h-5 w-5" />
                  <span className="text-[13px] font-black text-slate-800 uppercase tracking-tight">{m.module_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-teal-100 text-teal-700 font-bold px-2 py-0.5 rounded-full">{m.funcs.length} PERMS</span>
                  {isExpanded
                    ? <MdExpandLess className="text-slate-400 h-5 w-5" />
                    : <MdExpandMore className="text-slate-400 h-5 w-5" />}
                </div>
              </button>
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 space-y-2 border-t border-slate-100">
                      {m.funcs.map(f => {
                        const action = f.slug?.toUpperCase() || inferAction(f.name);
                        return (
                          <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                            <span className="text-[11px] font-bold text-slate-700 flex-1 truncate">
                              {m.module_name.toUpperCase()}.{f.name.split(" ").slice(-1)[0].toUpperCase()}
                            </span>
                            {action && <ActionBadge action={action} />}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// IP TRACKING TAB
// ═══════════════════════════════════════════════════════════════════════════════
function IPTrackingTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchLogs(); }, []);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/security-logs/login-history");
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error("Failed to fetch login history");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[16px] font-bold text-slate-800">Login History & IP Tracking</h3>
        <button onClick={fetchLogs} className="text-teal-600 hover:text-teal-700 p-2 rounded-full hover:bg-teal-50 transition">
          <MdRefresh className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">IP Address</th>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-400">No logs found</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${log.action === 'LOGIN_SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {log.action === 'LOGIN_SUCCESS' ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[13px] font-semibold text-slate-700">{log.username || "System"}</td>
                  <td className="px-6 py-4 text-[13px] font-mono text-slate-500">{log.ip_address || "Unknown"}</td>
                  <td className="px-6 py-4 text-[13px] text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 text-[12px] text-slate-400 italic">{log.details || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ACCESS CONTROL PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function AccessControl() {
  const [tab, setTab]                 = useState("groups");
  const [groups, setGroups]           = useState([]);
  const [allUsers, setAllUsers]       = useState([]);
  const [modules, setModules]         = useState([]);
  const [functionalities, setFunctionalities] = useState([]);
  const [loading, setLoading]         = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [groupsRes, usersRes, modulesRes, funcsRes] = await Promise.all([
        axiosInstance.get("/group-users"),
        axiosInstance.get("/auth/users").catch(() => axiosInstance.get("/company-users")),
        axiosInstance.get("/modules"),
        axiosInstance.get("/functionalities"),
      ]);

      setGroups(Array.isArray(groupsRes.data) ? groupsRes.data : []);
      const ud = usersRes.data;
      setAllUsers(Array.isArray(ud) ? ud : ud?.data || []);
      setModules(Array.isArray(modulesRes.data) ? modulesRes.data : []);
      setFunctionalities(Array.isArray(funcsRes.data) ? funcsRes.data : []);
    } catch (err) {
      toast.error("Failed to load access control data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-[28px] font-black text-slate-800 tracking-tight">Access Control</h1>
        <p className="text-[14px] text-slate-500">Manage groups, permissions, user assignments, and system-wide toggles.</p>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-200 bg-slate-50/30">
          <TabButton active={tab === "groups"} onClick={() => setTab("groups")} icon={MdSecurity}>Groups</TabButton>
          <TabButton active={tab === "users"} onClick={() => setTab("users")} icon={MdPeople}>Users</TabButton>
          <TabButton active={tab === "permissions"} onClick={() => setTab("permissions")} icon={MdViewModule}>Permissions</TabButton>
          <TabButton active={tab === "tracking"} onClick={() => setTab("tracking")} icon={MdHistory}>IP Tracking</TabButton>
        </div>

        <div className="p-6 min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {tab === "groups" && (
                <GroupsTab
                  groups={groups}
                  modules={modules}
                  functionalities={functionalities}
                  onRefresh={fetchAll}
                />
              )}
              {tab === "users" && (
                <UsersTab
                  groups={groups}
                  allUsers={allUsers}
                  onRefresh={fetchAll}
                />
              )}
              {tab === "permissions" && (
                <PermissionsTab modules={modules} functionalities={functionalities} />
              )}
              {tab === "tracking" && <IPTrackingTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}