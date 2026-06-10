import React, { useEffect, useRef, useState } from "react";
import {
  MdNotifications,
  MdLogout,
  MdDoneAll,
  MdPerson,
  MdExpandMore,
} from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { logout } from "../../features/auth/authSlice";
import axiosInstance from "../../services/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";

const pageTitles = {
  "/dashboard": "Dashboard",
  "/items": "Item Details",
  "/stock/opening": "Opening Stock",
  "/stock/reorder": "Reorder Stock",
  "/stock/grn": "Goods Receipt Note",
  "/stock/sales-return": "Sales Return",
  "/stock/purchase-return": "Purchase Return",
  "/purchase": "Purchase",
  "/sale": "Sales Invoice",
  "/expiry-tags": "Expiry Tags",
  "/setup/suppliers": "Suppliers",
  "/setup/manufacturers": "Manufacturers",
  "/setup/item-category": "Item Category",
  "/setup/item-unit": "Item Unit",
  "/setup/item-subcategory": "Item Subcategory",
  "/setup/item-type": "Item Type",
  "/setup/item-barcode": "Item Barcode",
  "/setup/shelve-location": "Shelve Location",
  "/setup/department": "Department",
  "/setup/designation": "Designation",
  "/security/company": "Company",
  "/security/employee": "Employee",
  "/security/user": "Users",
  "/security/group-users": "Group Users",
  "/security/user-to-group": "User To Group",
  "/security/security-log": "Security Log",
  "/security/module-info": "Modules",
  "/security/module-functions": "Module Functions",
  "/security/group-rights": "Group Rights",
  "/security/user-module": "Users Module Access",
  "/expense/head": "Expense Head",
  "/expense/voucher": "Expense Voucher",
  "/expense/report": "Expense Report",
  "/daybook": "Daybook",
  "/customer/registration": "Customer Registration",
  "/customer/record": "Customer Ledger",
  "/booking-customers": "Bookings",
  "/finance/supplier-account": "Supplier Account",
  "/finance/customer-account": "Customer Account",
  "/finance/supplier-payment": "Supplier Payment",
  "/finance/amount-payable": "Amount Payable",
  "/finance/supplier-ledger": "Supplier Ledger",
  "/finance/customer-payment": "Customer Payment",
  "/finance/amount-receivable": "Amount Receivable",
  "/profile": "My Profile",
  "/security": "Security Modules",
};

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const getPageTitle = () => {
    const path = location.pathname;
    if (pageTitles[path]) return pageTitles[path];
    const parentPath = Object.keys(pageTitles).find((p) =>
      path.startsWith(p + "/"),
    );
    if (parentPath) return pageTitles[parentPath];

    const fallbackTitle = path
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/[-_]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

    return fallbackTitle || "Dashboard";
  };

  const pageTitle = getPageTitle();

  async function fetchNotifications() {
    try {
      const res = await axiosInstance.get("/notifications");
      const data = res.data?.data || res.data || [];
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read && !n.read).length);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }

  async function markAsRead(id) {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true, read: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      toast.error("Failed to mark notification as read");
    }
  }

  async function markAllAsRead() {
    try {
      await axiosInstance.patch("/notifications/read-all");
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read: true })),
      );
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target))
        setShowProfile(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => dispatch(logout());

  const initials = (user?.name || "A")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="relative flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-gray-100/80 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-md transition-colors duration-300 z-40 dark:border-slate-800 dark:bg-slate-900/95 sm:px-5 md:px-6 md:py-2.5">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-primary-500/20 via-primary-500/40 to-primary-500/20 dark:via-primary-500/30" />

      {/* ── Left: Page Title ── */}
      <div className="flex min-w-0 flex-1 items-center gap-2 pl-11 sm:gap-3 lg:pl-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-primary-500 text-white ring-1 ring-primary-400 shadow-md dark:bg-primary-600 dark:ring-primary-500 sm:h-9 sm:w-9">
          <div className="h-5 w-1.5 rounded-full bg-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 sm:text-[10px]">
            Workspace
          </p>
          <h2 className="truncate text-[14px] font-extrabold tracking-tight text-gray-900 dark:text-slate-100 sm:text-[16px]">
            {pageTitle}
          </h2>
        </div>
      </div>

      {/* ── Right: Actions ── */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotif(!showNotif);
              setShowProfile(false);
            }}
            className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all ${
              showNotif
                ? "bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400"
                : "text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
            }`}
          >
            <MdNotifications className="text-xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold px-1 ring-2 ring-white dark:ring-slate-900">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotif && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-[-0.25rem] mt-3 w-[min(20rem,calc(100vw-0.75rem))] rounded-2xl border border-gray-100 bg-white shadow-2xl ring-1 ring-black/5 z-50 overflow-hidden dark:border-slate-700 dark:bg-slate-800 sm:right-0 sm:w-[min(20rem,calc(100vw-1rem))]"
              >
                <div className="flex items-start justify-between gap-3 border-b border-gray-100 bg-slate-50/50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/50 sm:items-center sm:px-4">
                  <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary-50 px-2 py-1 text-[10px] font-bold text-primary-600 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/35 sm:bg-transparent sm:px-0 sm:py-0 sm:text-[11px] sm:hover:bg-transparent sm:hover:underline"
                    >
                      <MdDoneAll /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[min(60vh,20rem)] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-10 text-center text-gray-400">
                      <p className="text-xs">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`cursor-pointer border-b border-gray-50 px-3 py-3 transition-colors hover:bg-gray-50 dark:border-slate-700/50 dark:hover:bg-slate-700/50 sm:px-4 ${!n.is_read && !n.read ? "bg-primary-50/40 dark:bg-primary-900/10" : ""}`}
                      >
                        <p
                          className={`pr-6 text-[12px] leading-5 sm:text-[13px] ${!n.is_read && !n.read ? "font-bold text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}
                        >
                          {n.title || n.message}
                        </p>
                        {!n.is_read && !n.read && (
                          <span className="mt-2 inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                            New
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1" />

        {/* ── Profile Dropdown Fix ── */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotif(false);
            }}
            className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl transition-all sm:gap-2.5 sm:pr-2.5 ${
              showProfile
                ? "bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-200 dark:ring-primary-800"
                : "hover:bg-gray-100 dark:hover:bg-slate-800"
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-emerald-500 flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="text-left hidden md:block">
              <p className="text-[13px] font-bold text-gray-800 dark:text-slate-100 leading-none">
                {user?.name || "Admin User"}
              </p>
              <p className="text-[10px] font-medium text-gray-400 dark:text-slate-400 mt-1 uppercase tracking-wider">
                {user?.role || "Administrator"}
              </p>
            </div>
            <MdExpandMore
              className={`hidden text-lg text-gray-400 transition-transform dark:text-slate-400 sm:block ${showProfile ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-[min(15rem,calc(100vw-1rem))] rounded-2xl border border-gray-100 bg-white shadow-2xl ring-1 ring-black/5 z-50 overflow-hidden dark:border-slate-700 dark:bg-slate-800"
              >
                {/* Header inside dropdown */}
                <div className="px-4 py-4 border-b border-gray-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-emerald-500 flex items-center justify-center shadow-inner">
                      <span className="text-white text-sm font-bold">
                        {initials}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-bold text-gray-900 dark:text-white">
                        {user?.name || "Admin User"}
                      </p>
                      <p className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-tighter">
                        {user?.role || "Administrator"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setShowProfile(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-600 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-slate-700/50 hover:text-primary-700 dark:hover:text-primary-300 transition-all"
                  >
                    <MdPerson className="text-lg" /> My Profile
                  </button>

                  <div className="h-px bg-gray-100 dark:bg-slate-700/50 mx-2" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all"
                  >
                    <MdLogout className="text-lg" /> Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
