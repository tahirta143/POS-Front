import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";

export const fetchCustomers = createAsyncThunk(
  "customers/fetchCustomers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/customers");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch customers",
      );
    }
  },
);

export const addCustomer = createAsyncThunk(
  "customers/addCustomer",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/customers", data);
      toast.success("Customer added successfully");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add customer",
      );
    }
  },
);

export const updateCustomer = createAsyncThunk(
  "customers/updateCustomer",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/customers/${id}`, data);
      toast.success("Customer updated successfully");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update customer",
      );
    }
  },
);

export const deleteCustomer = createAsyncThunk(
  "customers/deleteCustomer",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/customers/${id}`);
      toast.success("Customer deleted successfully");
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete customer",
      );
    }
  },
);

const customerSlice = createSlice({
  name: "customers",
  initialState: {
    customers: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchCustomers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCustomers.fulfilled, (state, action) => {
      state.loading = false;
      state.customers = action.payload;
    });
    builder.addCase(fetchCustomers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    // Add
    builder.addCase(addCustomer.fulfilled, (state, action) => {
      if (action.payload) state.customers.push(action.payload);
    });
    // Update
    builder.addCase(updateCustomer.fulfilled, (state, action) => {
      if (!action.payload) return;
      const index = state.customers.findIndex(
        (c) => c.id === action.payload.id,
      );
      if (index !== -1) {
        state.customers[index] = action.payload;
      }
    });
    // Delete
    builder.addCase(deleteCustomer.fulfilled, (state, action) => {
      state.customers = state.customers.filter((c) => c.id !== action.payload);
    });
  },
});

export default customerSlice.reducer;
