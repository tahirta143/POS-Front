import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addSupplier, updateSupplier } from '../../features/setup/supplierSlice';
import FormInput from '../../components/common/FormInput';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

const SupplierForm = () => {
  const { id } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const { loading } = useSelector((state) => state.suppliers);

  const [formData, setFormData] = useState({
    supplierName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    paymentTerms: 'Cash',
    creditLimit: '',
    status: true
  });

  useEffect(() => {
    if (isEditing && location.state?.supplier) {
      const s = location.state.supplier;
      setFormData({
        supplierName: s.supplier_name || '',
        contactPerson: s.contact_person || '',
        phone: s.phone || '',
        email: s.email || '',
        address: s.address || '',
        paymentTerms: s.payment_terms || 'Cash',
        creditLimit: s.credit_limit || '',
        status: s.status === 1 || s.status === true
      });
    }
  }, [isEditing, location.state]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    
    if (payload.paymentTerms !== 'Credit') {
      payload.creditLimit = null; // Clean up before sending
    }

    if (isEditing) {
      dispatch(updateSupplier({ id, data: payload })).then((res) => {
        if (!res.error) navigate('/setup/suppliers');
      });
    } else {
      dispatch(addSupplier(payload)).then((res) => {
        if (!res.error) navigate('/setup/suppliers');
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {isEditing ? 'Edit Supplier' : 'Create Supplier'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">Complete the form below to manage supplier credentials.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Supplier Name"
            name="supplierName"
            value={formData.supplierName}
            onChange={handleChange}
            required
          />
          <FormInput
            label="Contact Person"
            name="contactPerson"
            value={formData.contactPerson}
            onChange={handleChange}
          />
          <FormInput
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
          <FormInput
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="md:col-span-2"
          />
          
          <div className="flex flex-col mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1">Payment Terms <span className="text-red-500">*</span></label>
            <select
              name="paymentTerms"
              value={formData.paymentTerms}
              onChange={handleChange}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="Cash">Cash</option>
              <option value="Credit">Credit</option>
            </select>
          </div>

          {formData.paymentTerms === 'Credit' && (
            <FormInput
              label="Credit Limit"
              name="creditLimit"
              type="number"
              value={formData.creditLimit}
              onChange={handleChange}
              required
            />
          )}
        </div>

        <div className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            id="status"
            name="status"
            checked={formData.status}
            onChange={handleChange}
            className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
          />
          <label htmlFor="status" className="font-medium text-sm text-gray-700">Active Supplier</label>
        </div>
        
        <div className="flex justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={() => navigate('/setup/suppliers')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Supplier'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupplierForm;
