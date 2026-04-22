import { useSelector } from "react-redux";

/**
 * usePermissions()
 *
 * Reads permissions directly from Redux store (state.auth.permissions).
 * Shape stored at login:  { isAdmin: bool, modules: [...], functionalities: [...] }
 *
 * Permissions object from server looks like:
 *   modules:         [ { id, name, slug, ... }, ... ]
 *   functionalities: [ { id, name, slug, module_id, ... }, ... ]
 */
export function usePermissions() {
  const { user, permissions } = useSelector((state) => state.auth);

  const isAdmin =
    permissions?.isAdmin ||
    user?.role === "admin" ||
    user?.is_admin ||
    false;

  /**
   * canAccess("Sale")
   * Returns true if the user has this module in their permissions list.
   */
  function canAccess(moduleName) {
    if (isAdmin) return true;
    if (!permissions?.modules?.length) return false;
    return permissions.modules.some((m) => {
      const name = (m.name || m.module_name || m.slug || "").toLowerCase();
      return name === moduleName.toLowerCase() || name.includes(moduleName.toLowerCase());
    });
  }

  /**
   * canDo("Create Sale Invoice")   — match by functionality name
   * canDo("read", "Sale")          — match by action keyword + module name (optional second arg)
   */
  function canDo(actionOrFuncName, moduleName = null) {
    if (isAdmin) return true;
    if (!permissions?.functionalities?.length) return false;

    return permissions.functionalities.some((f) => {
      const fname = (f.name || f.slug || "").toLowerCase();
      const mname = (f.module_name || "").toLowerCase();

      if (moduleName) {
        // Two-arg form: canDo("read", "Sale")
        return (
          fname.includes(actionOrFuncName.toLowerCase()) &&
          mname.includes(moduleName.toLowerCase())
        );
      }
      // One-arg form: canDo("Create Sale Invoice")
      return fname.includes(actionOrFuncName.toLowerCase());
    });
  }

  /**
   * canAny(["Create Booking", "Update Booking"])
   * Returns true if the user has ANY of the listed functionalities.
   */
  function canAny(actions) {
    return actions.some((a) => canDo(a));
  }

  return {
    isAdmin,
    canAccess,
    canDo,
    canAny,
    modules: permissions?.modules || [],
    functionalities: permissions?.functionalities || [],
  };
}