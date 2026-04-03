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
  MdPerson
} from 'react-icons/md';
import { logout } from '../../features/auth/authSlice';

// ── Nested child dropdown (level 2) ─────────────────────────────────────────
function NestedDropdown({ item, depth = 0 }) {
  const location = useLocation()
  const isActive = item.children?.some(c => location.pathname.startsWith(c.to))
  const [isOpen, setIsOpen] = useState(isActive)

  return (
    <div>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between px-4 py-2 rounded-md text-sm transition-colors ${
          isActive
            ? 'bg-teal-50 text-teal-700'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <div className="flex items-center gap-3">
          {item.icon && <item.icon className="text-lg" />}
          <span>{item.label}</span>
        </div>
        {isOpen ? <MdExpandLess className="text-sm" /> : <MdExpandMore className="text-sm" />}
      </button>

      {isOpen && (
        <div className="ml-4 mt-1 space-y-1 border-l-2 border-teal-100 pl-2">
          {item.children.map((child, idx) => (
            <NavLink
              key={idx}
              to={child.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-teal-500 text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {child.icon && <child.icon className="text-base" />}
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Top-level sidebar item (level 1) ─────────────────────────────────────────
const SidebarItem = ({ to, label, icon: Icon, children }) => {
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
      <div className="mb-1">
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-md transition-colors ${
            isActive
              ? 'bg-teal-50 text-teal-700'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {Icon && <Icon className="text-xl" />}
            <span className="font-medium text-sm">{label}</span>
          </div>
          {isOpen ? <MdExpandLess /> : <MdExpandMore />}
        </button>

        {isOpen && (
          <div className="ml-6 mt-1 space-y-1">
            {children.map((child, idx) =>
              // ── Render nested dropdown if child has children ──
              child.children ? (
                <NestedDropdown key={idx} item={child} />
              ) : (
                <NavLink
                  key={idx}
                  to={child.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-teal-500 text-white'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  {child.icon && <child.icon className="text-lg" />}
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
        `flex items-center gap-3 px-4 py-2.5 rounded-md mb-1 transition-colors ${
          isActive
            ? 'bg-teal-500 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      {Icon && <Icon className="text-xl" />}
      <span className="font-medium text-sm">{label}</span>
    </NavLink>
  )
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = () => {
  const dispatch = useDispatch()
  const handleLogout = () => dispatch(logout())

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-full flex flex-col shadow-sm hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-teal-600 flex items-center gap-2">
          <MdInventory /> POS System
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        <SidebarItem to="/dashboard"          label="Dashboard"  icon={MdDashboard} />
        <SidebarItem to="/items"              label="Item Details" icon={MdInventory} />

        <SidebarItem to="/stock" label="Stock" icon={MdWarehouse}>
          {[
            { to: '/stock/opening', label: 'Opening Stock', icon: MdAddBox },
            { to: '/stock/closing', label: 'Closing Stock', icon: MdRemoveCircle },
            { to: '/stock/reorder', label: 'Reorder Stock', icon: MdRefresh },
          ]}
        </SidebarItem>

        <SidebarItem to="/purchase"           label="Purchase"      icon={MdShoppingCart} />
        <SidebarItem to="/sale"               label="Sales Invoice" icon={MdReceipt} />
        <SidebarItem to="/customers"          label="Customers"     icon={MdPeople} />
        <SidebarItem to="/booking-customers"  label="Bookings"      icon={MdCalendarToday} />
        <SidebarItem to="/expiry-tags"        label="Expiry Tags"   icon={MdLocalOffer} />

        <SidebarItem to="/setup" label="Setup" icon={MdSettings}>
          {[
            { to: '/setup/suppliers',        label: 'Suppliers',        icon: MdBusiness },
            { to: '/setup/manufacturers',    label: 'Manufacturers',    icon: MdBusiness },
            { to: '/setup/item-category',    label: 'Item Category',    icon: MdCategory },
            { to: '/setup/item-unit',        label: 'Item Unit',        icon: MdLabel },
            { to: '/setup/item-subcategory', label: 'Item Subcategory', icon: MdCategory },
            { to: '/setup/item-type',        label: 'Item Type',        icon: MdInventory },
            { to: '/setup/item-barcode',     label: 'Item Barcode',     icon: MdQrCode2 },
            // ── Nested: Company ──────────────────────────────────────
            {
              label: 'Company',
              icon: MdBusiness,
              children: [
                { to: '/setup/company',      label: 'Company',      icon: MdBusiness },
                { to: '/setup/department',   label: 'Department',   icon: MdApartment },
                { to: '/setup/designation',  label: 'Designation',  icon: MdBadge },
                { to: '/setup/employee',     label: 'Employee',     icon: MdPerson },
              ],
            },
            { to: '/setup/shelve-location',  label: 'Shelve Location', icon: MdLocationOn },
          ]}
        </SidebarItem>

        <SidebarItem to="/expense" label="Expense" icon={MdMonetizationOn}>
          {[
            { to: '/expense/head',    label: 'Expense Head',    icon: MdAccountBalance },
            { to: '/expense/voucher', label: 'Expense Voucher', icon: MdReceipt },
            { to: '/expense/report',  label: 'Expense Report',  icon: MdAssessment },
          ]}
        </SidebarItem>

        <SidebarItem to="/security" label="Security" icon={MdSecurity} />
      </div>

      <div className="border-t border-gray-200 p-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-red-600 hover:bg-red-50 transition-colors"
        >
          <MdLogout className="text-xl" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar