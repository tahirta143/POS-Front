import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { usePermissions } from "../../hooks/usePermissions"; // adjust path if needed
import { MdShield } from "react-icons/md";

/**
 * ProtectedRoute
 *
 * Props:
 *   children   — what to render if access is granted
 *   module     — (optional) module name the user must have access to  e.g. "Sale"
 *   action     — (optional) functionality name the user must have     e.g. "Create Sale Invoice"
 *   fallback   — (optional) where to redirect on failure. Defaults to "/dashboard"
 */
const ProtectedRoute = ({ children, module, action, fallback = "/dashboard" }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { isAdmin, canAccess, canDo } = usePermissions();
  const location = useLocation();

  // 1. Not logged in → go to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Admins bypass all permission checks
  if (isAdmin) return children;

  // 3. Module-level check
  if (module && !canAccess(module)) {
    return <Navigate to={fallback} replace />;
  }

  // 4. Functionality-level check
  if (action && !canDo(action)) {
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;