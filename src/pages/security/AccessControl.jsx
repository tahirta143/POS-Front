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
  MdFolder,
  MdFolderOpen,
  MdPerson,
  MdPayment,
  MdReceipt,
  MdLocalShipping,
  MdAccountBalance,
  MdSettings,
  MdDashboard,
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

// Get icon for parent category
function getCategoryIcon(categoryName) {
  const name = categoryName.toLowerCase();
  if (name.includes("customer")) return <MdPerson className="h-4 w-4 text-emerald-600" />;
  if (name.includes("supplier") || name.includes("vendor")) return <MdLocalShipping className="h-4 w-4 text-blue-600" />;
  if (name.includes("security") || name.includes("access")) return <MdSecurity className="h-4 w-4 text-purple-600" />;
  if (name.includes("finance") || name.includes("billing")) return <MdPayment className="h-4 w-4 text-amber-600" />;
  if (name.includes("clinical") || name.includes("patient")) return <MdAccountBalance className="h-4 w-4 text-rose-600" />;
  if (name.includes("dashboard")) return <MdDashboard className="h-4 w-4 text-teal-600" />;
  return <MdFolder className="h-4 w-4 text-slate-500" />;
}

// Get icon for child module
function getModuleIcon(moduleName) {
  const name = moduleName.toLowerCase();
  if (name === "customer") return <MdPerson className="h-3.5 w-3.5" />;
  if (name.includes("payment")) return <MdPayment className="h-3.5 w-3.5" />;
  if (name.includes("ledger")) return <MdReceipt className="h-3.5 w-3.5" />;
  if (name === "supplier") return <MdLocalShipping className="h-3.5 w-3.5" />;
  if (name === "groups") return <MdPeople className="h-3.5 w-3.5" />;
  if (name === "users") return <MdPeople className="h-3.5 w-3.5" />;
  if (name === "modules") return <MdViewModule className="h-3.5 w-3.5" />;
  if (name.includes("permission")) return <MdSecurity className="h-3.5 w-3.5" />;
  return <MdFolder className="h-3.5 w-3.5" />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GROUPS TAB - with Hierarchical Tree Structure (Parent Categories → Child Modules)
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
  const [groupModal, setGroupModal] = useState(null); // null | 'add' | 'edit'
const [editingGroup, setEditingGroup] = useState(null);
const [groupNameInput, setGroupNameInput] = useState('');
const [groupSubmitting, setGroupSubmitting] = useState(false);
const [expandedGroupActions, setExpandedGroupActions] = useState(null);

  function toggleExpand(setFn, id) {
    setFn(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function expandAll(setFn, treeData) {
    setFn(new Set(treeData.map(item => item.id)));
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

  async function handleGroupSubmit() {
  if (!groupNameInput.trim()) { toast.error('Group name is required.'); return; }
  setGroupSubmitting(true);
  try {
    if (groupModal === 'edit' && editingGroup) {
      await axiosInstance.put(`/groups/${editingGroup.id}`, { group_name: groupNameInput.trim() });
      toast.success('Group updated successfully.');
    } else {
      await axiosInstance.post('/groups', { group_name: groupNameInput.trim() });
      toast.success('Group created successfully.');
    }
    setGroupModal(null);
    setGroupNameInput('');
    setEditingGroup(null);
    onRefresh();
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Failed to save group.');
  } finally {
    setGroupSubmitting(false);
  }
}

async function handleGroupDelete(group) {
  if (!window.confirm(`Delete "${group.group_name}"? This may affect assigned users.`)) return;
  try {
    await axiosInstance.delete(`/groups/${group.id}`);
    toast.success('Group deleted.');
    if (selectedGroup?.id === group.id) setSelectedGroup(null);
    setExpandedGroupActions(null);
    onRefresh();
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Failed to delete group.');
  }
}

  // Build hierarchical tree structure: Parent Categories → Child Modules → Functionalities
  const availableTree = useMemo(() => {
   
    const categoryStructure = {
      "Customer Management": {
        id: "cat-customer",
        icon: getCategoryIcon("customer"),
        description: "Manage customer data, payments, and account ledgers",
        modules: ["Customer", "Customer Payment", "Customer Ledger"]
      },
      "Supplier & Manufacturer Management": {
        id: "cat-supplier",
        icon: getCategoryIcon("supplier"),
        description: "Manage supplier information, payments, and amounts",
        modules: ["Supplier", "Supplier Payment", "Supplier Amount", "Supplier Ledger","Manufacturer"]
      },
      "Security & Access Control": {
        id: "cat-security",
        icon: getCategoryIcon("security"),
        description: "System security, user roles, and permission management",
        modules: ["Groups", "Users", "Modules", "Permissions", "Roles", "Audit Logs"]
      },
      "Billing & Finance": {
        id: "cat-billing",
        icon: getCategoryIcon("finance"),
        description: "Invoicing, payment processing, and financial transactions",
        modules: ["Invoice", "Payment", "Refund", "Settlement", "Tax Configuration"]
      },
      "Dashboard & Analytics": {
        id: "cat-dashboard",
        icon: getCategoryIcon("dashboard"),
        description: "System dashboards, reports, and analytics",
        modules: ["Dashboard", "Reports", "Analytics"]
      },
      "Setup": {
        id: "cat-emergency",
        icon: getCategoryIcon("emergency"),
        description: "Setup screens for various modules",
        modules: ["Items","Item Category","Sub Category", "Item Type", "Item Unit", "Shelve Location"]
      }
    };

    // Create a map of module_id to module object from API
    const moduleMap = new Map();
    modules.forEach(m => {
      moduleMap.set(m.id, {
        id: m.id,
        name: m.module_name,
        description: m.description || "",
        functionalities: [],
      });
    });

    // Group functionalities under their modules
    functionalities.forEach(f => {
      const module = moduleMap.get(f.module_id);
      if (module) {
        module.functionalities.push({
          id: f.id,
          funcId: f.id,
          name: f.name,
          slug: f.slug,
          action: f.slug?.toUpperCase() || inferAction(f.name),
        });
      }
    });

    // Build the tree structure
    const tree = [];
    
    Object.entries(categoryStructure).forEach(([categoryName, category]) => {
      const childModules = [];
      
      category.modules.forEach(moduleName => {
        // Find matching module from API data
        let matchingModule = null;
        for (const [_, mod] of moduleMap) {
          if (mod.name.toLowerCase() === moduleName.toLowerCase() ||
              mod.name.toLowerCase().includes(moduleName.toLowerCase())) {
            matchingModule = mod;
            break;
          }
        }
        
        if (matchingModule) {
          childModules.push({
            id: matchingModule.id,
            moduleId: matchingModule.id,
            name: matchingModule.name,
            description: matchingModule.description,
            icon: getModuleIcon(matchingModule.name),
            type: "module",
            functionalities: matchingModule.functionalities,
          });
        } else {
          // If module doesn't exist in DB, show as planned
          childModules.push({
            id: `planned-${moduleName.replace(/\s/g, '-')}`,
            moduleId: `planned-${moduleName.replace(/\s/g, '-')}`,
            name: moduleName,
            description: `${moduleName} module (coming soon)`,
            icon: getModuleIcon(moduleName),
            type: "module",
            isPlanned: true,
            functionalities: [],
          });
        }
      });
      
      // Only add category if it has at least one module (or always show for planned)
      if (childModules.length > 0) {
        tree.push({
          id: category.id,
          name: categoryName,
          description: category.description,
          icon: category.icon,
          type: "category",
          children: childModules,
        });
      }
    });

    // Add any standalone modules that don't fit into categories
    const assignedModuleNames = new Set();
    Object.values(categoryStructure).forEach(cat => {
      cat.modules.forEach(m => assignedModuleNames.add(m.toLowerCase()));
    });
    
    const standaloneModules = [];
    for (const [_, mod] of moduleMap) {
      if (!assignedModuleNames.has(mod.name.toLowerCase())) {
        standaloneModules.push({
          id: mod.id,
          moduleId: mod.id,
          name: mod.name,
          description: mod.description,
          icon: getModuleIcon(mod.name),
          type: "module",
          functionalities: mod.functionalities,
        });
      }
    }
    
    if (standaloneModules.length > 0) {
      tree.push({
        id: "cat-standalone",
        name: "Other Modules",
        description: "Standalone modules without parent category",
        icon: <MdFolder className="h-4 w-4 text-slate-500" />,
        type: "category",
        children: standaloneModules,
      });
    }
    
    return tree;
  }, [modules, functionalities]);

  function inferAction(name) {
    const n = name.toUpperCase();
    if (n.includes("CREATE") || n.includes("ADD")) return "CREATE";
    if (n.includes("DELETE") || n.includes("REMOVE")) return "DELETE";
    if (n.includes("UPDATE") || n.includes("EDIT")) return "UPDATE";
    if (n.includes("READ") || n.includes("VIEW") || n.includes("GET")) return "READ";
    if (n.includes("PRINT")) return "PRINT";
    if (n.includes("EXPORT")) return "READ";
    return null;
  }

  // Toggle entire module selection (select/deselect all functionalities under a module)
  function toggleModule(module) {
    const childFuncIds = module.functionalities.map(f => f.funcId).filter(Boolean);
    const allChecked = childFuncIds.length > 0 && childFuncIds.every(id => assignedRightIds.has(id));

    setAssignedModuleIds(prev => {
      const next = new Set(prev);
      allChecked ? next.delete(module.moduleId) : next.add(module.moduleId);
      return next;
    });
    
    setAssignedRightIds(prev => {
      const next = new Set(prev);
      if (allChecked) {
        childFuncIds.forEach(id => next.delete(id));
      } else {
        childFuncIds.forEach(id => next.add(id));
      }
      return next;
    });
  }

  // Toggle single functionality
  function toggleFunctionality(func, moduleId) {
    setAssignedRightIds(prev => {
      const next = new Set(prev);
      next.has(func.funcId) ? next.delete(func.funcId) : next.add(func.funcId);

      // Update parent module selection state
      let parentModule = null;
      for (const category of availableTree) {
        parentModule = category.children.find(m => m.moduleId === moduleId);
        if (parentModule) break;
      }
      
      if (parentModule) {
        const siblingFuncIds = parentModule.functionalities.map(f => f.funcId);
        const anyRemaining = siblingFuncIds.some(id => next.has(id));
        const allSelected = siblingFuncIds.length > 0 && siblingFuncIds.every(id => next.has(id));

        setAssignedModuleIds(prev2 => {
          const next2 = new Set(prev2);
          if (allSelected) {
            next2.add(moduleId);
          } else if (!anyRemaining) {
            next2.delete(moduleId);
          } else {
            if (!next2.has(moduleId) && anyRemaining) {
              next2.add(moduleId);
            }
          }
          return next2;
        });
      }

      return next;
    });
  }

  // Build assigned tree (only categories and modules with assigned functionalities)
  const assignedTree = useMemo(() => {
    return availableTree
      .map(category => ({
        ...category,
        children: category.children
          .map(module => ({
            ...module,
            functionalities: module.functionalities.filter(f => assignedRightIds.has(f.funcId)),
          }))
          .filter(module => module.functionalities.length > 0),
      }))
      .filter(category => category.children.length > 0);
  }, [availableTree, assignedRightIds]);

  // Filter available tree based on search
  const filteredAvailableTree = useMemo(() => {
    const q = searchAvailable.toLowerCase();
    if (!q) return availableTree;
    
    return availableTree
      .map(category => ({
        ...category,
        children: category.children.filter(module =>
          module.name.toLowerCase().includes(q) ||
          category.name.toLowerCase().includes(q) ||
          module.functionalities.some(f => f.name.toLowerCase().includes(q))
        ),
      }))
      .filter(category => category.children.length > 0 || category.name.toLowerCase().includes(q));
  }, [availableTree, searchAvailable]);

  // Filter assigned tree based on search
  const filteredAssignedTree = useMemo(() => {
    const q = searchAssigned.toLowerCase();
    if (!q) return assignedTree;
    
    return assignedTree
      .map(category => ({
        ...category,
        children: category.children.filter(module =>
          module.name.toLowerCase().includes(q) ||
          category.name.toLowerCase().includes(q) ||
          module.functionalities.some(f => f.name.toLowerCase().includes(q))
        ),
      }))
      .filter(category => category.children.length > 0 || category.name.toLowerCase().includes(q));
  }, [assignedTree, searchAssigned]);

  async function handleSave() {
    if (!selectedGroup) return;
    setSaving(true);
    try {
      const byModule = {};
      assignedRightIds.forEach(funcId => {
        const func = functionalities.find(x => x.id === funcId);
        if (!func) return;
        if (!byModule[func.module_id]) byModule[func.module_id] = [];
        byModule[func.module_id].push(funcId);
      });
      
      assignedModuleIds.forEach(modId => {
        if (!byModule[modId]) byModule[modId] = [];
      });

      await axiosInstance.delete(`/add-rights/group/${selectedGroup.id}`);
      for (const [moduleId, funcIds] of Object.entries(byModule)) {
        if (funcIds.length > 0) {
          await axiosInstance.post("/add-rights", {
            group:           selectedGroup.id,
            module:          Number(moduleId),
            functionalities: funcIds,
          });
        }
      }
      toast.success(`Permissions updated for "${selectedGroup.group_name}"`);
      onRefresh();
    } catch (err) {
      toast.error("Failed to save permissions");
    } finally {
      setSaving(false);
    }
  }

  // Calculate module check state (for indeterminate checkbox)
  function getModuleCheckState(module) {
    const childFuncIds = module.functionalities.map(f => f.funcId);
    if (childFuncIds.length === 0) return false;
    const checkedCount = childFuncIds.filter(id => assignedRightIds.has(id)).length;
    
    if (checkedCount === 0) return false;
    if (checkedCount === childFuncIds.length) return true;
    return "indeterminate";
  }

  return (
    <div className="flex gap-4 h-[calc(106vh-280px)]">
      {/* Groups Sidebar */}
    {/* Groups Sidebar */}
<div className="w-64 flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
    <span className="text-[12px] font-bold text-slate-700 uppercase tracking-wide">Groups</span>
    <button
      onClick={() => { setGroupModal('add'); setGroupNameInput(''); setEditingGroup(null); }}
      className="flex items-center justify-center h-6 w-6 rounded-md bg-teal-600 text-white hover:bg-teal-700 transition text-[14px] font-bold leading-none shadow-sm"
      title="Add new group"
    >
      +
    </button>
  </div>
  <div className="flex-1 overflow-y-auto py-1">
    {groups.map(g => (
      <div
        key={g.id}
        className={`group relative flex items-center border-l-4 transition-all ${
          selectedGroup?.id === g.id
            ? 'bg-teal-50 border-teal-500'
            : 'border-transparent hover:bg-slate-50'
        }`}
      >
        <button
          onClick={() => { setSelectedGroup(g); setExpandedGroupActions(null); }}
          className="flex-1 text-left px-4 py-3 min-w-0"
        >
          <p className={`text-[13px] font-bold truncate ${selectedGroup?.id === g.id ? 'text-teal-700' : 'text-slate-700'}`}>
            {g.group_name}
          </p>
          <p className="text-[9px] opacity-50 uppercase tracking-widest mt-0.5 truncate">
            {(g.users || []).length} users
          </p>
        </button>

        {/* ">" action toggle button */}
        <button
          onClick={e => { e.stopPropagation(); setExpandedGroupActions(prev => prev === g.id ? null : g.id); }}
          className={`shrink-0 mr-2 p-1 rounded transition text-[11px] font-bold ${
            expandedGroupActions === g.id
              ? 'bg-slate-200 text-slate-700'
              : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
          }`}
          title="Group actions"
        >
          <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${expandedGroupActions === g.id ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Inline action buttons (edit / delete) */}
        <AnimatePresence>
          {expandedGroupActions === g.id && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white border border-slate-200 rounded-lg shadow-lg px-1.5 py-1 z-10"
            >
              <button
                onClick={e => {
                  e.stopPropagation();
                  setEditingGroup(g);
                  setGroupNameInput(g.group_name);
                  setGroupModal('edit');
                  setExpandedGroupActions(null);
                }}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-teal-700 hover:bg-teal-50 rounded transition"
                title="Edit group"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" /></svg>
                Edit
              </button>
              <div className="w-px h-4 bg-slate-200" />
              <button
                onClick={e => { e.stopPropagation(); handleGroupDelete(g); }}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 rounded transition"
                title="Delete group"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    ))}
  </div>
</div>

{/* Add / Edit Group Modal */}
<AnimatePresence>
  {groupModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={() => { setGroupModal(null); setGroupNameInput(''); setEditingGroup(null); }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-teal-100">
              <MdPeople className="h-4 w-4 text-teal-600" />
            </div>
            <div>
              <p className="text-[13px] font-black text-slate-800">
                {groupModal === 'edit' ? 'Edit Group' : 'New Group'}
              </p>
              <p className="text-[10px] text-slate-500">
                {groupModal === 'edit' ? `Editing: ${editingGroup?.group_name}` : 'Create a new access group'}
              </p>
            </div>
          </div>
          <button
            onClick={() => { setGroupModal(null); setGroupNameInput(''); setEditingGroup(null); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <MdClose className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-5 py-5 space-y-4">
          {groupModal === 'edit' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Group ID</label>
              <input
                type="text"
                value={`#${String(editingGroup?.id || '').padStart(4, '0')}`}
                disabled
                className="w-full h-9 px-3 rounded-lg border border-slate-100 bg-slate-50 text-[12px] font-mono text-slate-400"
              />
            </div>
          )}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Group Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={groupNameInput}
              onChange={e => setGroupNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleGroupSubmit(); if (e.key === 'Escape') { setGroupModal(null); setGroupNameInput(''); } }}
              placeholder="e.g. System Administrators"
              autoFocus
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50/30">
          <button
            onClick={() => { setGroupModal(null); setGroupNameInput(''); setEditingGroup(null); }}
            className="px-4 py-2 text-[12px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleGroupSubmit}
            disabled={groupSubmitting || !groupNameInput.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-teal-600 text-white rounded-lg text-[12px] font-bold hover:bg-teal-700 transition disabled:opacity-50 shadow-sm"
          >
            <MdSave className="h-3.5 w-3.5" />
            {groupSubmitting ? 'Saving...' : groupModal === 'edit' ? 'Update Group' : 'Create Group'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

      {/* Available Permissions - Hierarchical Tree Structure (Parent Category → Child Modules → Functionalities) */}
      <div className="flex-1 flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-[12px] font-bold text-slate-700 uppercase tracking-wide">Available Permissions</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => expandAll(setExpandedAvailable, filteredAvailableTree)}
              className="text-[10px] text-teal-600 hover:text-teal-700 font-bold hover:bg-teal-50 px-2 py-1 rounded transition"
              title="Expand All"
            >
              Expand All
            </button>
            <button
              onClick={() => collapseAll(setExpandedAvailable)}
              className="text-[10px] text-slate-500 hover:text-slate-700 font-bold hover:bg-slate-100 px-2 py-1 rounded transition"
              title="Collapse All"
            >
              Collapse
            </button>
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
        
        <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scroll">
          {filteredAvailableTree.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
              <MdShield className="h-10 w-10 mb-2" />
              <p className="text-[12px]">No permissions available</p>
            </div>
          ) : (
            filteredAvailableTree.map(category => {
              const isCategoryExpanded = expandedAvailable.has(category.id);
              
              return (
                <div key={category.id} className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                  {/* Parent Category Row */}
                  <div 
                    className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-slate-100 to-white hover:from-slate-100/70 transition-colors cursor-pointer"
                    onClick={() => toggleExpand(setExpandedAvailable, category.id)}
                  >
                    <div className="p-1 rounded-lg bg-white shadow-sm">
                      {category.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-slate-800">{category.name}</span>
                        <span className="text-[9px] bg-teal-100 text-teal-700 font-bold px-1.5 py-0.5 rounded-full">
                          {category.children.length} modules
                        </span>
                      </div>
                      {category.description && (
                        <p className="text-[9px] text-slate-500 mt-0.5 truncate">{category.description}</p>
                      )}
                    </div>
                    {isCategoryExpanded
                      ? <MdExpandLess className="text-slate-400 h-5 w-5 shrink-0" />
                      : <MdExpandMore className="text-slate-400 h-5 w-5 shrink-0" />}
                  </div>

                  {/* Child Modules (Collapsible) */}
                  <AnimatePresence initial={false}>
                    {isCategoryExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-slate-100 bg-white">
                          {category.children.map(module => {
                            const isModuleExpanded = expandedAvailable.has(module.id);
                            const checkState = getModuleCheckState(module);
                            const moduleFuncCount = module.functionalities.length;
                            const assignedFuncCount = module.functionalities.filter(f => assignedRightIds.has(f.funcId)).length;
                            
                            return (
                              <div key={module.id} className="border-b border-slate-50 last:border-0">
                                {/* Module Row (Child) */}
                                <div className="flex items-center gap-2 pl-8 pr-3 py-2 hover:bg-slate-50/80 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={checkState === true}
                                    ref={el => {
                                      if (el) el.indeterminate = checkState === "indeterminate";
                                    }}
                                    onChange={() => toggleModule(module)}
                                    onClick={e => e.stopPropagation()}
                                    className="rounded accent-teal-600 cursor-pointer h-3.5 w-3.5"
                                    disabled={module.isPlanned}
                                  />
                                  <div className="p-0.5 rounded-md text-slate-500">
                                    {module.icon}
                                  </div>
                                  <button
                                    onClick={() => !module.isPlanned && toggleExpand(setExpandedAvailable, module.id)}
                                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                                    disabled={module.isPlanned}
                                  >
                                    <span className={`text-[12px] font-semibold ${module.isPlanned ? 'text-slate-400' : 'text-slate-700'} truncate`}>
                                      {module.name}
                                      {module.isPlanned && (
                                        <span className="ml-2 text-[8px] bg-slate-100 text-slate-500 font-normal px-1 py-0.5 rounded-full">Planned</span>
                                      )}
                                    </span>
                                    {moduleFuncCount > 0 && (
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                        assignedFuncCount === moduleFuncCount 
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : assignedFuncCount > 0
                                          ? 'bg-amber-100 text-amber-700'
                                          : 'bg-slate-100 text-slate-500'
                                      }`}>
                                        {assignedFuncCount}/{moduleFuncCount}
                                      </span>
                                    )}
                                    {!module.isPlanned && moduleFuncCount > 0 && (
                                      isModuleExpanded
                                        ? <MdExpandLess className="text-slate-400 h-4 w-4 shrink-0" />
                                        : <MdExpandMore className="text-slate-400 h-4 w-4 shrink-0" />
                                    )}
                                  </button>
                                </div>

                                {/* Functionalities under Module */}
                                {!module.isPlanned && moduleFuncCount > 0 && (
                                  <AnimatePresence initial={false}>
                                    {isModuleExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.15, ease: "easeInOut" }}
                                        className="overflow-hidden"
                                      >
                                        <div className="pl-14 pr-3 py-1 bg-slate-50/50">
                                          {module.functionalities.map(func => (
                                            <div
                                              key={func.id}
                                              className="flex items-center gap-2 py-1.5 hover:bg-teal-50/40 cursor-pointer transition-colors rounded px-1"
                                              onClick={() => toggleFunctionality(func, module.moduleId)}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={assignedRightIds.has(func.funcId)}
                                                onChange={() => toggleFunctionality(func, module.moduleId)}
                                                onClick={e => e.stopPropagation()}
                                                className="rounded accent-teal-600 cursor-pointer h-3 w-3"
                                              />
                                              <span className="text-[10px] text-slate-600 flex-1">{func.name}</span>
                                              {func.action && <ActionBadge action={func.action} />}
                                            </div>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                )}
                                
                                {/* Planned module placeholder */}
                                {module.isPlanned && (
                                  <div className="pl-14 pr-3 py-2 bg-slate-50/30">
                                    <p className="text-[9px] text-slate-400 italic flex items-center gap-1">
                                      <MdSettings className="h-3 w-3" />
                                      Permissions will be available when module is deployed
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
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

      {/* Assigned to Group Panel */}
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
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {!selectedGroup ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <MdShield className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-[12px]">Select a group to view assignments</p>
            </div>
          ) : filteredAssignedTree.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
              <MdShield className="h-10 w-10 mb-2" />
              <p className="text-[12px]">No permissions assigned</p>
              <p className="text-[10px] text-slate-400 mt-1">Check items from the left panel</p>
            </div>
          ) : (
            filteredAssignedTree.map(category => {
              const isCategoryExpanded = expandedAssigned.has(category.id);
              
              return (
                <div key={category.id} className="rounded-lg border border-teal-100 overflow-hidden">
                  <button
                    onClick={() => toggleExpand(setExpandedAssigned, category.id)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 bg-teal-50/50 hover:bg-teal-50 transition-colors"
                  >
                    {category.icon}
                    <span className="text-[11px] font-bold text-teal-800 flex-1 text-left truncate">{category.name}</span>
                    <span className="text-[9px] bg-teal-200 text-teal-800 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                      {category.children.length}
                    </span>
                    {isCategoryExpanded
                      ? <MdExpandLess className="text-teal-400 h-5 w-5 shrink-0" />
                      : <MdExpandMore className="text-teal-400 h-5 w-5 shrink-0" />}
                  </button>
                  
                  <AnimatePresence initial={false}>
                    {isCategoryExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-teal-100 bg-white">
                          {category.children.map(module => {
                            const isModuleExpanded = expandedAssigned.has(module.id);
                            
                            return (
                              <div key={module.id} className="border-b border-teal-50 last:border-0">
                                <button
                                  onClick={() => toggleExpand(setExpandedAssigned, module.id)}
                                  className="w-full flex items-center gap-2 pl-8 pr-3 py-2 hover:bg-teal-50/30 transition-colors"
                                >
                                  <MdCheck className="text-emerald-500 h-3 w-3 shrink-0" />
                                  <span className="text-[11px] font-medium text-slate-700 flex-1 text-left truncate">{module.name}</span>
                                  <span className="text-[9px] bg-teal-100 text-teal-700 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                    {module.functionalities.length}
                                  </span>
                                  {isModuleExpanded
                                    ? <MdExpandLess className="text-slate-400 h-4 w-4 shrink-0" />
                                    : <MdExpandMore className="text-slate-400 h-4 w-4 shrink-0" />}
                                </button>
                                
                                <AnimatePresence initial={false}>
                                  {isModuleExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.15, ease: "easeInOut" }}
                                      className="overflow-hidden"
                                    >
                                      <div className="pl-14 pr-3 py-1 bg-slate-50/30">
                                        {module.functionalities.map(func => (
                                          <div key={func.id} className="flex items-center gap-2 py-1.5">
                                            <MdCheck className="text-emerald-400 h-2.5 w-2.5 shrink-0" />
                                            <span className="text-[10px] text-slate-600 flex-1">{func.name}</span>
                                            {func.action && <ActionBadge action={func.action} />}
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
// USERS TAB (unchanged)
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
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="text-[11px] text-slate-500 hover:text-slate-700 font-bold hover:bg-slate-100 px-3 py-1.5 rounded-lg transition"
          >
            Collapse All
          </button>
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