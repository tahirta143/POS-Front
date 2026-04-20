import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosInstance';
import { toast } from 'react-toastify';

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/auth/login', credentials);
    const { token, user, permissions } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('permissions', JSON.stringify(permissions || {}));
    return { token, user, permissions };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

export const refreshPermissions = createAsyncThunk('auth/refreshPermissions', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/auth/me/permissions');
    const permissions = response.data;
    localStorage.setItem('permissions', JSON.stringify(permissions || {}));
    return permissions;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to refresh permissions');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/auth/register', userData);
    toast.success(response.data.message || 'Registration successful');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Registration failed');
  }
});

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  permissions: JSON.parse(localStorage.getItem('permissions')) || {},
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('permissions');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.permissions = {};
      toast.info('Logged out successfully');
    },
    clearError: (state) => {
      state.error = null;
    }
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
      state.permissions = permissions || {};
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
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
    });

    // Refresh Permissions
    builder.addCase(refreshPermissions.fulfilled, (state, action) => {
      state.permissions = action.payload || {};
    });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
