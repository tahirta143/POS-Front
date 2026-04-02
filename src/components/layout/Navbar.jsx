import React, { useEffect, useRef, useState } from 'react';
import { MdNotifications, MdAccountCircle, MdLogout, MdCheck, MdDoneAll } from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { logout } from '../../features/auth/authSlice';
import axiosInstance from '../../services/axiosInstance';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/items': 'Item Details',
  '/stock/opening': 'Opening Stock',
  '/stock/closing': 'Closing Stock',
  '/stock/reorder': 'Reorder Stock',
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
  '/expense/head': 'Expense Head',
  '/expense/voucher': 'Expense Voucher',
  '/expense/report': 'Expense Report',
  '/customers': 'Customers',
  '/booking-customers': 'Bookings',
  '/security': 'Security Modules',
};

const Navbar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  
  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  
  // Get page title based on current path
  const getPageTitle = () => {
    const path = location.pathname;
    // Check exact match first
    if (pageTitles[path]) return pageTitles[path];
    // Check parent routes
    const parentPath = Object.keys(pageTitles).find(p => path.startsWith(p + '/'));
    if (parentPath) return pageTitles[parentPath];
    return 'POS System';
  };

  // Fetch notifications
  async function fetchNotifications() {
    try {
      const res = await axiosInstance.get('/notifications');
      const data = res.data?.data || res.data || [];
      setNotifications(data);
      const unread = data.filter(n => !n.is_read && !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }

  // Mark single notification as read
  async function markAsRead(id) {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => 
        (n.id === id ? { ...n, is_read: true, read: true } : n)
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      toast.error('Failed to mark notification as read');
    }
  }

  // Mark all notifications as read
  async function markAllAsRead() {
    try {
      await axiosInstance.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  }

  // Fetch notifications on mount and every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
  };
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h2>
      </div>
      <div className="flex items-center gap-4 text-gray-500">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="hover:text-teal-600 transition-colors relative"
          >
            <MdNotifications className="text-2xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {/* Notifications Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-800">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1"
                  >
                    <MdDoneAll /> Mark all read
                  </button>
                )}
              </div>
              
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 20).map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition ${
                        !notification.is_read && !notification.read ? 'bg-teal-50/30' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                          !notification.is_read && !notification.read ? 'bg-teal-500' : 'bg-gray-300'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${
                            !notification.is_read && !notification.read ? 'font-medium text-gray-800' : 'text-gray-600'
                          }`}>
                            {notification.title || notification.message || 'New notification'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {notification.message || notification.body || ''}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(notification.created_at || notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.is_read && !notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="text-teal-600 hover:text-teal-700 p-1"
                            title="Mark as read"
                          >
                            <MdCheck className="text-sm" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {notifications.length > 20 && (
                <div className="px-4 py-2 text-center border-t border-gray-100 bg-gray-50">
                  <span className="text-xs text-gray-500">
                    +{notifications.length - 20} more notifications
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 border-l pl-4 border-gray-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-gray-700">{user?.name || 'Admin User'}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role || 'Administrator'}</p>
          </div>
          <MdAccountCircle className="text-3xl text-teal-600" />
          <button onClick={handleLogout} className="ml-2 text-gray-400 hover:text-red-500 transition-colors focus:outline-none" title="Logout">
            <MdLogout className="text-2xl" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
