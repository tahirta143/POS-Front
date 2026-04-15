import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import ThemeToggle from "./ThemeToggle";
import {
  MdDashboard,
  MdSettings,
  MdInventory,
  MdMonetizationOn,
  MdPeople,
  MdShoppingCart,
  MdExpandMore,
  MdLogout,
  MdWarehouse,
  MdAddBox,
  MdRemoveCircle,
  MdRefresh,
  MdCategory,
  MdBusiness,
  MdLabel,
  MdQrCode2,
  MdLocationOn,
  MdReceipt,
  MdAccountBalance,
  MdAssessment,
  MdLocalOffer,
  MdCalendarToday,
  MdSecurity,
  MdApartment,
  MdBadge,
  MdPerson,
  MdFactory,
  MdLocalShipping,
  MdStorefront,
  MdCorporateFare,
  MdWorkspaces,
  MdStyle,
  MdMenu,
  MdClose,
  MdHistory,
  MdViewModule,
  MdExtension,
  MdLockPerson,
  MdAppRegistration,
  MdSwapHoriz,
  MdGroupWork,
  MdSearch,
  MdVpnKey,
} from "react-icons/md";
import { logout } from "../../features/auth/authSlice";

// ── Nav tree ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: MdDashboard },
  { to: "/items", label: "Item Details", icon: MdInventory },
  { to: "/sale", label: "Sales Invoice", icon: MdReceipt },
  { to: "/purchase", label: "Purchase", icon: MdShoppingCart },
  {
    id: "stock",
    label: "Stock",
    icon: MdWarehouse,
    children: [
      { to: "/stock/opening", label: "Opening Stock", icon: MdAddBox },
      { to: "/stock/reorder", label: "Reorder Stock", icon: MdRefresh },
      { to: "/stock/grn", label: "Goods Receipt", icon: MdReceipt },
      { to: "/stock/transfer", label: "Stock Transfer", icon: MdSwapHoriz },
      {
        to: "/stock/sales-return",
        label: "Sales Return",
        icon: MdRemoveCircle,
      },
      {
        to: "/stock/purchase-return",
        label: "Purchase Return",
        icon: MdRemoveCircle,
      },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: MdAccountBalance,
    children: [
      {
        to: "/finance/supplier-payment",
        label: "Supplier Payment",
        icon: MdMonetizationOn,
      },
      {
        to: "/finance/amount-payable",
        label: "Amount Payable",
        icon: MdAssessment,
      },
      {
        to: "/finance/supplier-ledger",
        label: "Supplier Ledger",
        icon: MdReceipt,
      },
      {
        to: "/finance/customer-payment",
        label: "Customer Payment",
        icon: MdMonetizationOn,
      },
      {
        to: "/finance/amount-receivable",
        label: "Amount Receivable",
        icon: MdAssessment,
      },
    ],
  },
  {
    id: "customer",
    label: "Customer",
    icon: MdPeople,
    children: [
      {
        to: "/customer/registration",
        label: "Registration",
        icon: MdAccountBalance,
      },
      { to: "/customer/record", label: "Customer Record", icon: MdReceipt },
    ],
  },
  { to: "/booking-customers", label: "Bookings", icon: MdCalendarToday },
  
  {
    id: "accounts",
    label: "Accounts",
    icon: MdMonetizationOn,
    children: [
      { to: "/daybook", label: "Daybook", icon: MdCalendarToday },
      { to: "/expense/head", label: "Expense Head", icon: MdAccountBalance },
      { to: "/expense/voucher", label: "Expense Voucher", icon: MdReceipt },
      { to: "/expense/report", label: "Expense Report", icon: MdAssessment },
    ],
  },
  {
    id: "setup",
    label: "Setup",
    icon: MdSettings,
    children: [
      { to: "/setup/suppliers", label: "Suppliers", icon: MdLocalShipping },
      { to: "/setup/manufacturers", label: "Manufacturers", icon: MdFactory },
      {
        id: "setup-item",
        label: "Item",
        icon: MdWorkspaces,
        children: [
          {
            to: "/setup/item-category",
            label: "Item Category",
            icon: MdCategory,
          },
          {
            to: "/setup/item-subcategory",
            label: "Item Subcategory",
            icon: MdStyle,
          },
          { to: "/setup/item-type", label: "Item Type", icon: MdInventory },
          { to: "/setup/item-unit", label: "Item Unit", icon: MdLabel },
          { to: "/setup/item-barcode", label: "Item Barcode", icon: MdQrCode2 },
          { to: "/expiry-tags", label: "Expiry Tags", icon: MdLocalOffer },
          {
            to: "/setup/shelve-location",
            label: "Shelve Location",
            icon: MdLocationOn,
          },
        ],
      },
      {
        id: "setup-company",
        label: "Company",
        icon: MdCorporateFare,
        children: [
          { to: "/setup/department", label: "Department", icon: MdApartment },
          { to: "/setup/designation", label: "Designation", icon: MdBadge },
        ],
      },
    ],
  },
  {
    id: "security-settings",
    label: "Security",
    icon: MdSecurity,
    children: [
      { to: "/security", label: "Overview", icon: MdDashboard },
      {
        id: "security-manage",
        label: "Actions",
        icon: MdExpandMore,
        children: [
          { to: "/security/company", label: "Company", icon: MdCorporateFare },
          { to: "/security/employee", label: "Employee", icon: MdBadge },
          {
            to: "/security/software-group",
            label: "Software Group",
            icon: MdWorkspaces,
          },
          { to: "/security/user", label: "Users", icon: MdPerson },
          {
            to: "/security/group-users",
            label: "Group Users",
            icon: MdAppRegistration,
          },
          {
            to: "/security/user-to-group",
            label: "User to Group",
            icon: MdPeople,
          },
          {
            to: "/security/security-log",
            label: "Security Log",
            icon: MdHistory,
          },
          { to: "/security/module-info", label: "Modules", icon: MdViewModule },
          {
            to: "/security/module-functions",
            label: "Module Functions",
            icon: MdStyle,
          },
          {
            to: "/security/group-rights",
            label: "Group Rights",
            icon: MdSecurity,
          },
          {
            to: "/security/user-module",
            label: "Users Module Access",
            icon: MdSettings,
          },
        ],
      },
    ],
  },
];

