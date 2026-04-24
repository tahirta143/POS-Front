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
import Manufacturers from "./pages/setup/Manufacturers";
import Bookings from "./pages/customers/Bookings";
import Sales from "./pages/Sales";
import OpeningStock from "./pages/stock/OpeningStock";
import PurchasePage from "./pages/Purchase";
import ExpiryTagsPage from "./pages/ExpiryTags";
import ReOrderStock from "./pages/stock/ReOrderStock";

import Security from "./pages/Security";
import UserModule from "./pages/security/UserModule";
import GroupRights from "./pages/security/GroupRights";
import Company from "./pages/security/Company";
import Employee from "./pages/security/Employee";
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
            <ProtectedRoute module="Items" action="read">
              <OpeningStock />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock/reorder"
          element={
            <ProtectedRoute module="Reorder" action="read">
              <ReOrderStock />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock/sales-return"
          element={
            <ProtectedRoute module="Sale Return" action="create">
              <SalesReturnPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock/purchase-return"
          element={
            <ProtectedRoute module="Purchase Return" action="read">
              <PurchaseReturnPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock/grn"
          element={
            <ProtectedRoute module="Goods Receipt" action="read">
              <GoodsReceiptNotePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock/transfer"
          element={
            <ProtectedRoute module="Stock" action="transfer">
              <StockTransferPage />
            </ProtectedRoute>
          }
        />

        {/* Items */}
        <Route
          path="/items"
          element={
            <ProtectedRoute module="Items" action="read">
              <ItemList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expiry-tags"
          element={
            <ProtectedRoute module="Items" action="read">
              <ExpiryTagsPage />
            </ProtectedRoute>
          }
        />

        {/* Sales & Purchase */}
        <Route
          path="/purchase"
          element={
            <ProtectedRoute module="Purchase" action="read">
              <PurchasePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sale"
          element={
            <ProtectedRoute module="Sale" action="read">
              <Sales />
            </ProtectedRoute>
          }
        />

        {/* Finance Routes */}
        <Route
          path="/finance/supplier-payment"
          element={
            <ProtectedRoute module="Supplier Payment" action="read">
              <SupplierPaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/amount-payable"
          element={
            <ProtectedRoute module="Supplier Payment" action="read">
              <AmountPayablePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/supplier-ledger"
          element={
            <ProtectedRoute module="Supplier Ledger" action="read">
              <SupplierLedgerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/customer-payment"
          element={
            <ProtectedRoute module="Customer Payment" action="create">
              <CustomerPaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/amount-receivable"
          element={
            <ProtectedRoute module="Customer Payment" action="read">
              <AmountReceivablePage />
            </ProtectedRoute>
          }
        />

        {/* Customer Routes */}
        <Route
          path="/customer/registration"
          element={
            <ProtectedRoute module="Customer" action="read">
              <CustomerList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/record"
          element={
            <ProtectedRoute module="Customer" action="read">
              <CustomerLedger />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking-customers"
          element={
            <ProtectedRoute module="Booking" action="read">
              <Bookings />
            </ProtectedRoute>
          }
        />

        {/* Setup Routes - Updated with correct module names */}
        <Route
          path="/setup/suppliers"
          element={
            <ProtectedRoute module="Supplier" action="read">
              <SupplierList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/manufacturers"
          element={
            <ProtectedRoute module="Manufacturer" action="read">
              <Manufacturers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/item-category"
          element={
            <ProtectedRoute module="Item Category" action="read">
              <ItemCategory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/item-subcategory"
          element={
            <ProtectedRoute module="Sub Category" action="read">
              <SubCategory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/item-type"
          element={
            <ProtectedRoute module="Item Type" action="read">
              <ItemType />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/item-unit"
          element={
            <ProtectedRoute module="Item Unit" action="read">
              <ItemUnit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/shelve-location"
          element={
            <ProtectedRoute module="Shelve Location" action="read">
              <ItemShelve />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/department"
          element={
            <ProtectedRoute module="Setup" action="read">
              <Department />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/designation"
          element={
            <ProtectedRoute module="Setup" action="read">
              <Designation />
            </ProtectedRoute>
          }
        />

        {/* Accounts/Expense Routes */}
        <Route
          path="/daybook"
          element={
            <ProtectedRoute module="Day Book" action="read">
              <Daybook />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expense/head"
          element={
            <ProtectedRoute module="Expense Head" action="read">
              <ExpenseHead />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expense/voucher"
          element={
            <ProtectedRoute module="Expense Voucher" action="read">
              <ExpenseVoucher />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expense/report"
          element={
            <ProtectedRoute module="Accounts" action="read">
              <ExpenseReport />
            </ProtectedRoute>
          }
        />

        {/* Security Routes */}
        <Route
          path="/security"
          element={
            <ProtectedRoute module="Security" action="read">
              <Security />
            </ProtectedRoute>
          }
        />
        <Route
          path="/security/user-module"
          element={
            <ProtectedRoute module="Security" action="read">
              <UserModule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/security/group-rights"
          element={
            <ProtectedRoute module="Security" action="read">
              <GroupRights />
            </ProtectedRoute>
          }
        />
        <Route
          path="/security/user-to-group"
          element={
            <ProtectedRoute module="Security" action="read">
              <UserToGroup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/security/access-control"
          element={
            <ProtectedRoute module="Security" action="read">
              <AccessControl />
            </ProtectedRoute>
          }
        />
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
