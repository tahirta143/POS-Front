// components/auth/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { usePermissions } from "../../hooks/usePermissions";
import { MdSecurity, MdWarning, MdLock } from "react-icons/md";

const ProtectedRoute = ({ 
  children, 
  module,     
  action,     
  fallback = "/dashboard",
  showAccessDenied = false
}) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { isAdmin, can, getModuleActions } = usePermissions();
  const location = useLocation();

  // 1. Not logged in → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Admins bypass all permission checks
  if (isAdmin) return children;

  // 3. Module + Action permission check
  if (module) {
    const hasPermission = action ? can(module, action) : can(module, 'read');
    
    if (!hasPermission) {
      if (showAccessDenied) {
        return <AccessDeniedPage module={module} action={action} availableActions={getModuleActions(module)} />;
      }
      return <Navigate to={fallback} replace />;
    }
  }

  return children;
};

// Access Denied Page Component
const AccessDeniedPage = ({ module, action, availableActions = [] }) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
          <MdLock className="text-4xl text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
        <p className="text-slate-500 mb-4">
          You don't have permission to access this page.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
          <div className="flex items-center gap-2 mb-3">
            <MdWarning className="text-amber-500" />
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">
              Required Permissions
            </p>
          </div>
          {module && (
            <p className="text-sm text-slate-600 mb-2">
              <span className="font-semibold">Module:</span>{' '}
              <span className="font-mono text-xs bg-amber-100 px-2 py-0.5 rounded">
                {module}
              </span>
            </p>
          )}
          {action && (
            <p className="text-sm text-slate-600">
              <span className="font-semibold">Action:</span>{' '}
              <span className="font-mono text-xs bg-amber-100 px-2 py-0.5 rounded">
                {action.toUpperCase()}
              </span>
            </p>
          )}
          {availableActions.length > 0 && (
            <div className="mt-3 pt-2 border-t border-amber-200">
              <p className="text-xs text-slate-500 mb-1">Your available actions:</p>
              <div className="flex flex-wrap gap-1">
                {availableActions.map(a => (
                  <span key={a} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;