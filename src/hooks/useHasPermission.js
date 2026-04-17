import { useSelector } from 'react-redux';

/**
 * Custom hook to check if the current user has a specific permission.
 * @param {string} module - The module slug (e.g., 'stock', 'finance').
 * @param {string} action - The action slug (e.g., 'view', 'add', 'edit').
 * @returns {boolean} - True if the user has the permission or is an admin.
 */
export const useHasPermission = (module, action) => {
  const { user, permissions } = useSelector((state) => state.auth);

  if (!user) return false;
  if (user.isAdmin) return true;

  const modulePermissions = permissions[module] || [];
  return modulePermissions.includes(action);
};

export default useHasPermission;