// ── helpers ───────────────────────────────────────────────────────────────────
function pathMatchesItem(item, pathname) {
  if (item.to) return pathname.startsWith(item.to);
  return item.children?.some((c) => pathMatchesItem(c, pathname));
}

// ── Level-2 nested dropdown ───────────────────────────────────────────────────
function NestedDropdown({ item, openId, setOpenId }) {
  const location = useLocation();
  const isActive = item.children?.some((c) =>
    pathMatchesItem(c, location.pathname),
  );
  const isOpen = openId === item.id;

  function toggle() {
    setOpenId(isOpen ? null : item.id);
  }

  return (
    <div>
      <button
        onClick={toggle}
        style={isActive ? { backgroundColor: "#14b8a6", color: "#ffffff" } : undefined}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
          isActive
            ? "bg-teal-500 text-white font-medium shadow-sm"
            : "text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-800 dark:hover:text-slate-100"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`flex items-center justify-center w-6 h-6 rounded-md text-xs transition-colors ${
              isActive
                ? "bg-teal-400 dark:bg-teal-600 text-white"
                : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400"
            }`}
          >
            {item.icon && <item.icon />}
          </span>
          {item.label}
        </div>
        <MdExpandMore
          className={`text-base transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="ml-3 mt-0.5 mb-1 border-l-2 border-teal-100 pl-2 space-y-0.5">
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              style={({ isActive }) =>
                isActive
                  ? { backgroundColor: "#14b8a6", color: "#ffffff" }
                  : undefined
              }
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] transition-all duration-150 transition-colors ${
                  isActive
                    ? "bg-teal-500 text-white font-medium shadow-sm"
                    : "text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-800 dark:hover:text-slate-100"
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
  );
}

// ── Level-1 sidebar item ──────────────────────────────────────────────────────
function SidebarItem({ item, openId, setOpenId, onNavigate }) {
  const location = useLocation();
  const isActive = pathMatchesItem(item, location.pathname);
  const isOpen = openId === item.id;

  // Pure link — no children
  if (item.to) {
    return (
      <NavLink
        to={item.to}
        onClick={onNavigate}
        style={({ isActive }) =>
          isActive ? { backgroundColor: "#14b8a6", color: "#ffffff" } : undefined
        }
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-150 transition-colors ${
            isActive
              ? "bg-teal-500 text-white shadow-sm"
              : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-slate-100"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={`flex items-center justify-center w-7 h-7 rounded-lg text-sm shrink-0 transition-colors ${
                isActive
                  ? "bg-teal-400 dark:bg-teal-600 text-white"
                  : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400"
              }`}
            >
              {item.icon && <item.icon />}
            </span>
            <span className="font-medium text-[13px]">{item.label}</span>
          </>
        )}
      </NavLink>
    );
  }

  // Has children
  function toggle() {
    setOpenId(isOpen ? null : item.id);
  }

  return (
    <div className="mb-0.5">
      <button
        onClick={toggle}
        style={isActive ? { backgroundColor: "#14b8a6", color: "#ffffff" } : undefined}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-150 transition-colors ${
          isActive
            ? "bg-teal-500 text-white shadow-sm"
            : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-slate-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center justify-center w-7 h-7 rounded-lg text-sm shrink-0 transition-colors ${
              isActive
                ? "bg-teal-400 dark:bg-teal-600 text-white"
                : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400"
            }`}
          >
            {item.icon && <item.icon />}
          </span>
          <span className="font-medium text-[13px]">{item.label}</span>
        </div>
        <MdExpandMore
          className={`text-base transition-transform duration-200 ${isActive ? "text-white" : "text-gray-400"} ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="ml-3 mt-1 mb-1 space-y-0.5 border-l-2 border-gray-100 dark:border-slate-800 pl-2">
          {/* Track nested open state independently per level-1 parent */}
          <NestedChildren children={item.children} onNavigate={onNavigate} />
        </div>
      )}
    </div>
  );
}

// ── Children renderer with its own nested open tracker ───────────────────────
function NestedChildren({ children, onNavigate }) {
  const [nestedOpenId, setNestedOpenId] = useState(() => {
    // Auto-open nested item if current path matches
    const loc = window.location.pathname;
    for (const c of children) {
      if (c.children?.some((gc) => loc.startsWith(gc.to))) return c.id;
    }
    return null;
  });

  return children.map((child) =>
    child.children ? (
      <NestedDropdown
        key={child.id}
        item={child}
        openId={nestedOpenId}
        setOpenId={setNestedOpenId}
      />
    ) : (
      <NavLink
        key={child.to}
        to={child.to}
        onClick={onNavigate}
        style={({ isActive }) =>
          isActive ? { backgroundColor: "#14b8a6", color: "#ffffff" } : undefined
        }
        className={({ isActive }) =>
          `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-all duration-150 transition-colors ${
            isActive
              ? "bg-teal-500 text-white font-medium shadow-sm"
              : "text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-800 dark:hover:text-slate-100"
          }`
        }
      >
        {child.icon && <child.icon className="text-base shrink-0" />}
        {child.label}
      </NavLink>
    ),
  );
}

// ── Sidebar shell ─────────────────────────────────────────────────────────────
function SidebarContent({ onNavigate }) {
  const dispatch = useDispatch();
  const location = useLocation();

  // Only ONE level-1 item open at a time
  const [openId, setOpenId] = useState(() => {
    for (const item of NAV_ITEMS) {
      if (item.children && pathMatchesItem(item, location.pathname))
        return item.id;
    }
    return null;
  });

  // Close others when one opens
  function handleSetOpenId(id) {
    setOpenId(id);
  }

  return (
    <div className="w-64 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 h-full flex flex-col shadow-md dark:shadow-none transition-colors duration-300">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 dark:border-slate-800 shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-teal-500 dark:bg-teal-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
            <MdStorefront className="text-white text-lg" />
          </div>
          <div className="truncate">
            <h1 className="text-sm font-bold text-gray-800 dark:text-slate-100 leading-none">
              POS System
            </h1>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">Management Suite</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 custom-scrollbar">
        {NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.id || item.to}
            item={item}
            openId={openId}
            setOpenId={handleSetOpenId}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      {/* Logout */}
      <div className="border-t border-gray-100 dark:border-slate-800 p-3 shrink-0 transition-colors duration-300">
        <button
          onClick={() => dispatch(logout())}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-900/20 transition-colors duration-150 group"
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 dark:bg-rose-900/40 text-red-400 dark:text-rose-300 group-hover:bg-red-100 transition-colors">
            <MdLogout className="text-base" />
          </span>
          <span className="font-medium text-[13px]">Logout</span>
        </button>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
const Sidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const overlayRef = useRef(null);

  // Close on route change (mobile)
  const location = useLocation();
  useEffect(() => {
    const timer = setTimeout(() => {
      setMobileOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Close on ESC
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* ── Hamburger button (mobile/tablet only) ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm text-gray-600 hover:bg-gray-50 transition-colors"
        aria-label="Open menu"
      >
        <MdMenu className="text-xl" />
      </button>

      {/* ── Desktop sidebar (always visible) ── */}
      <div className="hidden md:flex h-full">
        <SidebarContent onNavigate={() => {}} />
      </div>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            ref={overlayRef}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer — slides in from left */}
          <div className="relative z-10 flex h-full animate-in slide-in-from-left-4 duration-200">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />

            {/* Close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-[-44px] w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm text-gray-600 hover:bg-gray-50 transition-colors"
              aria-label="Close menu"
            >
              <MdClose className="text-xl" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
