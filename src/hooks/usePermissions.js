
import { useMemo } from "react";

const PERM_KEY = "pos_user_permissions";
const USER_KEY = "pos_user";

function readPermissions() {
  try {
    return JSON.parse(localStorage.getItem(PERM_KEY) || "{}");
  } catch {
    return {};
  }
}

function readUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "{}");
  } catch {
    return {};
  }
}

export function usePermissions() {
  const user  = readUser();
  const perms = readPermissions();

  return useMemo(() => {
    const isAdmin = perms.isAdmin || user?.role === "admin" || user?.is_admin;

    /**
     * canAccess('Purchase') — true if user has any right to this module
     */
    const canAccess = (moduleName) => {
      if (isAdmin) return true;
      return (perms.modules || []).some(
        (m) => m.toLowerCase() === moduleName.toLowerCase()
      );
    };

    /**
     * canDo('Create Purchase Invoice') — true if user has this functionality
     */
    const canDo = (actionName) => {
      if (isAdmin) return true;
      return (perms.functionalities || []).some(
        (f) => f.toLowerCase() === actionName.toLowerCase()
      );
    };

    /**
     * canAny(['Create Purchase Invoice', 'Update Purchase Invoice'])
     */
    const canAny = (actions) => actions.some(canDo);

    return { isAdmin, canAccess, canDo, canAny, modules: perms.modules || [], functionalities: perms.functionalities || [] };
  }, [perms, user]);
}

// ─── Save permissions to localStorage after login ────────────────────────────
export function savePermissions(permissions) {
  localStorage.setItem(PERM_KEY, JSON.stringify(permissions));
}

export function clearPermissions() {
  localStorage.removeItem(PERM_KEY);
  localStorage.removeItem(USER_KEY);
}