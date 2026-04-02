import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import ItemList from './pages/items/ItemList';
import SupplierList from './pages/setup/SupplierList';
import CustomerList from './pages/customers/CustomerList';
import SubCategory from './pages/setup/SubCategory';
import ItemType from './pages/setup/ItemType';
import ItemCategory from './pages/setup/ItemCategory';
import ItemUnit from './pages/setup/ItemUnit';
import ItemShelve from './pages/setup/ItemShelve';
import ExpenseHead from './pages/expense/ExpenseHead';
import ExpenseVoucher from './pages/expense/ExpenseVoucher';
import ExpenseReport from './pages/expense/ExpenseReport';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Manufacturers from './pages/setup/Manufacturers';
import Bookings from './pages/customers/Bookings';
import Sales from './pages/Sales';
import OpeningStock from './pages/stock/OpeningStock';
import PurchasePage from './pages/Purchase';
import ItemBarcode from './pages/setup/ItemBarcode';
import ExpiryTagsPage from './pages/ExpiryTags';
import ReOrderStock from './pages/stock/ReOrderStock';
import ClosingStock from './pages/stock/ClosingStock';
import Security from './pages/Security';

// Placeholder standard component for empty routes
const Placeholder = ({ title }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <h2 className="text-xl font-semibold mb-4 text-teal-700">{title}</h2>
    <p className="text-gray-500">This module is under construction.</p>
  </div>
);


const App = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [showRegister, setShowRegister] = useState(false);

  if (!isAuthenticated) {
    if (showRegister) {
      return <Register onSwitchToLogin={() => setShowRegister(false)} />;
    }
    return <Login onSwitchToRegister={() => setShowRegister(true)} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Stock Routes */}
        <Route path="/stock/opening" element={<OpeningStock />} />
        <Route path="/stock/closing" element={<ClosingStock/>} />
        <Route path="/stock/reorder" element={<ReOrderStock />} />

        {/* Items */}
        <Route path="/items" element={<ItemList />} />

        {/* Specific Modules */}
        <Route path="/purchase" element={<PurchasePage />} />
        <Route path="/sale" element={<Sales />} />
        <Route path="/customers" element={<CustomerList />} />
        <Route path="/booking-customers" element={<Bookings />} />
        <Route path="/security" element={<Security />} />
        <Route path="/expiry-tags" element={<ExpiryTagsPage />} />

        {/* Other Setup Routes */}
        <Route path="/setup/suppliers" element={<SupplierList />}/>
        <Route path="/setup/manufacturers" element={<Manufacturers />} />
        <Route path="/setup/item-category" element={<ItemCategory />} />
        <Route path="/setup/item-subcategory" element={<SubCategory />} />
        <Route path="/setup/item-type" element={<ItemType />} />
        <Route path="/setup/item-unit" element={<ItemUnit />} />
        <Route path="/setup/shelve-location" element={<ItemShelve />} />
        <Route path="/setup/item-barcode" element={<ItemBarcode />} />

        {/* Other Expense Routes */}
        <Route path="/expense/head" element={<ExpenseHead />} />
        <Route path="/expense/voucher" element={<ExpenseVoucher />} />
        <Route path="/expense/report" element={<ExpenseReport />} />
      </Route>
    </Routes>
  );
};

export default App;
