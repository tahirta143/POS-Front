import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../services/axiosInstance";
import { usePermissions } from "../../hooks/usePermissions";
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
  MdLock,
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
  READ: "bg-blue-100   text-blue-700",
  UPDATE: "bg-amber-100  text-amber-700",
  DELETE: "bg-rose-100   text-rose-700",
  PRINT: "bg-purple-100 text-purple-700",
  USE: "bg-teal-100   text-teal-700",
};

function ActionBadge({ action }) {
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 ${ACTION_COLORS[action] || "bg-slate-100 text-slate-600"}`}
    >
      {action}
    </span>
  );
}

// Get icon for parent category
function getCategoryIcon(categoryName) {
  const name = categoryName.toLowerCase();
  if (name.includes("customer"))
    return <MdPerson className="h-4 w-4 text-emerald-600" />;
  if (name.includes("supplier") || name.includes("vendor"))
    return <MdLocalShipping className="h-4 w-4 text-blue-600" />;
  if (name.includes("security") || name.includes("access"))
    return <MdSecurity className="h-4 w-4 text-purple-600" />;
  if (name.includes("finance") || name.includes("billing"))
    return <MdPayment className="h-4 w-4 text-amber-600" />;
  if (name.includes("expense") || name.includes("daybook"))
    return <MdAccountBalance className="h-4 w-4 text-rose-600" />;
  if (name.includes("dashboard"))
    return <MdDashboard className="h-4 w-4 text-teal-600" />;
  if (name.includes("setup") || name.includes("emergency"))
    return <MdSettings className="h-4 w-4 text-slate-600" />;
  return <MdFolder className="h-4 w-4 text-slate-500" />;
}

// Get icon for child module
function getModuleIcon(moduleName) {
  const name = moduleName.toLowerCase();
  if (name === "customer") return <MdPerson className="h-3.5 w-3.5" />;
  if (name.includes("payment")) return <MdPayment className="h-3.5 w-3.5" />;
  if (name.includes("ledger")) return <MdReceipt className="h-3.5 w-3.5" />;
  if (name === "supplier" || name === "manufacturer")
    return <MdLocalShipping className="h-3.5 w-3.5" />;
  if (name === "group" || name === "user" || name === "staff" || name === "group user")
    return <MdPeople className="h-3.5 w-3.5" />;
  if (name === "module") return <MdViewModule className="h-3.5 w-3.5" />;
  if (name.includes("permission") || name === "add right" || name === "security")
    return <MdSecurity className="h-3.5 w-3.5" />;
  if (name === "sale" || name === "sale return")
    return <MdReceipt className="h-3.5 w-3.5" />;
  if (name === "purchase" || name === "purchase return" || name === "goods receipt")
    return <MdLocalShipping className="h-3.5 w-3.5" />;
  if (name === "booking" || name === "reorder")
    return <MdFolder className="h-3.5 w-3.5" />;
  if (name === "dashboard") return <MdDashboard className="h-3.5 w-3.5" />;
  if (name.includes("expense") || name === "day book")
    return <MdAccountBalance className="h-3.5 w-3.5" />;
  if (
    name.includes("item") ||
    name.includes("category") ||
    name.includes("type") ||
    name.includes("unit") ||
    name.includes("shelve") ||
    name.includes("sub category")
  )
    return <MdSettings className="h-3.5 w-3.5" />;
  if (name === "stock") return <MdFolderOpen className="h-3.5 w-3.5" />;
  if (name === "security log") return <MdHistory className="h-3.5 w-3.5" />;
  return <MdFolder className="h-3.5 w-3.5" />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GROUPS TAB - with Permission-based controls
// ═══════════════════════════════════════════════════════════════════════════════
function GroupsTab({ groups, modules, functionalities, allUsers, onRefresh }) {
  const { canCreate, canRead, canUpdate, canDelete, isAdmin } =
    usePermissions();
  const MODULE_NAME = "Group";

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [assignedRightIds, setAssignedRightIds] = useState(new Set());
  const [assignedModuleIds, setAssignedModuleIds] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [searchAvailable, setSearchAvailable] = useState("");
  const [searchAssigned, setSearchAssigned] = useState("");
  const [expandedAvailable, setExpandedAvailable] = useState(new Set());
  const [expandedAssigned, setExpandedAssigned] = useState(new Set());
  const [groupModal, setGroupModal] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupNameInput, setGroupNameInput] = useState("");
  const [groupSubmitting, setGroupSubmitting] = useState(false);
  const [expandedGroupActions, setExpandedGroupActions] = useState(null);
  const [groupUsersModal, setGroupUsersModal] = useState(null);
  const [groupUserIds, setGroupUserIds] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [savingGroupUsers, setSavingGroupUsers] = useState(false);

  // Permission checks for Groups module
  const canCreateGroup = isAdmin || canCreate(MODULE_NAME);
  const canReadGroup = isAdmin || canRead(MODULE_NAME);
  const canUpdateGroup = isAdmin || canUpdate(MODULE_NAME);
  const canDeleteGroup = isAdmin || canDelete(MODULE_NAME);
  const canAssignUsers = isAdmin || canUpdate(MODULE_NAME);
  const canAssignPermissions = isAdmin || canUpdate(MODULE_NAME); // For editing permissions
  const hasGroupActions = canAssignUsers || canUpdateGroup || canDeleteGroup;

  function toggleExpand(setFn, id) {
    setFn((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function expandAll(setFn, treeData) {
    setFn(new Set(treeData.map((item) => item.id)));
  }

  function collapseAll(setFn) {
    setFn(new Set());
  }

  useEffect(() => {
    if (!selectedGroup || !canReadGroup) return;
    loadGroupRights(selectedGroup.id);
  }, [selectedGroup, canReadGroup]);

  async function loadGroupRights(groupId) {
    try {
      const res = await axiosInstance.get(`/add-rights?groupId=${groupId}`);
      const data = Array.isArray(res.data) ? res.data : [];
      const funcIds = new Set();
      const modIds = new Set();
      data.forEach((r) => {
        const funcs = r.functionalities || [];
        if (funcs.length > 0) {
          modIds.add(r.module_id);
          funcs.forEach((f) => funcIds.add(f.id));
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
    if (!groupNameInput.trim()) {
      toast.error("Group name is required.");
      return;
    }
    setGroupSubmitting(true);
    try {
      if (groupModal === "edit" && editingGroup) {
        if (!canUpdateGroup) {
          toast.error("You don't have permission to update groups.");
          return;
        }
        await axiosInstance.put(`/groups/${editingGroup.id}`, {
          group_name: groupNameInput.trim(),
        });
        toast.success("Group updated successfully.");
      } else {
        if (!canCreateGroup) {
          toast.error("You don't have permission to create groups.");
          return;
        }
        await axiosInstance.post("/groups", {
          group_name: groupNameInput.trim(),
        });
        toast.success("Group created successfully.");
      }
      setGroupModal(null);
      setGroupNameInput("");
      setEditingGroup(null);
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save group.");
    } finally {
      setGroupSubmitting(false);
    }
  }

  async function handleGroupDelete(group) {
    if (!canDeleteGroup) {
      toast.error("You don't have permission to delete groups.");
      return;
    }
    if (
      !window.confirm(
        `Delete "${group.group_name}"? This may affect assigned users.`,
      )
    )
      return;
    try {
      await axiosInstance.delete(`/groups/${group.id}`);
      toast.success("Group deleted.");
      if (selectedGroup?.id === group.id) setSelectedGroup(null);
      setExpandedGroupActions(null);
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete group.");
    }
  }

  async function openGroupUsersModal(g) {
    if (!canAssignUsers) {
      toast.error("You don't have permission to manage group users.");
      return;
    }
    setExpandedGroupActions(null);
    setGroupUserIds((g.users || []).map((u) => String(u.id)));
    setUserSearch("");
    setGroupUsersModal(g);
  }

  async function handleSaveGroupUsers() {
    if (!groupUsersModal) return;
    setSavingGroupUsers(true);
    try {
      await axiosInstance.put(`/group-users/${groupUsersModal.id}/users`, {
        userIds: groupUserIds.map(Number),
      });
      toast.success(`Users updated for "${groupUsersModal.group_name}"`);
      setGroupUsersModal(null);
      onRefresh();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to update group users.",
      );
    } finally {
      setSavingGroupUsers(false);
    }
  }

  // Build hierarchical tree structure
  const availableTree = useMemo(() => {
    const categoryStructure = {
      "Customer Management": {
        id: "cat-customer",
        icon: getCategoryIcon("customer"),
        description: "Manage customer data, payments, and account ledgers",
        modules: ["Customer", "Customer Payment", "Customer Ledger"],
      },
      "Supplier & Manufacturer Management": {
        id: "cat-supplier",
        icon: getCategoryIcon("supplier"),
        description: "Manage supplier information, payments, and amounts",
        modules: [
          "Supplier",
          "Supplier Payment",
          "Supplier Ledger",
          "Manufacturer",
        ],
      },
      "Security & Access Control": {
        id: "cat-security",
        icon: getCategoryIcon("security"),
        description: "System security, user roles, and permission management",
        modules: [
          "Security",
          "Group",
          "User",
          "Group User",
          "Module",
          "Permission",
          "Add Right",
          "Security Log",
          "Staff",
        ],
      },
      "Billing & Finance": {
        id: "cat-billing",
        icon: getCategoryIcon("finance"),
        description:
          "Invoicing, payment processing, and financial transactions",
        modules: [
          "Booking",
          "Purchase",
          "Purchase Return",
          "Sale",
          "Sale Return",
          "Stock",
          "Reorder",
          "Goods Receipt",
        ],
      },
      "Expense & DayBook": {
        id: "cat-billing2",
        icon: getCategoryIcon("expense"),
        description:
          "Expense tracking, vouchers, and daily financial records",
        modules: [
          "Expense Head",
          "Expense Voucher",
          "Expense Report",
          "Day Book",
        ],
      },
      "Dashboard & Analytics": {
        id: "cat-dashboard",
        icon: getCategoryIcon("dashboard"),
        description: "System dashboards, reports, and analytics",
        modules: ["Dashboard"],
      },
      Setup: {
        id: "cat-emergency",
        icon: getCategoryIcon("emergency"),
        description: "Setup screens for various modules",
        modules: [
          "Items",
          "Item Category",
          "Sub Category",
          "Item Type",
          "Item Unit",
          "Shelve Location",
        ],
      },
    };

    const moduleMap = new Map();
    modules.forEach((m) => {
      moduleMap.set(m.id, {
        id: m.id,
        name: m.module_name,
        description: m.description || "",
        functionalities: [],
      });
    });

    functionalities.forEach((f) => {
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

    const tree = [];

    Object.entries(categoryStructure).forEach(([categoryName, category]) => {
      const childModules = [];

      category.modules.forEach((moduleName) => {
        let matchingModule = null;
        for (const [_, mod] of moduleMap) {
          if (mod.name.toLowerCase() === moduleName.toLowerCase()) {
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
          childModules.push({
            id: `planned-${moduleName.replace(/\s/g, "-")}`,
            moduleId: `planned-${moduleName.replace(/\s/g, "-")}`,
            name: moduleName,
            description: `${moduleName} module (coming soon)`,
            icon: getModuleIcon(moduleName),
            type: "module",
            isPlanned: true,
            functionalities: [],
          });
        }
      });

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

    return tree;
  }, [modules, functionalities]);

  function inferAction(name) {
    const n = name.toUpperCase();
    if (n.includes("CREATE")) return "CREATE";
    if (n.includes("DELETE") || n.includes("REMOVE")) return "DELETE";
    if (n.includes("UPDATE") || n.includes("EDIT")) return "UPDATE";
    if (n.includes("READ") || n.includes("VIEW") || n.includes("GET"))
      return "READ";
    if (n.includes("PRINT")) return "PRINT";
    if (n.includes("EXPORT")) return "READ";
    return null;
  }

  const PERMISSION_DEPS = [
    {
      triggerModule: "item",
      triggerAction: "create",
      deps: [
        { mod: "item", action: "read" },
        { mod: "item category", action: "read" },
        { mod: "item type", action: "read" },
        { mod: "sub category", action: "read" },
        { mod: "item unit", action: "read" },
        { mod: "shelve location", action: "read" },
        { mod: "manufacturer", action: "read" },
        { mod: "supplier", action: "read" },
      ],
    },
    {
      triggerModule: "item",
      triggerAction: "update",
      deps: [
        { mod: "item", action: "read" },
        { mod: "item category", action: "read" },
        { mod: "item type", action: "read" },
        { mod: "sub category", action: "read" },
        { mod: "item unit", action: "read" },
        { mod: "shelve location", action: "read" },
        { mod: "manufacturer", action: "read" },
        { mod: "supplier", action: "read" },
      ],
    },
    {
      triggerModule: "sale",
      triggerAction: "create",
      deps: [
        { mod: "customer", action: "read" },
        { mod: "item", action: "read" },
        { mod: "item category", action: "read" },
      ],
    },
    {
      triggerModule: "sale",
      triggerAction: "update",
      deps: [
        { mod: "customer", action: "read" },
        { mod: "item", action: "read" },
        { mod: "item category", action: "read" },
      ],
    },
    {
      triggerModule: "booking",
      triggerAction: "create",
      deps: [
        { mod: "customer", action: "read" },
        { mod: "item", action: "read" },
        { mod: "item category", action: "read" },
        { mod: "booking", action: "read" },
      ],
    },
    {
      triggerModule: "booking",
      triggerAction: "update",
      deps: [
        { mod: "booking", action: "read" },
        { mod: "customer", action: "read" },
        { mod: "item", action: "read" },
        { mod: "item category", action: "read" },
      ],
    },
    {
      triggerModule: "purchase",
      triggerAction: "create",
      deps: [
        { mod: "supplier", action: "read" },
        { mod: "item", action: "read" },
        { mod: "item category", action: "read" },
      ],
    },
    {
      triggerModule: "purchase",
      triggerAction: "update",
      deps: [
        { mod: "supplier", action: "read" },
        { mod: "item", action: "read" },
        { mod: "item category", action: "read" },
      ],
    },
    {
      triggerModule: "dashboard",
      triggerAction: "read",
      deps: [
        { mod: "booking", action: "read" },
        { mod: "item", action: "read" },
        { mod: "customer", action: "read" },
        { mod: "sale", action: "read" },
        { mod: "staff", action: "read" },
      ],
    },
    {
      triggerModule: "security",
      triggerAction: "read",
      deps: [
        { mod: "add right", action: "read" },
        { mod: "permission", action: "read" },
        { mod: "group", action: "read" },
        { mod: "user", action: "read" },
        { mod: "group user", action: "read" },
        { mod: "module", action: "read" },
        { mod: "security log", action: "read" },
      ],
    },
    {
      triggerModule: "sub category",
      triggerAction: "read",
      deps: [{ mod: "item category", action: "read" }],
    },
    {
      triggerModule: "sub category",
      triggerAction: "create",
      deps: [{ mod: "item category", action: "read" },{ mod: "sub category", action: "read" }],
    },
    {
      triggerModule: "supplier ledger",
      triggerAction: "read",
      deps: [{ mod: "supplier", action: "read" }],
    },
    {
      triggerModule: "customer ledger",
      triggerAction: "read",
      deps: [{ mod: "customer", action: "read" }],
    },
  ];

  function buildModuleNameMap() {
    const map = new Map();
    modules.forEach((m) => map.set(m.id, m.module_name.toLowerCase()));
    return map;
  }

  function getDepsForRule(rule, moduleNameById) {
    const ids = new Set();
    rule.deps.forEach(({ mod, action }) => {
      const match = functionalities.find((f) => {
        const fName = f.name.toLowerCase();
        const mName = moduleNameById.get(f.module_id) || "";
        const modOk = mod.includes(" ")
          ? mName.includes(mod)
          : mName === mod || mName === mod + "s" || mName.startsWith(mod + " ");
        return modOk && fName.includes(action);
      });
      if (match) ids.add(match.id);
    });
    return ids;
  }

  function getAllRequiredDeps(funcIds) {
    const moduleNameById = buildModuleNameMap();
    const required = new Set();
    funcIds.forEach((funcId) => {
      const f = functionalities.find((x) => x.id === funcId);
      if (!f) return;
      const fName = f.name.toLowerCase();
      const mName = moduleNameById.get(f.module_id) || "";
      PERMISSION_DEPS.forEach((rule) => {
        if (
          mName.includes(rule.triggerModule) &&
          fName.includes(rule.triggerAction)
        ) {
          getDepsForRule(rule, moduleNameById).forEach((id) =>
            required.add(id),
          );
        }
      });
    });
    return required;
  }

  function syncModuleIds(newRightIds) {
    setAssignedModuleIds(() => {
      const modIds = new Set();
      newRightIds.forEach((funcId) => {
        const f = functionalities.find((x) => x.id === funcId);
        if (f) modIds.add(f.module_id);
      });
      return modIds;
    });
  }

  function toggleModule(module) {
    if (!canAssignPermissions) {
      toast.error("You don't have permission to assign permissions.");
      return;
    }
    
    const childFuncIds = module.functionalities
      .map((f) => f.funcId)
      .filter(Boolean);
    const allChecked =
      childFuncIds.length > 0 &&
      childFuncIds.every((id) => assignedRightIds.has(id));

    setAssignedRightIds((prev) => {
      const next = new Set(prev);
      const moduleNameById = buildModuleNameMap();

      if (allChecked) {
        childFuncIds.forEach((id) => next.delete(id));
        const stillNeeded = getAllRequiredDeps([...next]);
        childFuncIds.forEach((funcId) => {
          const f = functionalities.find((x) => x.id === funcId);
          if (!f) return;
          const fName = f.name.toLowerCase();
          const mName = moduleNameById.get(f.module_id) || "";
          PERMISSION_DEPS.forEach((rule) => {
            if (
              mName.includes(rule.triggerModule) &&
              fName.includes(rule.triggerAction)
            ) {
              getDepsForRule(rule, moduleNameById).forEach((depId) => {
                if (!stillNeeded.has(depId)) next.delete(depId);
              });
            }
          });
        });
      } else {
        childFuncIds.forEach((id) => next.add(id));
        getAllRequiredDeps(childFuncIds).forEach((id) => next.add(id));
      }

      syncModuleIds(next);
      return next;
    });
  }

  function toggleFunctionality(func, moduleId) {
    if (!canAssignPermissions) {
      toast.error("You don't have permission to assign permissions.");
      return;
    }
    
    setAssignedRightIds((prev) => {
      const next = new Set(prev);
      const moduleNameById = buildModuleNameMap();

      if (next.has(func.funcId)) {
        next.delete(func.funcId);
        const stillNeeded = getAllRequiredDeps([...next]);
        const fName = func.name.toLowerCase();
        const mName = moduleNameById.get(func.module_id) || "";
        PERMISSION_DEPS.forEach((rule) => {
          if (
            mName.includes(rule.triggerModule) &&
            fName.includes(rule.triggerAction)
          ) {
            getDepsForRule(rule, moduleNameById).forEach((depId) => {
              if (!stillNeeded.has(depId)) next.delete(depId);
            });
          }
        });
      } else {
        next.add(func.funcId);
        getAllRequiredDeps([func.funcId]).forEach((id) => next.add(id));
      }

      syncModuleIds(next);
      return next;
    });
  }

  function removeModule(module) {
    if (!canAssignPermissions) {
      toast.error("You don't have permission to remove permissions.");
      return;
    }
    
    const funcIds = module.functionalities.map((f) => f.funcId);
    setAssignedRightIds((prev) => {
      const next = new Set(prev);
      funcIds.forEach((id) => next.delete(id));
      return next;
    });
    setAssignedModuleIds((prev) => {
      const next = new Set(prev);
      next.delete(module.moduleId ?? module.id);
      return next;
    });
  }

  function removeFunctionality(func) {
    if (!canAssignPermissions) {
      toast.error("You don't have permission to remove permissions.");
      return;
    }
    
    setAssignedRightIds((prev) => {
      const next = new Set(prev);
      next.delete(func.funcId);
      return next;
    });
    setAssignedModuleIds((prev) => {
      const next = new Set(prev);
      const moduleStillHasFuncs = [...assignedRightIds].some(
        (id) =>
          id !== func.funcId &&
          functionalities.find((f) => f.id === id)?.module_id ===
            func.module_id,
      );
      if (!moduleStillHasFuncs) next.delete(func.module_id);
      return next;
    });
  }

  const assignedTree = useMemo(() => {
    return availableTree
      .map((category) => ({
        ...category,
        children: category.children
          .map((module) => ({
            ...module,
            functionalities: module.functionalities.filter((f) =>
              assignedRightIds.has(f.funcId),
            ),
          }))
          .filter((module) => module.functionalities.length > 0),
      }))
      .filter((category) => category.children.length > 0);
  }, [availableTree, assignedRightIds]);

  const filteredAvailableTree = useMemo(() => {
    const q = searchAvailable.toLowerCase();
    if (!q) return availableTree;

    return availableTree
      .map((category) => ({
        ...category,
        children: category.children.filter(
          (module) =>
            module.name.toLowerCase().includes(q) ||
            category.name.toLowerCase().includes(q) ||
            module.functionalities.some((f) =>
              f.name.toLowerCase().includes(q),
            ),
        ),
      }))
      .filter(
        (category) =>
          category.children.length > 0 ||
          category.name.toLowerCase().includes(q),
      );
  }, [availableTree, searchAvailable]);

  const filteredAssignedTree = useMemo(() => {
    const q = searchAssigned.toLowerCase();
    if (!q) return assignedTree;

    return assignedTree
      .map((category) => ({
        ...category,
        children: category.children.filter(
          (module) =>
            module.name.toLowerCase().includes(q) ||
            category.name.toLowerCase().includes(q) ||
            module.functionalities.some((f) =>
              f.name.toLowerCase().includes(q),
            ),
        ),
      }))
      .filter(
        (category) =>
          category.children.length > 0 ||
          category.name.toLowerCase().includes(q),
      );
  }, [assignedTree, searchAssigned]);

  async function handleSave() {
    if (!selectedGroup) {
      toast.error("Please select a group first.");
      return;
    }
    
    if (!canAssignPermissions) {
      toast.error("You don't have permission to assign permissions.");
      return;
    }
    
    setSaving(true);
    try {
      const byModule = {};
      assignedRightIds.forEach((funcId) => {
        const func = functionalities.find((x) => x.id === funcId);
        if (!func) return;
        if (!byModule[func.module_id]) byModule[func.module_id] = [];
        byModule[func.module_id].push(funcId);
      });

      assignedModuleIds.forEach((modId) => {
        if (!byModule[modId]) byModule[modId] = [];
      });

      await axiosInstance.delete(`/add-rights/group/${selectedGroup.id}`);
      for (const [moduleId, funcIds] of Object.entries(byModule)) {
        if (funcIds.length > 0) {
          await axiosInstance.post("/add-rights", {
            group: selectedGroup.id,
            module: Number(moduleId),
            functionalities: funcIds,
          });
        }
      }
      toast.success(`Permissions updated for "${selectedGroup.group_name}"`);
      onRefresh();
    } catch (err) {
      console.error("Failed to save permissions:", err);
      toast.error("Failed to save permissions");
    } finally {
      setSaving(false);
    }
  }

  function getModuleCheckState(module) {
    const childFuncIds = module.functionalities.map((f) => f.funcId);
    if (childFuncIds.length === 0) return false;
    const checkedCount = childFuncIds.filter((id) =>
      assignedRightIds.has(id),
    ).length;

    if (checkedCount === 0) return false;
    if (checkedCount === childFuncIds.length) return true;
    return "indeterminate";
  }

  // Access Denied for Groups tab
  if (!canReadGroup) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-red-100">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdLock className="text-5xl text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Access Denied
          </h2>
          <p className="text-slate-500 mb-4">
            You don't have permission to manage Groups.
          </p>
          <div className="bg-slate-50 rounded-lg p-3 text-left">
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
              Required Permission:
            </p>
            <p className="text-[12px] font-mono text-slate-700">Read Groups</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-[calc(106vh-280px)]">
      {/* Groups Sidebar */}
      <div className="w-64 flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-[12px] font-bold text-slate-700 uppercase tracking-wide">
            Groups
          </span>
          {canCreateGroup && (
            <button
              onClick={() => {
                setGroupModal("add");
                setGroupNameInput("");
                setEditingGroup(null);
              }}
              className="flex items-center justify-center h-6 w-6 rounded-md bg-teal-600 text-white hover:bg-teal-700 transition text-[20px] font-normal leading-none pb-[2px] shadow-sm"
              title="Add new group"
            >
              +
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {groups.map((g) => (
            <div
              key={g.id}
              className={`group relative flex items-center border-l-4 transition-all ${
                selectedGroup?.id === g.id
                  ? "bg-teal-50 border-teal-500"
                  : "border-transparent hover:bg-slate-50"
              }`}
            >
              <button
                onClick={() => {
                  setSelectedGroup(g);
                  setExpandedGroupActions(null);
                }}
                className="flex-1 text-left px-4 py-3 min-w-0"
              >
                <p
                  className={`text-[13px] font-bold truncate ${selectedGroup?.id === g.id ? "text-teal-700" : "text-slate-700"}`}
                >
                  {g.group_name}
                </p>
                <p className="text-[9px] opacity-50 uppercase tracking-widest mt-0.5 truncate">
                  {(g.users || []).length} users
                </p>
              </button>

              {hasGroupActions && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedGroupActions((prev) =>
                      prev === g.id ? null : g.id,
                    );
                  }}
                  className={`shrink-0 mr-2 p-1 rounded transition text-[11px] font-bold ${
                    expandedGroupActions === g.id
                      ? "bg-slate-200 text-slate-700"
                      : "text-slate-300 hover:text-slate-500 hover:bg-slate-100"
                  }`}
                  title="Group actions"
                >
                  <svg
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${expandedGroupActions === g.id ? "rotate-90" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}

              <AnimatePresence>
                {hasGroupActions && expandedGroupActions === g.id && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white border border-slate-200 rounded-lg shadow-lg px-1.5 py-1 z-10"
                  >
                    {canAssignUsers && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openGroupUsersModal(g);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Add/remove users in this group"
                        >
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                            />
                          </svg>
                          Users
                        </button>
                        <div className="w-px h-4 bg-slate-200" />
                      </>
                    )}

                    {canUpdateGroup && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGroup(g);
                            setGroupNameInput(g.group_name);
                            setGroupModal("edit");
                            setExpandedGroupActions(null);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-teal-700 hover:bg-teal-50 rounded transition"
                          title="Edit group"
                        >
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z"
                            />
                          </svg>
                          Edit
                        </button>
                        <div className="w-px h-4 bg-slate-200" />
                      </>
                    )}

                    {canDeleteGroup && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGroupDelete(g);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 rounded transition"
                        title="Delete group"
                      >
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Delete
                      </button>
                    )}
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
            onClick={() => {
              setGroupModal(null);
              setGroupNameInput("");
              setEditingGroup(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-teal-100">
                    <MdPeople className="h-4 w-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-slate-800">
                      {groupModal === "edit" ? "Edit Group" : "New Group"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {groupModal === "edit"
                        ? `Editing: ${editingGroup?.group_name}`
                        : "Create a new access group"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setGroupModal(null);
                    setGroupNameInput("");
                    setEditingGroup(null);
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                >
                  <MdClose className="h-4 w-4" />
                </button>
              </div>

              <div className="px-5 py-5 space-y-4">
                {groupModal === "edit" && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Group ID
                    </label>
                    <input
                      type="text"
                      value={`#${String(editingGroup?.id || "").padStart(4, "0")}`}
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
                    onChange={(e) => setGroupNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleGroupSubmit();
                      if (e.key === "Escape") {
                        setGroupModal(null);
                        setGroupNameInput("");
                      }
                    }}
                    placeholder="e.g. System Administrators"
                    autoFocus
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50/30">
                <button
                  onClick={() => {
                    setGroupModal(null);
                    setGroupNameInput("");
                    setEditingGroup(null);
                  }}
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
                  {groupSubmitting
                    ? "Saving..."
                    : groupModal === "edit"
                      ? "Update Group"
                      : "Create Group"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {groupUsersModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setGroupUsersModal(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm mx-4 overflow-hidden flex flex-col max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-100">
                    <MdPeople className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-slate-800">
                      Manage Users
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Group:{" "}
                      <span className="font-bold text-blue-600">
                        {groupUsersModal?.group_name}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setGroupUsersModal(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                >
                  <MdClose className="h-4 w-4" />
                </button>
              </div>

              <div className="px-4 pt-3 pb-2 shrink-0">
                <div className="relative">
                  <MdSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 text-[12px] rounded-lg border border-slate-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 px-0.5">
                  {groupUserIds.length} user
                  {groupUserIds.length !== 1 ? "s" : ""} selected
                </p>
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-0.5">
                {(allUsers || [])
                  .filter((u) => {
                    const q = userSearch.toLowerCase();
                    return (
                      !q ||
                      (u.username || u.name || "").toLowerCase().includes(q) ||
                      (u.email || "").toLowerCase().includes(q)
                    );
                  })
                  .map((user) => {
                    const uid = String(user.id);
                    const checked = groupUserIds.includes(uid);
                    return (
                      <label
                        key={user.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors border ${
                          checked
                            ? "bg-blue-50 border-blue-100"
                            : "hover:bg-slate-50 border-transparent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setGroupUserIds((prev) =>
                              prev.includes(uid)
                                ? prev.filter((x) => x !== uid)
                                : [...prev, uid],
                            )
                          }
                          className="h-3.5 w-3.5 rounded accent-blue-600 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-slate-800 truncate">
                            {user.username || user.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {user.email || "No email"}
                          </p>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0 ${
                            user.role === "admin"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {user.role || "user"}
                        </span>
                      </label>
                    );
                  })}
              </div>

              <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50/30 shrink-0">
                <button
                  onClick={() => setGroupUserIds([])}
                  className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold transition"
                >
                  Clear all
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setGroupUsersModal(null)}
                    className="px-4 py-2 text-[12px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveGroupUsers}
                    disabled={savingGroupUsers}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-[12px] font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
                  >
                    <MdSave className="h-3.5 w-3.5" />
                    {savingGroupUsers ? "Saving..." : "Save Users"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Available Permissions */}
      <div className="flex-1 flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
            Available Permissions
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                expandAll(setExpandedAvailable, filteredAvailableTree)
              }
              className="text-[9px] text-teal-600 hover:text-teal-700 font-bold hover:bg-teal-50 px-2 py-1 rounded transition uppercase tracking-wide"
            >
              Expand All
            </button>
            <button
              onClick={() => collapseAll(setExpandedAvailable)}
              className="text-[9px] text-slate-400 hover:text-slate-600 font-bold hover:bg-slate-100 px-2 py-1 rounded transition uppercase tracking-wide"
            >
              Collapse
            </button>
            <div className="relative ml-1">
              <MdSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 h-3 w-3" />
              <input
                type="text"
                placeholder="Search..."
                value={searchAvailable}
                onChange={(e) => setSearchAvailable(e.target.value)}
                className="pl-6 pr-2 py-1 text-[10px] rounded border border-slate-200 outline-none focus:border-teal-400 w-24 focus:w-36 transition-all bg-white"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {filteredAvailableTree.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 py-12">
              <MdShield className="h-8 w-8 mb-2" />
              <p className="text-[11px]">No permissions available</p>
            </div>
          ) : (
            filteredAvailableTree.map((category, catIdx) => {
              const isCatExpanded = expandedAvailable.has(category.id);
              const catAssignedCount = category.children.reduce(
                (acc, mod) =>
                  acc +
                  mod.functionalities.filter((f) =>
                    assignedRightIds.has(f.funcId),
                  ).length,
                0,
              );
              const catTotalCount = category.children.reduce(
                (acc, mod) => acc + mod.functionalities.length,
                0,
              );

              return (
                <div key={category.id}>
                  <button
                    onClick={() =>
                      toggleExpand(setExpandedAvailable, category.id)
                    }
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-50 transition-colors group"
                  >
                    <svg
                      className={`h-3 w-3 text-slate-400 shrink-0 transition-transform duration-150 ${isCatExpanded ? "rotate-90" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span className="shrink-0">{category.icon}</span>
                    <span className="flex-1 text-left text-[12px] font-bold text-slate-700 truncate">
                      {category.name}
                    </span>
                    {catTotalCount > 0 && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 mr-1 ${
                          catAssignedCount === catTotalCount &&
                          catTotalCount > 0
                            ? "bg-emerald-100 text-emerald-700"
                            : catAssignedCount > 0
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {catAssignedCount}/{catTotalCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {isCatExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        {category.children.map((module, modIdx) => {
                          const isModExpanded = expandedAvailable.has(
                            module.id,
                          );
                          const checkState = getModuleCheckState(module);
                          const modTotal = module.functionalities.length;
                          const modAssigned = module.functionalities.filter(
                            (f) => assignedRightIds.has(f.funcId),
                          ).length;
                          const isLastMod =
                            modIdx === category.children.length - 1;

                          return (
                            <div key={module.id} className="relative">
                              <div
                                className="absolute left-[18px] top-0 bottom-0 w-px bg-slate-200"
                                style={{ bottom: isLastMod ? "50%" : 0 }}
                              />
                              <div className="absolute left-[18px] top-1/2 w-2.5 h-px bg-slate-200" />

                              <div
                                className={`flex items-center gap-1.5 pl-8 pr-2 py-1.5 hover:bg-slate-50/80 transition-colors ${module.isPlanned ? "opacity-50" : ""}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checkState === true}
                                  ref={(el) => {
                                    if (el)
                                      el.indeterminate =
                                        checkState === "indeterminate";
                                  }}
                                  onChange={() =>
                                    !module.isPlanned && toggleModule(module)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded accent-teal-600 cursor-pointer h-3 w-3 shrink-0"
                                  disabled={module.isPlanned || !canAssignPermissions}
                                />
                                {!module.isPlanned && modTotal > 0 ? (
                                  <button
                                    onClick={() =>
                                      toggleExpand(
                                        setExpandedAvailable,
                                        module.id,
                                      )
                                    }
                                    className="shrink-0"
                                    disabled={!canAssignPermissions}
                                  >
                                    <svg
                                      className={`h-3 w-3 text-slate-400 transition-transform duration-150 ${isModExpanded ? "rotate-90" : ""}`}
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={3}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 5l7 7-7 7"
                                      />
                                    </svg>
                                  </button>
                                ) : (
                                  <span className="w-3 shrink-0" />
                                )}
                                <span className="text-slate-400 shrink-0">
                                  {module.icon}
                                </span>
                                <button
                                  onClick={() =>
                                    !module.isPlanned &&
                                    modTotal > 0 &&
                                    toggleExpand(
                                      setExpandedAvailable,
                                      module.id,
                                    )
                                  }
                                  className="flex-1 text-left min-w-0"
                                  disabled={module.isPlanned || !canAssignPermissions}
                                >
                                  <span className="text-[11px] font-semibold text-slate-700 truncate block">
                                    {module.name}
                                    {module.isPlanned && (
                                      <span className="ml-1.5 text-[8px] bg-slate-100 text-slate-400 font-normal px-1 py-0.5 rounded-full">
                                        soon
                                      </span>
                                    )}
                                  </span>
                                </button>
                                {modTotal > 0 && (
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                      modAssigned === modTotal
                                        ? "bg-emerald-100 text-emerald-700"
                                        : modAssigned > 0
                                          ? "bg-amber-100 text-amber-700"
                                          : "bg-slate-100 text-slate-400"
                                    }`}
                                  >
                                    {modAssigned}/{modTotal}
                                  </span>
                                )}
                              </div>

                              {!module.isPlanned && modTotal > 0 && (
                                <AnimatePresence initial={false}>
                                  {isModExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{
                                        duration: 0.15,
                                        ease: "easeInOut",
                                      }}
                                      className="overflow-hidden"
                                    >
                                      {module.functionalities.map(
                                        (func, funcIdx) => {
                                          const isLastFunc =
                                            funcIdx ===
                                            module.functionalities.length - 1;
                                          const isChecked =
                                            assignedRightIds.has(func.funcId);

                                          return (
                                            <div
                                              key={func.id}
                                              className="relative"
                                            >
                                              <div
                                                className="absolute left-[34px] top-0 w-px bg-slate-200"
                                                style={{
                                                  bottom: isLastFunc
                                                    ? "50%"
                                                    : 0,
                                                }}
                                              />
                                              <div className="absolute left-[34px] top-1/2 w-2.5 h-px bg-slate-200" />

                                              <div
                                                className={`flex items-center gap-1.5 pl-12 pr-2 py-1 cursor-pointer transition-colors rounded-sm mx-1 ${
                                                  isChecked
                                                    ? "bg-teal-50/60 hover:bg-teal-50"
                                                    : "hover:bg-slate-50"
                                                }`}
                                                onClick={() =>
                                                  canAssignPermissions && toggleFunctionality(
                                                    func,
                                                    module.moduleId,
                                                  )
                                                }
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={isChecked}
                                                  onChange={() =>
                                                    canAssignPermissions && toggleFunctionality(
                                                      func,
                                                      module.moduleId,
                                                    )
                                                  }
                                                  onClick={(e) =>
                                                    e.stopPropagation()
                                                  }
                                                  className="rounded accent-teal-600 cursor-pointer h-3 w-3 shrink-0"
                                                  disabled={!canAssignPermissions}
                                                />
                                                <span
                                                  className={`text-[10px] flex-1 truncate ${isChecked ? "text-teal-700 font-medium" : "text-slate-500"}`}
                                                >
                                                  {func.name}
                                                </span>
                                                {func.action && (
                                                  <ActionBadge
                                                    action={func.action}
                                                  />
                                                )}
                                              </div>
                                            </div>
                                          );
                                        },
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              )}

                              {module.isPlanned && (
                                <div className="pl-12 pr-2 py-1">
                                  <p className="text-[9px] text-slate-400 italic flex items-center gap-1">
                                    <MdSettings className="h-3 w-3" />
                                    Available when module is deployed
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Assigned to Group Panel - UPDATED: Hide Save button and trashcans when user has only READ permission */}
      <div className="flex-1 flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-[12px] font-bold text-teal-700 uppercase tracking-wide">
            Assigned to Group
          </span>
          {/* Save button - Only show if user has permission to assign permissions */}
          {canAssignPermissions && (
            <button
              onClick={handleSave}
              disabled={saving || !selectedGroup}
              className="flex items-center gap-2 px-3 py-1 bg-teal-600 text-white rounded-lg text-[11px] font-bold hover:bg-teal-700 transition disabled:opacity-50"
            >
              <MdSave className="h-3 w-3" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>

        <div className="px-4 py-2 border-b border-slate-50">
          <div className="relative">
            <MdSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search assigned..."
              value={searchAssigned}
              onChange={(e) => setSearchAssigned(e.target.value)}
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
              <p className="text-[10px] text-slate-400 mt-1">
                Check items from the left panel
              </p>
            </div>
          ) : (
            filteredAssignedTree.map((category) => {
              const isCategoryExpanded = expandedAssigned.has(category.id);

              return (
                <div
                  key={category.id}
                  className="rounded-lg border border-teal-100 overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-teal-50/50 hover:bg-teal-50 transition-colors">
                    <button
                      onClick={() =>
                        toggleExpand(setExpandedAssigned, category.id)
                      }
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    >
                      {category.icon}
                      <span className="text-[11px] font-bold text-teal-800 flex-1 truncate">
                        {category.name}
                      </span>
                      <span className="text-[9px] bg-teal-200 text-teal-800 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                        {category.children.length}
                      </span>
                      {isCategoryExpanded ? (
                        <MdExpandLess className="text-teal-400 h-5 w-5 shrink-0" />
                      ) : (
                        <MdExpandMore className="text-teal-400 h-5 w-5 shrink-0" />
                      )}
                    </button>
                    {/* Category-level trashcan - Only show if user has permission to assign permissions */}
                    {canAssignPermissions && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          category.children.forEach((mod) => removeModule(mod));
                        }}
                        className="shrink-0 ml-1 p-1 rounded-md text-rose-300 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Remove all permissions in this category"
                      >
                        <MdDelete className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

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
                          {category.children.map((module) => {
                            const isModuleExpanded = expandedAssigned.has(
                              module.id,
                            );

                            return (
                              <div
                                key={module.id}
                                className="border-b border-teal-50 last:border-0"
                              >
                                <div className="flex items-center pl-8 pr-2 py-2 hover:bg-teal-50/30 transition-colors group">
                                  <button
                                    onClick={() =>
                                      toggleExpand(
                                        setExpandedAssigned,
                                        module.id,
                                      )
                                    }
                                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                                  >
                                    <MdCheck className="text-emerald-500 h-3 w-3 shrink-0" />
                                    <span className="text-[11px] font-medium text-slate-700 flex-1 truncate">
                                      {module.name}
                                    </span>
                                    <span className="text-[9px] bg-teal-100 text-teal-700 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                      {module.functionalities.length}
                                    </span>
                                    {isModuleExpanded ? (
                                      <MdExpandLess className="text-slate-400 h-4 w-4 shrink-0" />
                                    ) : (
                                      <MdExpandMore className="text-slate-400 h-4 w-4 shrink-0" />
                                    )}
                                  </button>

                                  {/* Module-level trashcan - Only show if user has permission to assign permissions */}
                                  {canAssignPermissions && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeModule(module);
                                      }}
                                      className="shrink-0 ml-1 p-1 rounded-md text-rose-300 hover:text-rose-600 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100"
                                      title={`Remove all ${module.name} permissions`}
                                    >
                                      <MdDelete className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>

                                <AnimatePresence initial={false}>
                                  {isModuleExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{
                                        duration: 0.15,
                                        ease: "easeInOut",
                                      }}
                                      className="overflow-hidden"
                                    >
                                      <div className="pl-14 pr-2 py-1 bg-slate-50/30">
                                        {module.functionalities.map((func) => (
                                          <div
                                            key={func.id}
                                            className="flex items-center gap-2 py-1.5 group/func hover:bg-rose-50/40 rounded transition-colors px-1"
                                          >
                                            <MdCheck className="text-emerald-400 h-2.5 w-2.5 shrink-0" />
                                            <span className="text-[10px] text-slate-600 flex-1">
                                              {func.name}
                                            </span>
                                            {func.action && (
                                              <ActionBadge
                                                action={func.action}
                                              />
                                            )}

                                            {/* Functionality-level trashcan - Only show if user has permission to assign permissions */}
                                            {canAssignPermissions && (
                                              <button
                                                onClick={() =>
                                                  removeFunctionality(func)
                                                }
                                                className="shrink-0 p-0.5 rounded text-rose-300 hover:text-rose-600 hover:bg-rose-100 transition opacity-0 group-hover/func:opacity-100"
                                                title={`Remove "${func.name}"`}
                                              >
                                                <MdClose className="h-3 w-3" />
                                              </button>
                                            )}
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
// USERS TAB - with Permission-based controls
// ═══════════════════════════════════════════════════════════════════════════════
function UsersTab({ groups, allUsers, onRefresh }) {
  const { canCreate, canRead, canUpdate, canDelete, isAdmin } =
    usePermissions();
  const MODULE_NAME = "User";

  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [userModal, setUserModal] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState(emptyUserForm());
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [expandedUserActions, setExpandedUserActions] = useState(null);

  // Permission checks
  const canCreateUser = isAdmin || canCreate(MODULE_NAME);
  const canReadUser = isAdmin || canRead(MODULE_NAME);
  const canUpdateUser = isAdmin || canUpdate(MODULE_NAME);
  const canDeleteUser = isAdmin || canDelete(MODULE_NAME);
  const canAssignToGroup = isAdmin || canUpdate(MODULE_NAME);
  const hasUserActions = canUpdateUser || canDeleteUser;

  function emptyUserForm() {
    return {
      username: "",
      email: "",
      password: "",
      role: "user",
      group_id: "",
      status: "active",
    };
  }

  function openAddModal() {
    if (!canCreateUser) {
      toast.error("You don't have permission to create users.");
      return;
    }
    setEditingUser(null);
    setUserForm(emptyUserForm());
    setUserModal("add");
  }

  function openEditModal(user) {
    if (!canUpdateUser) {
      toast.error("You don't have permission to edit users.");
      return;
    }
    setEditingUser(user);
    setUserForm({
      username: user.username || user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "user",
      group_id: user.group_id || "",
      status: user.status || "active",
    });
    setUserModal("edit");
    setExpandedUserActions(null);
  }

  function closeUserModal() {
    setUserModal(null);
    setEditingUser(null);
    setUserForm(emptyUserForm());
  }

  async function handleUserSubmit() {
    if (!userForm.username.trim() || !userForm.email.trim()) {
      toast.error("Username and email are required.");
      return;
    }
    if (userModal === "add" && !userForm.password.trim()) {
      toast.error("Password is required for new users.");
      return;
    }
    setUserSubmitting(true);
    try {
      const payload = {
        name: userForm.username.trim(),
        username: userForm.username.trim(),
        email: userForm.email.trim(),
        role: userForm.role,
        group_id: userForm.group_id,
        status: userForm.status,
      };
      if (userForm.password) payload.password = userForm.password;

      if (userModal === "edit" && editingUser) {
        await axiosInstance.put(`/auth/users/${editingUser.id}`, payload);
        toast.success("User updated successfully.");
      } else {
        await axiosInstance.post("/auth/users", payload);
        toast.success("User created successfully.");
      }
      closeUserModal();
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save user.");
    } finally {
      setUserSubmitting(false);
    }
  }

  async function handleUserDelete(user) {
    if (!canDeleteUser) {
      toast.error("You don't have permission to delete users.");
      return;
    }
    if (
      !window.confirm(
        `Delete "${user.username || user.name}"? This cannot be undone.`,
      )
    )
      return;
    try {
      await axiosInstance.delete(`/auth/users/${user.id}`);
      toast.success("User deleted.");
      setExpandedUserActions(null);
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete user.");
    }
  }

  const selectedGroup = groups.find(
    (g) => String(g.id) === String(selectedGroupId),
  );

  function handleGroupChange(id) {
    setSelectedGroupId(id);
    const g = groups.find((x) => String(x.id) === String(id));
    setSelectedUserIds((g?.users || []).map((u) => String(u.id)));
  }

  function toggleUser(uid) {
    const id = String(uid);
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const uniqueUsers = Array.from(
      new Map(allUsers.map((u) => [u.id, u])).values(),
    );
    return uniqueUsers.filter(
      (u) =>
        !q ||
        (u.username || u.name)?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q),
    );
  }, [allUsers, search]);

  async function handleSave() {
    if (!canAssignToGroup) {
      toast.error("You don't have permission to assign users to groups.");
      return;
    }
    if (!selectedGroupId) {
      toast.error("Select a group first");
      return;
    }
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

  const allAssignments = useMemo(
    () =>
      groups.flatMap((g) =>
        (g.users || []).map((u) => ({
          groupId: g.id,
          groupName: g.group_name,
          userId: u.id,
          username: u.username || u.name,
          email: u.email,
        })),
      ),
    [groups],
  );

  async function removeAssignment(groupId, userId) {
    if (!canAssignToGroup) {
      toast.error("You don't have permission to remove users from groups.");
      return;
    }
    if (!window.confirm("Remove this user from the group?")) return;
    try {
      await axiosInstance.delete(`/group-users/${groupId}/user/${userId}`);
      toast.success("User removed");
      onRefresh();
    } catch (err) {
      toast.error("Failed to remove user");
    }
  }

  const inputCls =
    "w-full h-9 px-3 rounded-lg border border-slate-300 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition bg-white";

  // Access Denied for Users tab
  if (!canReadUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-red-100">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdLock className="text-5xl text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Access Denied
          </h2>
          <p className="text-slate-500 mb-4">
            You don't have permission to manage Users.
          </p>
          <div className="bg-slate-50 rounded-lg p-3 text-left">
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
              Required Permission:
            </p>
            <p className="text-[12px] font-mono text-slate-700">Read Users</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left card: Assign Users */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[600px]">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-black text-slate-800 uppercase tracking-tight">
                Assign Users
              </h3>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Add or remove users from the selected group.
              </p>
            </div>
            {canCreateUser && (
              <button
                onClick={openAddModal}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-[11px] font-bold hover:bg-teal-700 transition shadow-sm"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create User
              </button>
            )}
          </div>

          <div className="p-4 border-b border-slate-50 space-y-4">
            <div className="flex gap-3">
              <select
                value={selectedGroupId}
                onChange={(e) => handleGroupChange(e.target.value)}
                className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-[13px] outline-none focus:border-teal-500 transition-all bg-white"
              >
                <option value="">— Select a Group —</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.group_name} ({(g.users || []).length} users)
                  </option>
                ))}
              </select>
              {canAssignToGroup && (
                <button
                  onClick={handleSave}
                  disabled={!selectedGroupId || saving}
                  className="px-4 py-2 bg-teal-600 text-white rounded-xl text-[13px] font-bold hover:bg-teal-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  <MdSave className="h-4 w-4" />
                  {saving ? "Saving..." : "Save"}
                </button>
              )}
            </div>
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-[13px] rounded-xl border border-slate-200 outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {filtered.map((user) => {
              const uid = String(user.id);
              const checked = selectedUserIds.includes(uid);
              const isActionsOpen = expandedUserActions === user.id;

              return (
                <div
                  key={user.id}
                  className={`relative flex items-center rounded-xl mb-0.5 border transition-colors ${
                    checked
                      ? "bg-teal-50 border-teal-100"
                      : "hover:bg-slate-50 border-transparent"
                  }`}
                >
                  <label className="flex items-center gap-3 flex-1 p-3 cursor-pointer min-w-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleUser(uid)}
                      className="h-4 w-4 rounded accent-teal-600 shrink-0"
                      disabled={!canAssignToGroup}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-800 truncate">
                        {user.username || user.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {user.email || "No email"}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0 ${
                        user.role === "admin"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-teal-100 text-teal-700"
                      }`}
                    >
                      {user.role || "user"}
                    </span>
                  </label>

                  {hasUserActions && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedUserActions((prev) =>
                          prev === user.id ? null : user.id,
                        );
                      }}
                      className={`shrink-0 mr-2 p-1 rounded transition text-[11px] font-bold ${
                        isActionsOpen
                          ? "bg-slate-200 text-slate-700"
                          : "text-slate-300 hover:text-slate-500 hover:bg-slate-100"
                      }`}
                      title="User actions"
                    >
                      <svg
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${isActionsOpen ? "rotate-90" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  )}

                  <AnimatePresence>
                    {hasUserActions && isActionsOpen && (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white border border-slate-200 rounded-lg shadow-lg px-1.5 py-1 z-10"
                      >
                        {canUpdateUser && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(user);
                              }}
                              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-teal-700 hover:bg-teal-50 rounded transition"
                              title="Edit user"
                            >
                              <svg
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z"
                                />
                              </svg>
                              Edit
                            </button>
                            <div className="w-px h-4 bg-slate-200" />
                          </>
                        )}
                        {canDeleteUser && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUserDelete(user);
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Delete user"
                          >
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right card: Active Assignments */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[600px]">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[15px] font-black text-slate-800 uppercase tracking-tight">
              Active Assignments
            </h3>
            <p className="text-[12px] text-slate-500">
              Current group memberships across the system.
            </p>
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
                {allAssignments.map((a) => (
                  <tr
                    key={`${a.groupId}-${a.userId}`}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <p className="text-[13px] font-bold text-slate-700">
                        {a.username}
                      </p>
                      <p className="text-[10px] text-slate-400">{a.email}</p>
                    </td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-black uppercase">
                        {a.groupName}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      {canAssignToGroup && (
                        <button
                          onClick={() => removeAssignment(a.groupId, a.userId)}
                          className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <MdDelete className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit User Modal */}
      <AnimatePresence>
        {userModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={closeUserModal}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-teal-100">
                    <MdPerson className="h-4 w-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-slate-800">
                      {userModal === "edit" ? "Edit User" : "New User"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {userModal === "edit"
                        ? `Editing: ${editingUser?.username || editingUser?.name}`
                        : "Create a new system user"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeUserModal}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                >
                  <MdClose className="h-4 w-4" />
                </button>
              </div>

              <div className="px-5 py-5 space-y-3">
                {userModal === "edit" && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      User ID
                    </label>
                    <input
                      type="text"
                      value={`USR-${String(editingUser?.id || "").padStart(4, "0")}`}
                      disabled
                      className="w-full h-9 px-3 rounded-lg border border-slate-100 bg-slate-50 text-[12px] font-mono text-slate-400"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Username <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) =>
                      setUserForm((p) => ({ ...p, username: e.target.value }))
                    }
                    placeholder="e.g. john.doe"
                    autoFocus
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) =>
                      setUserForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="e.g. john@company.com"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Password{" "}
                    {userModal === "add" && (
                      <span className="text-rose-400">*</span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm((p) => ({ ...p, password: e.target.value }))
                    }
                    placeholder={
                      userModal === "edit" ? "Leave blank to keep current" : ""
                    }
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Role
                    </label>
                    <select
                      value={userForm.role}
                      onChange={(e) =>
                        setUserForm((p) => ({ ...p, role: e.target.value }))
                      }
                      className={inputCls}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Status
                    </label>
                    <select
                      value={userForm.status}
                      onChange={(e) =>
                        setUserForm((p) => ({ ...p, status: e.target.value }))
                      }
                      className={inputCls}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Security Group
                  </label>
                  <select
                    value={userForm.group_id}
                    onChange={(e) =>
                      setUserForm((p) => ({ ...p, group_id: e.target.value }))
                    }
                    className={inputCls}
                  >
                    <option value="">No Group</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.group_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50/30">
                <button
                  onClick={closeUserModal}
                  className="px-4 py-2 text-[12px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUserSubmit}
                  disabled={
                    userSubmitting ||
                    !userForm.username.trim() ||
                    !userForm.email.trim()
                  }
                  className="flex items-center gap-2 px-5 py-2 bg-teal-600 text-white rounded-lg text-[12px] font-bold hover:bg-teal-700 transition disabled:opacity-50 shadow-sm"
                >
                  <MdSave className="h-3.5 w-3.5" />
                  {userSubmitting
                    ? "Saving..."
                    : userModal === "edit"
                      ? "Update User"
                      : "Create User"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERMISSIONS CATALOG TAB - with Permission-based controls
// ═══════════════════════════════════════════════════════════════════════════════
function PermissionsTab({ modules, functionalities, onRefresh }) {
  const { canCreate, canRead, canUpdate, canDelete, isAdmin } =
    usePermissions();
  const MODULE_CRUD_NAME = "Module";
  const PERMISSION_NAME = "Permission";

  const [search, setSearch] = useState("");
  const [expandedModules, setExpandedModules] = useState(new Set());

  const [moduleModal, setModuleModal] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [moduleForm, setModuleForm] = useState({
    moduleName: "",
    description: "",
  });
  const [moduleSubmitting, setModuleSubmitting] = useState(false);

  const [funcModal, setFuncModal] = useState(null);
  const [funcTargetModule, setFuncTargetModule] = useState(null);
  const [editingFunc, setEditingFunc] = useState(null);
  const [funcForm, setFuncForm] = useState({ name: "" });
  const [funcSubmitting, setFuncSubmitting] = useState(false);

  const [openFuncMenu, setOpenFuncMenu] = useState(null);

  // Permission checks
  const canCreateModule = isAdmin || canCreate(MODULE_CRUD_NAME);
  const canReadModule = isAdmin || canRead(MODULE_CRUD_NAME);
  const canUpdateModule = isAdmin || canUpdate(MODULE_CRUD_NAME);
  const canDeleteModule = isAdmin || canDelete(MODULE_CRUD_NAME);

  const canCreatePermission = isAdmin || canCreate(PERMISSION_NAME);
  const canUpdatePermission = isAdmin || canUpdate(PERMISSION_NAME);
  const canDeletePermission = isAdmin || canDelete(PERMISSION_NAME);

  useEffect(() => {
    if (!openFuncMenu) return;
    function handler() {
      setOpenFuncMenu(null);
    }
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [openFuncMenu]);

  const grouped = useMemo(() => {
    const q = search.toLowerCase();
    return modules
      .map((m) => ({
        ...m,
        funcs: functionalities.filter(
          (f) =>
            f.module_id === m.id &&
            (!q ||
              f.name.toLowerCase().includes(q) ||
              m.module_name.toLowerCase().includes(q)),
        ),
      }))
      .filter((m) => m.funcs.length > 0 || !q);
  }, [modules, functionalities, search]);

  function inferAction(name) {
    const n = name.toUpperCase();
    if (n.includes("CREATE")) return "CREATE";
    if (n.includes("DELETE") || n.includes("REMOVE")) return "DELETE";
    if (n.includes("UPDATE") || n.includes("EDIT")) return "UPDATE";
    if (n.includes("READ") || n.includes("VIEW") || n.includes("GET"))
      return "READ";
    if (n.includes("PRINT")) return "PRINT";
    return null;
  }

  function toggleModule(moduleId) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
      return next;
    });
  }

  function expandAll() {
    setExpandedModules(new Set(grouped.map((m) => m.id)));
  }

  function collapseAll() {
    setExpandedModules(new Set());
  }

  function openAddModule() {
    if (!canCreateModule) {
      toast.error("You don't have permission to create modules.");
      return;
    }
    setEditingModule(null);
    setModuleForm({ moduleName: "", description: "" });
    setModuleModal("add");
  }

  function openEditModule(mod, e) {
    if (!canUpdateModule) {
      toast.error("You don't have permission to edit modules.");
      return;
    }
    e.stopPropagation();
    setEditingModule(mod);
    setModuleForm({
      moduleName: mod.module_name || "",
      description: mod.description || "",
    });
    setModuleModal("edit");
  }

  function closeModuleModal() {
    setModuleModal(null);
    setEditingModule(null);
    setModuleForm({ moduleName: "", description: "" });
  }

  async function handleModuleSubmit() {
    if (!moduleForm.moduleName.trim()) {
      toast.error("Module name is required.");
      return;
    }
    setModuleSubmitting(true);
    try {
      const payload = {
        moduleName: moduleForm.moduleName.trim(),
        description: moduleForm.description.trim(),
      };
      if (moduleModal === "edit" && editingModule) {
        await axiosInstance.put(`/modules/${editingModule.id}`, payload);
        toast.success("Module updated successfully.");
      } else {
        await axiosInstance.post("/modules", payload);
        toast.success("Module created successfully.");
      }
      closeModuleModal();
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Unable to save module.");
    } finally {
      setModuleSubmitting(false);
    }
  }

  async function handleModuleDelete(mod, e) {
    if (!canDeleteModule) {
      toast.error("You don't have permission to delete modules.");
      return;
    }
    e.stopPropagation();
    if (
      !window.confirm(
        `Delete module "${mod.module_name}"?\nAll its permissions will also be removed.`,
      )
    )
      return;
    try {
      await axiosInstance.delete(`/modules/${mod.id}`);
      toast.success("Module deleted successfully.");
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Unable to delete module.");
    }
  }

  function openAddFunc(mod, e) {
    if (!canCreatePermission) {
      toast.error("You don't have permission to create permissions.");
      return;
    }
    e.stopPropagation();
    setFuncTargetModule(mod);
    setEditingFunc(null);
    setFuncForm({ name: "" });
    setFuncModal("add");
  }

  function openEditFunc(func, parentModule) {
    if (!canUpdatePermission) {
      toast.error("You don't have permission to edit permissions.");
      return;
    }
    setFuncTargetModule(parentModule);
    setEditingFunc(func);
    setFuncForm({ name: func.name || "" });
    setFuncModal("edit");
    setOpenFuncMenu(null);
  }

  function closeFuncModal() {
    setFuncModal(null);
    setEditingFunc(null);
    setFuncTargetModule(null);
    setFuncForm({ name: "" });
  }

  async function handleFuncSubmit() {
    if (!funcForm.name.trim()) {
      toast.error("Permission name is required.");
      return;
    }
    setFuncSubmitting(true);
    try {
      const payload = {
        moduleId: Number(funcTargetModule.id),
        name: funcForm.name.trim(),
      };
      if (funcModal === "edit" && editingFunc) {
        await axiosInstance.put(`/functionalities/${editingFunc.id}`, payload);
        toast.success("Permission updated successfully.");
      } else {
        await axiosInstance.post("/functionalities", payload);
        toast.success("Permission created successfully.");
      }
      closeFuncModal();
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Unable to save permission.");
    } finally {
      setFuncSubmitting(false);
    }
  }

  async function handleFuncDelete(func) {
    if (!canDeletePermission) {
      toast.error("You don't have permission to delete permissions.");
      return;
    }
    if (!window.confirm(`Delete permission "${func.name}"?`)) return;
    setOpenFuncMenu(null);
    try {
      await axiosInstance.delete(`/functionalities/${func.id}`);
      toast.success("Permission deleted successfully.");
      onRefresh();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Unable to delete permission.",
      );
    }
  }

  const inputCls =
    "w-full h-9 px-3 rounded-lg border border-slate-300 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition bg-white";

  // Access Denied for Permissions tab
  if (!canReadModule) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-red-100">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdLock className="text-5xl text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Access Denied
          </h2>
          <p className="text-slate-500 mb-4">
            You don't have permission to view Modules & Permissions.
          </p>
          <div className="bg-slate-50 rounded-lg p-3 text-left">
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
              Required Permission:
            </p>
            <p className="text-[12px] font-mono text-slate-700">Read Modules</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm w-full">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          {canCreateModule && (
            <button
              onClick={openAddModule}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white rounded-lg text-[11px] font-bold hover:bg-teal-700 transition shadow-sm"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Module
            </button>
          )}
          <div className="bg-teal-50 text-teal-700 px-4 py-2 rounded-xl text-[13px] font-bold">
            {functionalities.length} total permissions
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {grouped.length === 0 && search && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-[13px]">
              No modules or permissions match "{search}"
            </p>
          </div>
        )}
        {grouped.map((m) => {
          const isExpanded = expandedModules.has(m.id);
          return (
            <div
              key={m.id}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-full px-5 py-3.5 flex items-center justify-between bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                <button
                  onClick={() => toggleModule(m.id)}
                  className="flex items-center gap-3 flex-1 text-left min-w-0"
                >
                  <MdViewModule className="text-teal-500 h-5 w-5 shrink-0" />
                  <span className="text-[13px] font-black text-slate-800 uppercase tracking-tight truncate">
                    {m.module_name}
                  </span>
                </button>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] bg-teal-100 text-teal-700 font-bold px-2 py-0.5 rounded-full mr-1">
                    {m.funcs.length} PERMS
                  </span>

                  {canCreatePermission && (
                    <button
                      onClick={(e) => openAddFunc(m, e)}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-teal-700 hover:bg-teal-100 rounded-lg transition"
                      title="Add permission to this module"
                    >
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Add Perm
                    </button>
                  )}

                  {canUpdateModule && (
                    <button
                      onClick={(e) => openEditModule(m, e)}
                      className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                      title="Edit module"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z"
                        />
                      </svg>
                    </button>
                  )}

                  {canDeleteModule && (
                    <button
                      onClick={(e) => handleModuleDelete(m, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete module"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}

                  <button onClick={() => toggleModule(m.id)} className="p-1">
                    {isExpanded ? (
                      <MdExpandLess className="text-slate-400 h-5 w-5" />
                    ) : (
                      <MdExpandMore className="text-slate-400 h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    style={{ overflow: m.funcs.some(f => f.id === openFuncMenu) ? "visible" : "hidden" }}
                    className=""
                  >
                    <div className="p-4 space-y-1 border-t border-slate-100">
                      {m.funcs.length === 0 && (
                        <p className="text-[11px] text-slate-400 italic text-center py-3">
                          No permissions yet — click "+ Add Perm" above.
                        </p>
                      )}
                      {m.funcs.map((f, fIdx) => {
                        const action =
                          f.slug?.toUpperCase() || inferAction(f.name);
                        const isMenuOpen = openFuncMenu === f.id;

                        // Open upward for last 2 items to prevent clipping at bottom
                        const totalFuncs = m.funcs.length;
                        const openUpward = totalFuncs > 2 && fIdx >= totalFuncs - 2;

                        let displayName = f.name;
                        const modulePrefix = m.module_name.toUpperCase();
                        const funcUpper = f.name.toUpperCase();
                        if (funcUpper.startsWith(modulePrefix)) {
                          displayName = f.name
                            .substring(modulePrefix.length)
                            .trim();
                        }

                        return (
                          <div
                            key={f.id}
                            className="relative flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors group"
                          >
                            <div className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                            <span className="text-[11px] font-bold text-slate-700 flex-1 truncate">
                              {displayName || f.name}
                            </span>
                            {action && <ActionBadge action={action} />}

                            {(canUpdatePermission || canDeletePermission) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenFuncMenu((prev) =>
                                    prev === f.id ? null : f.id,
                                  );
                                }}
                                className={`shrink-0 p-1 rounded-md transition ${
                                  isMenuOpen
                                    ? "bg-slate-200 text-slate-700"
                                    : "opacity-0 group-hover:opacity-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                                }`}
                              >
                                <svg
                                  className="h-3.5 w-3.5"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <circle cx="5" cy="12" r="1.5" />
                                  <circle cx="12" cy="12" r="1.5" />
                                  <circle cx="19" cy="12" r="1.5" />
                                </svg>
                              </button>
                            )}

                            <AnimatePresence>
                              {isMenuOpen && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.92, y: openUpward ? 4 : -4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.92, y: openUpward ? 4 : -4 }}
                                  transition={{ duration: 0.12 }}
                                  className={`absolute right-0 z-20 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden min-w-[140px] ${openUpward ? "bottom-full mb-1" : "top-full mt-1"}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {canUpdatePermission && (
                                    <>
                                      <button
                                        onClick={() => openEditFunc(f, m)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-teal-700 hover:bg-teal-50 transition"
                                      >
                                        <svg
                                          className="h-3 w-3"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                          strokeWidth={2.5}
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z"
                                          />
                                        </svg>
                                        Edit Permission
                                      </button>
                                      <div className="h-px bg-slate-100" />
                                    </>
                                  )}
                                  {canDeletePermission && (
                                    <button
                                      onClick={() => handleFuncDelete(f)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition"
                                    >
                                      <svg
                                        className="h-3 w-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2.5}
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                      Delete
                                    </button>
                                  )}
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
        })}
      </div>

      {/* Add/Edit Module Modal */}
      <AnimatePresence>
        {moduleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={closeModuleModal}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-teal-100">
                    <MdViewModule className="h-4 w-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-slate-800">
                      {moduleModal === "edit" ? "Edit Module" : "New Module"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {moduleModal === "edit"
                        ? `Editing: ${editingModule?.module_name}`
                        : "Register a new system module"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModuleModal}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                >
                  <MdClose className="h-4 w-4" />
                </button>
              </div>

              <div className="px-5 py-5 space-y-3">
                {moduleModal === "edit" && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Module ID
                    </label>
                    <input
                      type="text"
                      value={`MOD-${String(editingModule?.id || "").padStart(4, "0")}`}
                      disabled
                      className="w-full h-9 px-3 rounded-lg border border-slate-100 bg-slate-50 text-[12px] font-mono text-slate-400"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Module Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={moduleForm.moduleName}
                    onChange={(e) =>
                      setModuleForm((p) => ({
                        ...p,
                        moduleName: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleModuleSubmit();
                      if (e.key === "Escape") closeModuleModal();
                    }}
                    placeholder="e.g. Inventory Management"
                    autoFocus
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    value={moduleForm.description}
                    onChange={(e) =>
                      setModuleForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Define the purpose of this module..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition bg-white resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50/30">
                <button
                  onClick={closeModuleModal}
                  className="px-4 py-2 text-[12px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleModuleSubmit}
                  disabled={moduleSubmitting || !moduleForm.moduleName.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-teal-600 text-white rounded-lg text-[12px] font-bold hover:bg-teal-700 transition disabled:opacity-50 shadow-sm"
                >
                  <MdSave className="h-3.5 w-3.5" />
                  {moduleSubmitting
                    ? "Saving..."
                    : moduleModal === "edit"
                      ? "Update Module"
                      : "Create Module"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Functionality Modal */}
      <AnimatePresence>
        {funcModal && funcTargetModule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={closeFuncModal}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-teal-100">
                    <MdSecurity className="h-4 w-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-slate-800">
                      {funcModal === "edit"
                        ? "Edit Permission"
                        : "New Permission"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Module:{" "}
                      <span className="font-bold text-teal-600">
                        {funcTargetModule.module_name}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeFuncModal}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                >
                  <MdClose className="h-4 w-4" />
                </button>
              </div>

              <div className="px-5 py-5 space-y-3">
                {funcModal === "edit" && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Permission ID
                    </label>
                    <input
                      type="text"
                      value={`FUNC-${String(editingFunc?.id || "").padStart(4, "0")}`}
                      disabled
                      className="w-full h-9 px-3 rounded-lg border border-slate-100 bg-slate-50 text-[12px] font-mono text-slate-400"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Module
                  </label>
                  <input
                    type="text"
                    value={funcTargetModule.module_name || ""}
                    disabled
                    className="w-full h-9 px-3 rounded-lg border border-slate-100 bg-slate-50 text-[12px] text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Function Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={funcForm.name}
                    onChange={(e) =>
                      setFuncForm((p) => ({ ...p, name: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleFuncSubmit();
                      if (e.key === "Escape") closeFuncModal();
                    }}
                    placeholder="e.g. Create Sale Invoice"
                    autoFocus
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50/30">
                <button
                  onClick={closeFuncModal}
                  className="px-4 py-2 text-[12px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFuncSubmit}
                  disabled={funcSubmitting || !funcForm.name.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-teal-600 text-white rounded-lg text-[12px] font-bold hover:bg-teal-700 transition disabled:opacity-50 shadow-sm"
                >
                  <MdSave className="h-3.5 w-3.5" />
                  {funcSubmitting
                    ? "Saving..."
                    : funcModal === "edit"
                      ? "Update Permission"
                      : "Create Permission"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// IP TRACKING TAB - with Permission-based controls
// ═══════════════════════════════════════════════════════════════════════════════
function IPTrackingTab() {
  const { canRead, isAdmin } = usePermissions();
  const MODULE_NAME = "Security Log";

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const canReadLogs = isAdmin || canRead(MODULE_NAME);

  useEffect(() => {
    if (canReadLogs) {
      fetchLogs();
    }
  }, [canReadLogs]);

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

  // Access Denied
  if (!canReadLogs) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-red-100">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdLock className="text-5xl text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Access Denied
          </h2>
          <p className="text-slate-500 mb-4">
            You don't have permission to view Security Logs.
          </p>
          <div className="bg-slate-50 rounded-lg p-3 text-left">
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
              Required Permission:
            </p>
            <p className="text-[12px] font-mono text-slate-700">
              Read Security Logs
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[16px] font-bold text-slate-800">
          Login History & IP Tracking
        </h3>
        <button
          onClick={fetchLogs}
          className="text-teal-600 hover:text-teal-700 p-2 rounded-full hover:bg-teal-50 transition"
        >
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
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-10 text-center text-slate-400"
                >
                  No logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${log.action === "LOGIN_SUCCESS" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                    >
                      {log.action === "LOGIN_SUCCESS" ? "SUCCESS" : "FAILED"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[13px] font-semibold text-slate-700">
                    {log.username || "System"}
                  </td>
                  <td className="px-6 py-4 text-[13px] font-mono text-slate-500">
                    {log.ip_address || "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-[13px] text-slate-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-[12px] text-slate-400 italic">
                    {log.description || "—"}
                  </td>
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
  const { canRead, isAdmin, canAccess, permissions } = usePermissions();
  const [tab, setTab] = useState("groups");
  const [groups, setGroups] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [modules, setModules] = useState([]);
  const [functionalities, setFunctionalities] = useState([]);
  const [loading, setLoading] = useState(false);

  // Check if user can access any of the tabs - Also allow if user has Security module access
  const hasSecurityAccess = isAdmin || canAccess("Security");
  const canReadGroups =
    isAdmin ||
    canRead("Group") ||
    (hasSecurityAccess &&
      permissions?.modules?.some((m) => m.module_name === "Group"));
  const canReadUsers =
    isAdmin ||
    canRead("User") ||
    (hasSecurityAccess &&
      permissions?.modules?.some((m) => m.module_name === "User"));
  const canReadModules =
    isAdmin ||
    canRead("Module") ||
    (hasSecurityAccess &&
      permissions?.modules?.some((m) => m.module_name === "Module"));
  const canReadSecurityLogs =
    isAdmin ||
    canRead("Security Log") ||
    (hasSecurityAccess &&
      permissions?.modules?.some((m) => m.module_name === "Security Log"));

  // Also check if user has any security-related functionalities
  const hasSecurityFunctionality =
    isAdmin ||
    (permissions?.functionalities || []).some((f) =>
      f.name?.toLowerCase().includes("security"),
    );

  // Combined permission - show tabs if user has Security module OR specific read permissions
  const showGroupsTab =
    canReadGroups || (hasSecurityAccess && hasSecurityFunctionality);
  const showUsersTab =
    canReadUsers || (hasSecurityAccess && hasSecurityFunctionality);
  const showPermissionsTab =
    canReadModules || (hasSecurityAccess && hasSecurityFunctionality);
  const showTrackingTab =
    canReadSecurityLogs || (hasSecurityAccess && hasSecurityFunctionality);

  // Debug logging
  useEffect(() => {
    console.log("=== Access Control Permission Debug ===");
    console.log("isAdmin:", isAdmin);
    console.log("hasSecurityAccess:", hasSecurityAccess);
    console.log("hasSecurityFunctionality:", hasSecurityFunctionality);
    console.log("canReadGroups:", canReadGroups);
    console.log("canReadUsers:", canReadUsers);
    console.log("canReadModules:", canReadModules);
    console.log("canReadSecurityLogs:", canReadSecurityLogs);
    console.log("showGroupsTab:", showGroupsTab);
    console.log("showUsersTab:", showUsersTab);
    console.log("showPermissionsTab:", showPermissionsTab);
    console.log("showTrackingTab:", showTrackingTab);
    console.log("Available Modules:", permissions?.modules);
    console.log("Available Functionalities:", permissions?.functionalities);
  }, [
    isAdmin,
    hasSecurityAccess,
    hasSecurityFunctionality,
    canReadGroups,
    canReadUsers,
    canReadModules,
    canReadSecurityLogs,
    permissions,
  ]);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [groupsRes, usersRes, modulesRes, funcsRes] = await Promise.all([
        axiosInstance.get("/group-users"),
        axiosInstance
          .get("/auth/users")
          .catch(() => axiosInstance.get("/company-users")),
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

  // If user has no access to any tab, show access denied
  if (
    !showGroupsTab &&
    !showUsersTab &&
    !showPermissionsTab &&
    !showTrackingTab
  ) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-red-100">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdLock className="text-5xl text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Access Denied
            </h2>
            <p className="text-slate-500 mb-4">
              You don't have permission to access the Access Control page.
            </p>
            <div className="bg-slate-50 rounded-lg p-3 text-left">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                Your Permissions:
              </p>
              <div className="space-y-1 mt-2">
                <p className="text-[11px]">
                  <span className="font-mono">Security Module:</span>{" "}
                  {hasSecurityAccess ? "✅" : "❌"}
                </p>
                <p className="text-[11px]">
                  <span className="font-mono">Groups:</span>{" "}
                  {showGroupsTab ? "✅" : "❌"}
                </p>
                <p className="text-[11px]">
                  <span className="font-mono">Users:</span>{" "}
                  {showUsersTab ? "✅" : "❌"}
                </p>
                <p className="text-[11px]">
                  <span className="font-mono">Modules:</span>{" "}
                  {showPermissionsTab ? "✅" : "❌"}
                </p>
                <p className="text-[11px]">
                  <span className="font-mono">Security Logs:</span>{" "}
                  {showTrackingTab ? "✅" : "❌"}
                </p>
              </div>
              <p className="text-[10px] text-slate-400 mt-3">
                Required: Security module access OR specific read permissions
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-[28px] font-black text-slate-800 tracking-tight">
          Access Control
        </h1>
        <p className="text-[14px] text-slate-500">
          Manage groups, permissions, user assignments, and system-wide toggles.
        </p>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-200 bg-slate-50/30">
          {showGroupsTab && (
            <TabButton
              active={tab === "groups"}
              onClick={() => setTab("groups")}
              icon={MdSecurity}
            >
              Groups
            </TabButton>
          )}
          {showUsersTab && (
            <TabButton
              active={tab === "users"}
              onClick={() => setTab("users")}
              icon={MdPeople}
            >
              Users
            </TabButton>
          )}
          {showPermissionsTab && (
            <TabButton
              active={tab === "permissions"}
              onClick={() => setTab("permissions")}
              icon={MdViewModule}
            >
              Permissions
            </TabButton>
          )}
          {showTrackingTab && (
            <TabButton
              active={tab === "tracking"}
              onClick={() => setTab("tracking")}
              icon={MdHistory}
            >
              IP Tracking
            </TabButton>
          )}
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
              {tab === "groups" && showGroupsTab && (
                <GroupsTab
                  groups={groups}
                  modules={modules}
                  functionalities={functionalities}
                  allUsers={allUsers}
                  onRefresh={fetchAll}
                />
              )}
              {tab === "users" && showUsersTab && (
                <UsersTab
                  groups={groups}
                  allUsers={allUsers}
                  onRefresh={fetchAll}
                />
              )}
              {tab === "permissions" && showPermissionsTab && (
                <PermissionsTab
                  modules={modules}
                  functionalities={functionalities}
                  onRefresh={fetchAll}
                />
              )}
              {tab === "tracking" && showTrackingTab && <IPTrackingTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}