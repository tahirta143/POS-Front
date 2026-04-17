import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import axios from "axios"; // Import axios
import { useSelector } from "react-redux";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ItemList from "./pages/items/ItemList";
import SupplierList from "./pages/setup/SupplierList";
import CustomerList from "./pages/customers/CustomerList";
import SubCategory from "./pages/setup/SubCategory";
import ItemType from "./pages/setup/ItemType";
import ItemCategory from "./pages/setup/ItemCategory";
import ItemUnit from "./pages/setup/ItemUnit";
import ItemShelve from "./pages/setup/ItemShelve";
import ExpenseHead from "./pages/expense/ExpenseHead";
import ExpenseVoucher from "./pages/expense/ExpenseVoucher";
import ExpenseReport from "./pages/expense/ExpenseReport";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Manufacturers from "./pages/setup/Manufacturers";
import Bookings from "./pages/customers/Bookings";
import Sales from "./pages/Sales";
import OpeningStock from "./pages/stock/OpeningStock";
import PurchasePage from "./pages/Purchase";
import ItemBarcode from "./pages/setup/ItemBarcode";
import ExpiryTagsPage from "./pages/ExpiryTags";
import ReOrderStock from "./pages/stock/ReOrderStock";

import Security from "./pages/Security";
import UserModule from "./pages/security/UserModule";
import GroupRights from "./pages/security/GroupRights";
import ModuleFunctions from "./pages/security/ModuleFunctions";
import ModulesInfo from "./pages/security/ModulesInfo";
import SecurityLog from "./pages/security/SecurityLog";
// import Groups from "./pages/security/Groups";
import Groups from "./pages/security/Groups";
// Removed GroupUsers route as requested
import Company from "./pages/security/Company";
import Employee from "./pages/security/Employee";
import User from "./pages/security/User";
import SoftwareGroup from "./pages/security/Software";
import UserToGroup from "./pages/security/UserToGroup";
import Department from "./pages/setup/Department";
import Designation from "./pages/setup/Designation";
import CustomerLedger from "./pages/customers/CustomerLedger";
import Daybook from "./pages/expense/Daybook";

import SupplierPaymentPage from "./pages/finance/SupplierPayment";
import AmountPayablePage from "./pages/finance/AmountPayable";
import SupplierLedgerPage from "./pages/finance/SupplierLedger";
import CustomerPaymentPage from "./pages/finance/CustomerPayment";
import AmountReceivablePage from "./pages/finance/AmountReceivable";
import SalesReturnPage from "./pages/stock/SalesReturn";

// --- Start of suggested axios configuration ---
// Assuming your Redux store is accessible and has an 'auth' slice with 'token' and 'logout' action
import store from "./app/store"; // Adjust path to your Redux store
import { logout } from "./features/auth/authSlice"; // Adjust path to your auth slice's logout action

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api", // Use environment variable for API base URL
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const { token } = store.getState().auth;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// You can add a response interceptor to handle global errors, e.g., 401 Unauthorized
// This would typically be in a separate utility file, but shown here for context.
// --- End of suggested axios configuration ---
import PurchaseReturnPage from "./pages/stock/PurchaseReturn";
import GoodsReceiptNotePage from "./pages/stock/GoodsReceiptNote";
import StockTransferPage from "./pages/stock/StockTransfer";

const App = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    const root = window.document.documentElement;

    if (!isAuthenticated) {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
      return;
    }

    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;

    root.classList.toggle("dark", shouldUseDark);
    root.style.colorScheme = shouldUseDark ? "dark" : "light";
  }, [isAuthenticated]);

  // Add a response interceptor to handle global errors, e.g., 401 Unauthorized
  // This is placed inside App component to ensure it has access to Redux store
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          store.dispatch(logout()); // Dispatch logout action
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptor); // Clean up interceptor on unmount
  }, []); // Run once on component mount

  // No longer returning early based on !isAuthenticated
  // Moving all logic into the main return Routes structure

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          !isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />
        }
      />
      <Route
        path="/register"
        element={
          !isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />
        }
      />

      {/* Root/Protected Routes */}
      <Route
        element={
          isAuthenticated ? <Layout /> : <Navigate to="/login" replace />
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />

        {/* Stock Routes */}
        <Route path="/stock/opening" element={<OpeningStock />} />
        <Route path="/stock/reorder" element={<ReOrderStock />} />
        <Route path="/stock/sales-return" element={<SalesReturnPage />} />
        <Route path="/stock/purchase-return" element={<PurchaseReturnPage />} />
        <Route path="/stock/grn" element={<GoodsReceiptNotePage />} />
        <Route path="/stock/transfer" element={<StockTransferPage />} />

        {/* Items */}
        <Route path="/items" element={<ItemList />} />

        {/* Sales & Purchase */}
        <Route path="/purchase" element={<PurchasePage />} />
        <Route path="/sale" element={<Sales />} />

        {/* Finance Routes */}
        <Route
          path="/finance/supplier-payment"
          element={<SupplierPaymentPage />}
        />
        <Route path="/finance/amount-payable" element={<AmountPayablePage />} />
        <Route
          path="/finance/supplier-ledger"
          element={<SupplierLedgerPage />}
        />
        <Route
          path="/finance/customer-payment"
          element={<CustomerPaymentPage />}
        />
        <Route
          path="/finance/amount-receivable"
          element={<AmountReceivablePage />}
        />

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
        <Route
          path="/security/module-functions"
          element={<ModuleFunctions />}
        />
        <Route path="/security/module-info" element={<ModulesInfo />} />
        <Route path="/security/security-log" element={<SecurityLog />} />
        <Route path="/security/company" element={<Company />} />
        <Route path="/security/employee" element={<Employee />} />
        <Route path="/security/user" element={<User />} />
        <Route path="/security/software-group" element={<SoftwareGroup />} />
        <Route path="/security/user-to-group" element={<UserToGroup />} />
      </Route>

      {/* Catch-all route */}
      <Route
        path="*"
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        }
      />
    </Routes>
  );
};

export default App;
