import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * ProtectedRoute component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component to render if authorized
 * @param {string} props.module - Optional module name to check permission
 * @param {string} props.action - Optional action name to check permission
 */
const ProtectedRoute = ({ children, module, action }) => {
  const { isAuthenticated, user, permissions } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admins bypass all checks
  if (user?.is_admin || user?.role === 'admin' || permissions?.isAdmin) {
    return children;
  }

  // If a specific module check is required
  if (module) {
    const hasModule = permissions.modules?.some(
      (m) => m.slug === module.toLowerCase() || m.name.toLowerCase() === module.toLowerCase()
    );

    if (!hasModule) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // If a specific action check is required
  if (action) {
    const hasAction = permissions.functionalities?.some(
      (f) => f.slug === action.toLowerCase() || f.name.toLowerCase() === action.toLowerCase()
    );

    if (!hasAction) {
      // For now, redirect to dashboard. In a real app, maybe show an "Access Denied" toast or page.
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;