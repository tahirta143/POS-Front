import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { refreshPermissions } from "./features/auth/authSlice";
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
import AccessControl from "./pages/security/AccessControl";
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
import PurchaseReturnPage from "./pages/stock/PurchaseReturn";
import GoodsReceiptNotePage from "./pages/stock/GoodsReceiptNote";
import StockTransferPage from "./pages/stock/StockTransfer";

import ProtectedRoute from "./components/auth/ProtectedRoute";

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(refreshPermissions());
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    const root = window.document.documentElement;

    if (!isAuthenticated) {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
      return;
    }

    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;

    root.classList.toggle("dark", shouldUseDark);
    root.style.colorScheme = shouldUseDark ? "dark" : "light";
  }, [isAuthenticated]);

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
        <Route 
          path="/stock/opening" 
          element={
            <ProtectedRoute module="Stock">
              <OpeningStock />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/stock/reorder" 
          element={
            <ProtectedRoute module="Stock">
              <ReOrderStock />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/stock/sales-return" 
          element={
            <ProtectedRoute module="Stock">
              <SalesReturnPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/stock/purchase-return" 
          element={
            <ProtectedRoute module="Stock">
              <PurchaseReturnPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/stock/grn" 
          element={
            <ProtectedRoute module="Stock">
              <GoodsReceiptNotePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/stock/transfer" 
          element={
            <ProtectedRoute module="Stock">
              <StockTransferPage />
            </ProtectedRoute>
          } 
        />

        {/* Items */}
        <Route 
          path="/items" 
          element={
            <ProtectedRoute module="Items">
              <ItemList />
            </ProtectedRoute>
          } 
        />

        {/* Sales & Purchase */}
        <Route 
          path="/purchase" 
          element={
            <ProtectedRoute module="Purchase">
              <PurchasePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/sale" 
          element={
            <ProtectedRoute module="Sale">
              <Sales />
            </ProtectedRoute>
          } 
        />

        {/* Finance Routes */}
        <Route
          path="/finance/supplier-payment"
          element={
            <ProtectedRoute module="Finance">
              <SupplierPaymentPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/finance/amount-payable" 
          element={
            <ProtectedRoute module="Finance">
              <AmountPayablePage />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/finance/supplier-ledger"
          element={
            <ProtectedRoute module="Finance">
              <SupplierLedgerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/customer-payment"
          element={
            <ProtectedRoute module="Finance">
              <CustomerPaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/amount-receivable"
          element={
            <ProtectedRoute module="Finance">
              <AmountReceivablePage />
            </ProtectedRoute>
          }
        />

        {/* Customer Routes */}
        <Route 
          path="/customer/registration" 
          element={
            <ProtectedRoute module="Customer">
              <CustomerList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/customer/record" 
          element={
            <ProtectedRoute module="Customer">
              <CustomerLedger />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/booking-customers" 
          element={
            <ProtectedRoute module="Booking">
              <Bookings />
            </ProtectedRoute>
          } 
        />
        
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
        <Route path="/security/user" element={<User />} />
        <Route path="/security/software-group" element={<SoftwareGroup />} />
        <Route path="/security/user-to-group" element={<UserToGroup />} />
        <Route path="/security/access-control" element={<AccessControl />} />
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
