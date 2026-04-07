import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
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
import UserModule from './pages/security/UserModule';
import GroupRights from './pages/security/GroupRights';
import ModuleFunctions from './pages/security/ModuleFunctions';
import ModulesInfo from './pages/security/ModulesInfo';
import SecurityLog from './pages/security/SecurityLog';
import GroupUsers from './pages/security/GroupUsers';
import Company from './pages/security/Company';
import Employee from './pages/security/Employee';
import User from './pages/security/User';
import SoftwareGroup from './pages/security/Software';
import UserToGroup from './pages/security/UserToGroup';
import Department from './pages/setup/Department';
import Designation from './pages/setup/Designation';
import CustomerLedger from './pages/customers/CustomerLedger';
import Daybook from './pages/expense/Daybook';



import SupplierPaymentPage from './pages/finance/SupplierPayment';
import AmountPayablePage from './pages/finance/AmountPayable';
import SupplierLedgerPage from './pages/finance/SupplierLedger';
import CustomerPaymentPage from './pages/finance/CustomerPayment';
import AmountReceivablePage from './pages/finance/AmountReceivable';
import SalesReturnPage from './pages/stock/SalesReturn';
import PurchaseReturnPage from './pages/stock/PurchaseReturn';
import GoodsReceiptNotePage from './pages/stock/GoodsReceiptNote';

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
        <Route path="/profile" element={<Profile />} />

        {/* Stock Routes */}
        <Route path="/stock/opening" element={<OpeningStock />} />
        <Route path="/stock/closing" element={<ClosingStock />} />
        <Route path="/stock/reorder" element={<ReOrderStock />} />
        <Route path="/stock/sales-return" element={<SalesReturnPage />} />
        <Route path="/stock/purchase-return" element={<PurchaseReturnPage />} />
        <Route path="/stock/grn" element={<GoodsReceiptNotePage />} />

        {/* Items */}
        <Route path="/items" element={<ItemList />} />

        {/* Sales & Purchase */}
        <Route path="/purchase" element={<PurchasePage />} />
        <Route path="/sale" element={<Sales />} />

        {/* Finance Routes */}
        <Route path="/finance/supplier-payment" element={<SupplierPaymentPage />} />
        <Route path="/finance/amount-payable" element={<AmountPayablePage />} />
        <Route path="/finance/supplier-ledger" element={<SupplierLedgerPage />} />
        <Route path="/finance/customer-payment" element={<CustomerPaymentPage />} />
        <Route path="/finance/amount-receivable" element={<AmountReceivablePage />} />

        {/* Customer Routes */}
        <Route path="/customer/registration" element={<CustomerList />} />
        <Route path="/customer/record" element={<CustomerLedger />} />
        <Route path="/booking-customers" element={<Bookings />} />
        <Route path="/security" element={<Security />} />
        <Route path="/expiry-tags" element={<ExpiryTagsPage />} />

        {/* Other Setup Routes */}
        <Route path="/setup/suppliers" element={<SupplierList />} />
        <Route path="/setup/manufacturers" element={<Manufacturers />} />
        <Route path="/setup/item-category" element={<ItemCategory />} />
        <Route path="/setup/item-subcategory" element={<SubCategory />} />
        <Route path="/setup/item-type" element={<ItemType />} />
        <Route path="/setup/item-unit" element={<ItemUnit />} />
        <Route path="/setup/shelve-location" element={<ItemShelve />} />
        <Route path="/setup/item-barcode" element={<ItemBarcode />} />
        <Route path="/setup/department" element={<Department />} />
        <Route path="/setup/designation" element={<Designation />} />

        {/* Accounts/Expense Routes */}
        <Route path="/daybook" element={<Daybook />} />
        <Route path="/expense/head" element={<ExpenseHead />} />
        <Route path="/expense/voucher" element={<ExpenseVoucher />} />
        <Route path="/expense/report" element={<ExpenseReport />} />

        {/* Security Routes */}
        <Route path="/security/user-module" element={<UserModule />} />
        <Route path="/security/group-rights" element={<GroupRights />} />
        <Route path="/security/module-functions" element={<ModuleFunctions />} />
        <Route path="/security/module-info" element={<ModulesInfo />} />
        <Route path="/security/security-log" element={<SecurityLog />} />
        <Route path="/security/group-users" element={<GroupUsers />} />
        <Route path="/security/company" element={<Company />} />
        <Route path="/security/employee" element={<Employee />} />
        <Route path="/security/user" element={<User />} />
        <Route path="/security/software-group" element={<SoftwareGroup />} />
        <Route path="/security/user-to-group" element={<UserToGroup />} />
      </Route>
    </Routes>
  );

};

export default App;
