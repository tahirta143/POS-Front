import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  MdDashboard, MdSettings, MdInventory, MdMonetizationOn,
  MdPeople, MdShoppingCart, MdExpandMore, MdExpandLess, MdLogout,
  MdWarehouse, MdAddBox, MdRemoveCircle, MdRefresh,
  MdCategory, MdBusiness, MdLabel, MdQrCode2, MdLocationOn,
  MdReceipt, MdAccountBalance, MdAssessment,
  MdLocalOffer, MdCalendarToday, MdSecurity, MdApartment, MdBadge,
  MdPerson, MdFactory, MdLocalShipping, MdStorefront,
  MdCorporateFare, MdWorkspaces, MdStyle
} from 'react-icons/md';
import { logout } from '../../features/auth/authSlice';

// ── Nested child dropdown (level 2) ──────────────────────────────────────────
function NestedDropdown({ item }) {
  const location = useLocation()
  const isActive = item.children?.some(c => location.pathname.startsWith(c.to))
  const [isOpen, setIsOpen] = useState(isActive)

  return (
    <div className="rounded-md overflow-hidden">
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all duration-150 ${
          isActive
            ? 'bg-teal-50 text-teal-700 font-medium'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className={`flex items-center justify-center w-6 h-6 rounded-md text-xs ${
            isActive ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-500'
          }`}>
            {item.icon && <item.icon className="text-sm" />}
          </span>
          <span className="text-[13px]">{item.label}</span>
        </div>
        <span className={`text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <MdExpandMore />
        </span>
      </button>

      {isOpen && (
        <div className="ml-3 mt-0.5 mb-1 border-l-2 border-teal-100 pl-2 space-y-0.5">
          {item.children.map((child, idx) => (
            <NavLink
              key={idx}
              to={child.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[12px] transition-all duration-150 ${
                  isActive
                    ? 'bg-teal-500 text-white font-medium shadow-sm shadow-teal-200'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              {child.icon && <child.icon className="text-sm shrink-0" />}
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Top-level sidebar item (level 1) ─────────────────────────────────────────
const SidebarItem = ({ to, label, icon: Icon, children, color = 'teal' }) => {
  const location = useLocation()
  const isActive = to
    ? location.pathname === to
    : children?.some(c =>
        c.to
          ? location.pathname.startsWith(c.to)
          : c.children?.some(gc => location.pathname.startsWith(gc.to))
      )
  const [isOpen, setIsOpen] = useState(isActive)

  if (children) {
    return (
      <div className="mb-0.5">
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-150 ${
            isActive
              ? 'bg-teal-50 text-teal-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-sm ${
              isActive ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-500'
            }`}>
              {Icon && <Icon />}
            </span>
            <span className="font-medium text-[13px]">{label}</span>
          </div>
          <span className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <MdExpandMore />
          </span>
        </button>

        {isOpen && (
          <div className="ml-3 mt-1 mb-1 space-y-0.5 border-l-2 border-gray-100 pl-2">
            {children.map((child, idx) =>
              child.children ? (
                <NestedDropdown key={idx} item={child} />
              ) : (
                <NavLink
                  key={idx}
                  to={child.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-all duration-150 ${
                      isActive
                        ? 'bg-teal-500 text-white font-medium shadow-sm shadow-teal-200'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                    }`
                  }
                >
                  {child.icon && <child.icon className="text-base shrink-0" />}
                  {child.label}
                </NavLink>
              )
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-150 ${
          isActive
            ? 'bg-teal-500 text-white shadow-sm shadow-teal-200'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-sm ${
            isActive ? 'bg-teal-400 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {Icon && <Icon />}
          </span>
          <span className="font-medium text-[13px]">{label}</span>
        </>
      )}
    </NavLink>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = () => {
  const dispatch = useDispatch()
  const handleLogout = () => dispatch(logout())

  return (
    <aside className="w-64 bg-white border-r border-gray-100 h-full flex flex-col shadow-md hidden md:flex">

      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center shadow-sm">
            <MdStorefront className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-800 leading-none">POS System</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">Management Suite</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 custom-scrollbar">
        <SidebarItem to="/dashboard"         label="Dashboard"     icon={MdDashboard} />
        <SidebarItem to="/items"             label="Item Details"  icon={MdInventory} />
        <SidebarItem to="/sale"              label="Sales Invoice" icon={MdReceipt} />
        <SidebarItem to="/purchase"          label="Purchase"      icon={MdShoppingCart} />

        <SidebarItem to="/stock" label="Stock" icon={MdWarehouse}>
          {[
            { to: '/stock/opening', label: 'Opening Stock', icon: MdAddBox },
            { to: '/stock/closing', label: 'Closing Stock', icon: MdRemoveCircle },
            { to: '/stock/reorder', label: 'Reorder Stock', icon: MdRefresh },
          ]}
        </SidebarItem>
        <SidebarItem to="/customer" label="Customer" icon={MdPeople}>
          {[
            { to: '/customer/registration',    label: 'Customer Registration',    icon: MdAccountBalance },
            { to: '/customer/record', label: 'Customer Record', icon: MdReceipt },
          ]}
        </SidebarItem>
        <SidebarItem to="/booking-customers" label="Bookings"     icon={MdCalendarToday} />
        <SidebarItem to="/expiry-tags"       label="Expiry Tags"  icon={MdLocalOffer} />

        <SidebarItem to="/accounts" label="Accounts" icon={MdMonetizationOn}>
          {[
            { to: '/daybook',        label: 'Daybook',        icon: MdCalendarToday },
            { to: '/expense/head',    label: 'Expense Head',    icon: MdAccountBalance },
            { to: '/expense/voucher', label: 'Expense Voucher', icon: MdReceipt },
            { to: '/expense/report',  label: 'Expense Report',  icon: MdAssessment },
          ]}
        </SidebarItem>

        <SidebarItem to="/setup" label="Setup" icon={MdSettings}>
          {[
            { to: '/setup/suppliers',     label: 'Suppliers',     icon: MdLocalShipping },
            { to: '/setup/manufacturers', label: 'Manufacturers', icon: MdFactory },

            // ── Nested: Item ──
            {
              label: 'Item',
              icon: MdWorkspaces,
              children: [
                { to: '/setup/item-category',    label: 'Item Category',    icon: MdCategory },
                { to: '/setup/item-subcategory', label: 'Item Subcategory', icon: MdStyle },
                { to: '/setup/item-type',        label: 'Item Type',        icon: MdInventory },
                { to: '/setup/item-unit',        label: 'Item Unit',        icon: MdLabel },
                { to: '/setup/item-barcode',     label: 'Item Barcode',     icon: MdQrCode2 },
                { to: '/setup/shelve-location',  label: 'Shelve Location',  icon: MdLocationOn },
              ],
            },

            // ── Nested: Company ──
            {
              label: 'Company',
              icon: MdCorporateFare,
              children: [
                { to: '/setup/department',  label: 'Department',  icon: MdApartment },
                { to: '/setup/designation', label: 'Designation', icon: MdBadge },
                { to: '/setup/employee',    label: 'Employee',    icon: MdPerson },
              ],
            },
          ]}
        </SidebarItem>

        <SidebarItem to="/security" label="Security" icon={MdSecurity} />
      </div>

      {/* Logout */}
      <div className="border-t border-gray-100 p-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors duration-150 group"
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 text-red-400 group-hover:bg-red-100 transition-colors">
            <MdLogout className="text-base" />
          </span>
          <span className="font-medium text-[13px]">Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar