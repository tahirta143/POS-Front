import React, { useState, useEffect } from 'react';
import { useGenericCrud } from '../../hooks/useGenericCrud';
import Table from '../common/Table';
import FormInput from '../common/FormInput';
import Loader from '../common/Loader';
import { MdAdd, MdClose } from 'react-icons/md';

const DynamicSetupPage = ({ title, description, endpoint, fields }) => {
  const { data, loading, error, fetchAll, createRecord, updateRecord, deleteRecord } = useGenericCrud(endpoint);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchAll();
  }, [fetchAll, endpoint]);

  const openAddModal = () => {
    const initialData = {};
    fields.forEach(f => {
      initialData[f.name] = f.type === 'boolean' ? true : '';
    });
    setFormData(initialData);
    setIsEditing(false);
    setEditId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setFormData(row);
    setIsEditing(true);
    setEditId(row.id);
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let res;
    if (isEditing) {
      res = await updateRecord(editId, formData);
    } else {
      res = await createRecord(formData);
    }
    if (!res.error) {
      setIsModalOpen(false);
    }
  };

  // Generate Table Columns dynamically from fields
  const columns = [
    { header: 'ID', accessor: 'id' },
    ...fields.map(f => ({
      header: f.label,
      accessor: f.name
    }))
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors"
        >
          <MdAdd className="text-xl" />
          Add New
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        {loading && data.length === 0 ? (
          <Loader />
        ) : error ? (
          <div className="text-red-500 bg-red-50 p-4 rounded-md">Error: {error}</div>
        ) : (
          <Table data={data} columns={columns} onEdit={handleEdit} onDelete={(row) => deleteRecord(row.id)} />
        )}
      </div>

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl transform transition-all">
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h3 className="text-xl font-semibold text-gray-800">
                {isEditing ? 'Edit' : 'Add'} {title}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <MdClose className="text-2xl" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map((f, idx) => (
                f.type === 'boolean' ? (
                  <div key={idx} className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id={f.name}
                      name={f.name}
                      checked={formData[f.name] || false}
                      onChange={handleChange}
                      className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <label htmlFor={f.name} className="text-sm font-medium text-gray-700">{f.label}</label>
                  </div>
                ) : (
                  <FormInput
                    key={idx}
                    label={f.label}
                    name={f.name}
                    type={f.type || 'text'}
                    value={formData[f.name] || ''}
                    onChange={handleChange}
                    required={f.required}
                    placeholder={`Enter ${f.label.toLowerCase()}`}
                  />
                )
              ))}
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicSetupPage;
