import { configureStore } from '@reduxjs/toolkit';
import itemReducer from '../features/items/itemSlice';
import supplierReducer from '../features/setup/supplierSlice';
import customerReducer from '../features/customers/customerSlice';
import authReducer from '../features/auth/authSlice';

export const store = configureStore({
  reducer: {
    items: itemReducer,
    suppliers: supplierReducer,
    customers: customerReducer,
    auth: authReducer,
  },
});
