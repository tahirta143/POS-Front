import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosInstance';
import { toast } from 'react-toastify';

export const fetchSuppliers = createAsyncThunk('suppliers/fetchSuppliers', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/suppliers');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch suppliers');
  }
});

export const addSupplier = createAsyncThunk('suppliers/addSupplier', async (data, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/suppliers', data);
    toast.success('Supplier added successfully');
    return response.data.supplier;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add supplier');
  }
});

export const updateSupplier = createAsyncThunk('suppliers/updateSupplier', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.put(`/suppliers/${id}`, data);
    toast.success('Supplier updated successfully');
    return response.data.updated;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update supplier');
  }
});

export const deleteSupplier = createAsyncThunk('suppliers/deleteSupplier', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/suppliers/${id}`);
    toast.success('Supplier deleted successfully');
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete supplier');
  }
});

const supplierSlice = createSlice({
  name: 'suppliers',
  initialState: {
    suppliers: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchSuppliers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSuppliers.fulfilled, (state, action) => {
      state.loading = false;
      state.suppliers = action.payload;
    });
    builder.addCase(fetchSuppliers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    // Add
    builder.addCase(addSupplier.fulfilled, (state, action) => {
      if(action.payload) state.suppliers.push(action.payload);
    });
    // Update
    builder.addCase(updateSupplier.fulfilled, (state, action) => {
      if(!action.payload) return;
      const index = state.suppliers.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) {
        state.suppliers[index] = action.payload;
      }
    });
    // Delete
    builder.addCase(deleteSupplier.fulfilled, (state, action) => {
      state.suppliers = state.suppliers.filter((s) => s.id !== action.payload);
    });
  },
});

export default supplierSlice.reducer;
