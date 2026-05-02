import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/login", credentials);
      const { token, user, permissions } = response.data;

      // Ensure permissions have the correct structure
      const formattedPermissions = {
        modules: permissions?.modules || [],
        functionalities: permissions?.functionalities || [],
        isAdmin:
          user?.is_admin ||
          user?.role === "admin" ||
          permissions?.isAdmin ||
          false,
      };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("permissions", JSON.stringify(formattedPermissions));

      return { token, user, permissions: formattedPermissions };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  },
);

export const refreshPermissions = createAsyncThunk(
  "auth/refreshPermissions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/auth/me/permissions");
      const permissionsData = response.data;

      // Format permissions consistently
      const formattedPermissions = {
        modules: permissionsData?.modules || [],
        functionalities: permissionsData?.functionalities || [],
        isAdmin: permissionsData?.isAdmin || false,
      };

      localStorage.setItem("permissions", JSON.stringify(formattedPermissions));
      return formattedPermissions;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to refresh permissions",
      );
    }
  },
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/register", userData);
      toast.success(response.data.message || "Registration successful");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Registration failed",
      );
    }
  },
);

// Helper function to check if user has a specific permission
export const hasPermission = (state, moduleName, requiredAction = null) => {
  const { permissions, user } = state;
  const isAdmin =
    user?.is_admin || user?.role === "admin" || permissions?.isAdmin;

  if (isAdmin) return true;

  // Check module access
  const hasModule = permissions?.modules?.some((m) => {
    const name = (m.name || m.module_name || m.slug || "").toLowerCase();
    return (
      name === moduleName.toLowerCase() ||
      name.includes(moduleName.toLowerCase())
    );
  });

  if (!hasModule) return false;

  // If no specific action required, module access is enough
  if (!requiredAction) return true;

  // Check specific functionality permission
  const hasAction = permissions?.functionalities?.some((func) => {
    const funcName = (func.name || func.slug || "").toLowerCase();
    return (
      funcName.includes(requiredAction.toLowerCase()) &&
      (func.module_id ? true : true)
    ); // Optionally check module_id match
  });

  return hasAction;
};

// Helper to get user's accessible modules
export const getUserModules = (state) => {
  const { permissions, user } = state;
  const isAdmin =
    user?.is_admin || user?.role === "admin" || permissions?.isAdmin;

  if (isAdmin) return null; // null means all modules accessible
  return permissions?.modules || [];
};

// Helper to get user's functionalities
export const getUserFunctionalities = (state) => {
  const { permissions, user } = state;
  const isAdmin =
    user?.is_admin || user?.role === "admin" || permissions?.isAdmin;

  if (isAdmin) return null; // null means all functionalities accessible
  return permissions?.functionalities || [];
};

const initialState = {
  user: (() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  })(),
  token: localStorage.getItem("token") || null,
  isAuthenticated: !!localStorage.getItem("token"),
  permissions: (() => {
    const permsData = localStorage.getItem("permissions");
    if (permsData) {
      const parsed = JSON.parse(permsData);
      return {
        modules: parsed?.modules || [],
        functionalities: parsed?.functionalities || [],
        isAdmin: parsed?.isAdmin || false,
      };
    }
    return { modules: [], functionalities: [], isAdmin: false };
  })(),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("permissions");
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.permissions = { modules: [], functionalities: [], isAdmin: false };
      toast.info("Logged out successfully");
    },
    clearError: (state) => {
      state.error = null;
    },
    updatePermissions: (state, action) => {
      const { modules, functionalities, isAdmin } = action.payload;
      state.permissions = {
        modules: modules || state.permissions.modules,
        functionalities: functionalities || state.permissions.functionalities,
        isAdmin: isAdmin !== undefined ? isAdmin : state.permissions.isAdmin,
      };
      localStorage.setItem("permissions", JSON.stringify(state.permissions));
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      const { user, token, permissions } = action.payload;

      state.loading = false;
      state.isAuthenticated = true;
      state.user = user;
      state.token = token;
      state.permissions = permissions || {
        modules: [],
        functionalities: [],
        isAdmin: false,
      };
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
      toast.error(action.payload || "Login failed");
    });

    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
      toast.error(action.payload || "Registration failed");
    });

    // Refresh Permissions
    builder.addCase(refreshPermissions.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(refreshPermissions.fulfilled, (state, action) => {
      state.loading = false;
      state.permissions = action.payload || {
        modules: [],
        functionalities: [],
        isAdmin: false,
      };
    });
    builder.addCase(refreshPermissions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { logout, clearError, updatePermissions } = authSlice.actions;
export default authSlice.reducer;
