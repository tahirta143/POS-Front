import axios from 'axios';
import { toast } from 'react-toastify';
import store from '../app/store.js'; 
import { logout } from '../features/auth/authSlice';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor FIXED
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errorMsg = error.response?.data?.message || 'Network Error';

    // 🔥 HANDLE TOKEN EXPIRED
    if (status === 401) {
      toast.error('Session expired. Please login again.');

      // logout from redux + clear storage
      store.dispatch(logout());

      // redirect to login
      window.location.href = '/login';
      return;
    }

    toast.error(errorMsg);
    return Promise.reject(error);
  }
);

export default axiosInstance;