import { useState, useCallback } from 'react';
import axiosInstance from '../services/axiosInstance';
import { toast } from 'react-toastify';

export const useGenericCrud = (endpoint) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(endpoint);
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  const createRecord = async (payload) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(endpoint, payload);
      toast.success(response.data.message || 'Record created successfully');
      await fetchAll();
      return { data: response.data, error: null };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error creating record';
      return { data: null, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const updateRecord = async (id, payload) => {
    setLoading(true);
    try {
      const response = await axiosInstance.put(`${endpoint}/${id}`, payload);
      toast.success(response.data.message || 'Record updated successfully');
      await fetchAll();
      return { data: response.data, error: null };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error updating record';
      return { data: null, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    setLoading(true);
    try {
      const response = await axiosInstance.delete(`${endpoint}/${id}`);
      toast.success(response.data.message || 'Record deleted successfully');
      await fetchAll();
      return { data: response.data, error: null };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error deleting record';
      return { data: null, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchAll, createRecord, updateRecord, deleteRecord };
};
