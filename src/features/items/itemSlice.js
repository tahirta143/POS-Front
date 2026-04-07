import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosInstance';
import { toast } from 'react-toastify';

export const fetchItems = createAsyncThunk('items/fetchItems', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/item-details');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const addItem = createAsyncThunk('items/addItem', async (itemData, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/item-details', itemData);
    toast.success('Item added successfully');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const updateItem = createAsyncThunk('items/updateItem', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.put(`/item-details/${id}`, data);
    toast.success('Item updated successfully');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const deleteItem = createAsyncThunk('items/deleteItem', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/item-details/${id}`);
    toast.success('Item deleted successfully');
    return id;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

const itemSlice = createSlice({
  name: 'items',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // Fetch Items
    builder.addCase(fetchItems.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchItems.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload;
    });
    builder.addCase(fetchItems.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    // Add Item
    builder.addCase(addItem.fulfilled, (state, action) => {
      state.items.push(action.payload);
    });
    // Update Item
    builder.addCase(updateItem.fulfilled, (state, action) => {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    });
    // Delete Item
    builder.addCase(deleteItem.fulfilled, (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    });
  },
});

export default itemSlice.reducer;
