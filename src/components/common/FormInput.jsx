import React from 'react';

const FormInput = ({ label, name, type = 'text', value, onChange, placeholder, required = false, className = '' }) => {
  return (
    <div className={`flex flex-col mb-4 ${className}`}>
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
      />
    </div>
  );
};

export default FormInput;
