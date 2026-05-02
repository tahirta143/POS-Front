// hooks/usePermissions.js
import { useSelector } from "react-redux";

/**
 * usePermissions() - Enterprise-grade permission management
 * Supports: Create, Read, Update, Delete, Print, Transfer, and custom actions
 */
export function usePermissions() {
  const { user, permissions } = useSelector((state) => state.auth);

  const isAdmin =
    permissions?.isAdmin || user?.role === "admin" || user?.is_admin || false;

  /**
   * Get all modules the user has access to
   */
  function getAccessibleModules() {
    if (isAdmin) return null; // null means all modules
    return permissions?.modules || [];
  }

  /**
   * Get all functionalities the user has
   */
  function getAllFunctionalities() {
    if (isAdmin) return null;
    return permissions?.functionalities || [];
  }

  /**
   * Check if user has access to a specific module
   */
  function canAccess(moduleName) {
    if (isAdmin) return true;
    if (!permissions?.modules?.length) return false;

    const normalizedModuleName = moduleName.toLowerCase().trim();

    return permissions.modules.some((m) => {
      const name = (m.module_name || m.slug || "").toLowerCase().trim();
      return (
        name === normalizedModuleName ||
        name.includes(normalizedModuleName) ||
        normalizedModuleName.includes(name)
      );
    });
  }

  /**
   * Check if user has a specific action on a module
   * @param {string} moduleName - Module name (e.g., "Expense Voucher")
   * @param {string} action - Action (create, read, update, delete, print, transfer)
   */
  function can(moduleName, action) {
    if (isAdmin) return true;
    if (!moduleName) return false;

    const functionalities = permissions?.functionalities || [];
    const normalizedModule = moduleName.toLowerCase().trim();
    const normalizedAction = action.toLowerCase().trim();

    return functionalities.some((func) => {
      const funcName = (func.name || "").toLowerCase();
      const hasModule = funcName.includes(normalizedModule);
      const hasAction = funcName.includes(normalizedAction);
      return hasModule && hasAction;
    });
  }

  /**
   * Check multiple actions on a module (OR logic)
   */
  function canAny(moduleName, actions) {
    if (isAdmin) return true;
    return actions.some((action) => can(moduleName, action));
  }

  /**
   * Check multiple actions on a module (AND logic)
   */
  function canAll(moduleName, actions) {
    if (isAdmin) return true;
    return actions.every((action) => can(moduleName, action));
  }

  /**
   * Get all available actions for a specific module
   */
  function getModuleActions(moduleName) {
    if (isAdmin)
      return ["create", "read", "update", "delete", "print", "transfer"];

    const functionalities = permissions?.functionalities || [];
    const normalizedModule = moduleName.toLowerCase().trim();
    const actions = new Set();

    functionalities.forEach((func) => {
      const funcName = (func.name || "").toLowerCase();
      if (funcName.includes(normalizedModule)) {
        if (funcName.includes("create")) actions.add("create");
        if (funcName.includes("read")) actions.add("read");
        if (funcName.includes("update")) actions.add("update");
        if (funcName.includes("delete")) actions.add("delete");
        if (funcName.includes("print")) actions.add("print");
        if (funcName.includes("transfer")) actions.add("transfer");
      }
    });

    return Array.from(actions);
  }

  /**
   * Check if user has any permission on a module
   */
  function hasAnyModulePermission(moduleName) {
    if (isAdmin) return true;
    if (!canAccess(moduleName)) return false;

    const actions = getModuleActions(moduleName);
    return actions.length > 0;
  }

  // CRUD Shortcuts
  const canCreate = (moduleName) => can(moduleName, "create");
  const canRead = (moduleName) => can(moduleName, "read");
  const canUpdate = (moduleName) => can(moduleName, "update");
  const canDelete = (moduleName) => can(moduleName, "delete");
  const canPrint = (moduleName) => can(moduleName, "print");
  const canTransfer = (moduleName) => can(moduleName, "transfer");

  return {
    isAdmin,
    canAccess,
    can,
    canAny,
    canAll,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canPrint,
    canTransfer,
    getModuleActions,
    hasAnyModulePermission,
    getAccessibleModules,
    getAllFunctionalities,
    modules: permissions?.modules || [],
    functionalities: permissions?.functionalities || [],
    permissions,
    user,
  };
}
