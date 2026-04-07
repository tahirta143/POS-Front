import React, { useEffect, useRef, useState } from 'react';
import {
  MdNotifications, MdLogout, MdCheck,
  MdDoneAll, MdPerson, MdExpandMore
} from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { logout } from '../../features/auth/authSlice';
import axiosInstance from '../../services/axiosInstance';
import { useNavigate } from 'react-router-dom'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/items': 'Item Details',
  '/stock/opening': 'Opening Stock',
  '/stock/closing': 'Closing Stock',
  '/stock/reorder': 'Reorder Stock',
  '/stock/grn': 'Goods Receipt Note',
  '/stock/sales-return': 'Sales Return',
  '/stock/purchase-return': 'Purchase Return',
  '/purchase': 'Purchase',
  '/sale': 'Sales Invoice',
  '/expiry-tags': 'Expiry Tags',
  '/setup/suppliers': 'Suppliers',
  '/setup/manufacturers': 'Manufacturers',
  '/setup/item-category': 'Item Category',
  '/setup/item-unit': 'Item Unit',
  '/setup/item-subcategory': 'Item Subcategory',
  '/setup/item-type': 'Item Type',
  '/setup/item-barcode': 'Item Barcode',
  '/setup/shelve-location': 'Shelve Location',
  '/setup/department': 'Department',
  '/setup/designation': 'Designation',
  '/security/company': 'Company',
  '/security/employee': 'Employee',
  '/security/software-group': 'Software Group',
  '/security/user': 'Users',
  '/security/group-users': 'Group Users',
  '/security/user-to-group': 'User To Group',
  '/security/security-log': 'Security Log',
  '/security/module-info': 'Modules',
  '/security/module-functions': 'Module Functions',
  '/security/group-rights': 'Group Rights',
  '/security/user-module': 'Users Module Access',
  '/expense/head': 'Expense Head',
  '/expense/voucher': 'Expense Voucher',
  '/expense/report': 'Expense Report',
  '/daybook': 'Daybook',
  '/customer/registration': 'Customer Registration',
  '/customer/record': 'Customer Ledger',
  '/booking-customers': 'Bookings',
  '/finance/supplier-payment': 'Supplier Payment',
  '/finance/amount-payable': 'Amount Payable',
  '/finance/supplier-ledger': 'Supplier Ledger',
  '/finance/customer-payment': 'Customer Payment',
  '/finance/amount-receivable': 'Amount Receivable',
  '/profile': 'My Profile',
  '/security': 'Security Modules',
};

const Navbar = () => {
  const navigate = useNavigate()
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
    const parentPath = Object.keys(pageTitles).find(p => path.startsWith(p + '/'));
    if (parentPath) return pageTitles[parentPath];

    const fallbackTitle = path
      .split('/')
      .filter(Boolean)
      .pop()
      ?.replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

    return fallbackTitle || 'Dashboard';
  };

  const pageTitle = getPageTitle();

  async function fetchNotifications() {
    try {
      const res = await axiosInstance.get('/notifications');
      const data = res.data?.data || res.data || [];
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read && !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }

  async function markAsRead(id) {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      toast.error('Failed to mark notification as read');
    }
  }

  async function markAllAsRead() {
    try {
      await axiosInstance.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchNotifications();
    }, 0);
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => dispatch(logout());

  // Avatar initials fallback
  const initials = (user?.name || 'A')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-100 bg-white px-4 shadow-sm sm:px-5 md:px-6">

      {/* ── Left: Page title ── */}
      <div className="flex min-w-0 items-center gap-3 pl-12 md:pl-0">
        <div className="h-6 w-1 shrink-0 rounded-full bg-teal-500" />
        <h2 className="truncate text-[14px] font-bold tracking-tight text-gray-800 sm:text-[15px]">
          {pageTitle}
        </h2>
      </div>

      {/* ── Right: Actions ── */}
      <div className="flex items-center gap-2">

        {/* ── Notifications ── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotif(p => !p); setShowProfile(false); }}
            className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 ${showNotif ? 'bg-teal-50 text-teal-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              }`}
          >
            <MdNotifications className="text-xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold px-1 shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-[11px] text-teal-600 hover:text-teal-700 font-medium transition-colors"
                  >
                    <MdDoneAll className="text-sm" /> Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <MdNotifications className="text-3xl mb-2 opacity-40" />
                    <p className="text-xs">No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 20).map(n => {
                    const isUnread = !n.is_read && !n.read
                    return (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${isUnread ? 'bg-teal-50/40' : ''
                          }`}
                      >
                        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${isUnread ? 'bg-teal-500' : 'bg-gray-200'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] leading-snug ${isUnread ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                            {n.title || n.message || 'New notification'}
                          </p>
                          {n.message && n.title && (
                            <p className="text-[11px] text-gray-400 mt-0.5 truncate">{n.message}</p>
                          )}
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {new Date(n.created_at || n.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {isUnread && (
                          <button
                            onClick={e => { e.stopPropagation(); markAsRead(n.id); }}
                            className="shrink-0 text-teal-500 hover:text-teal-700 p-1 rounded-lg hover:bg-teal-50 transition-colors"
                            title="Mark as read"
                          >
                            <MdCheck className="text-sm" />
                          </button>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {notifications.length > 20 && (
                <div className="px-4 py-2 text-center border-t border-gray-100 bg-gray-50">
                  <span className="text-[11px] text-gray-400">+{notifications.length - 20} more</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* ── Profile dropdown ── */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile(p => !p); setShowNotif(false); }}
            className={`flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-xl transition-all duration-150 ${showProfile ? 'bg-teal-50' : 'hover:bg-gray-100'
              }`}
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            {/* Name + role */}
            <div className="text-left hidden md:block">
              <p className="text-[13px] font-semibold text-gray-800 leading-none">
                {user?.name || 'Admin User'}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5 capitalize leading-none">
                {user?.role || 'Administrator'}
              </p>
            </div>
            <MdExpandMore className={`text-gray-400 text-lg transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              {/* User info header */}
              <div className="px-4 py-3.5 border-b border-gray-100 bg-gradient-to-br from-teal-50 to-emerald-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-sm">
                    <span className="text-white text-sm font-bold">{initials}</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800">{user?.name || 'Admin User'}</p>
                    <p className="text-[11px] text-gray-500 capitalize">{user?.role || 'Administrator'}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => { navigate('/profile'); setShowProfile(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 text-gray-500">
                    <MdPerson className="text-base" />
                  </span>
                  My Profile
                </button>

                <div className="h-px bg-gray-100 mx-2" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-red-500 hover:bg-red-50 transition-colors"
                >
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 text-red-400">
                    <MdLogout className="text-base" />
                  </span>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
