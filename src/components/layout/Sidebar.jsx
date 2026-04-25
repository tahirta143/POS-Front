import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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
  MdAppRegistration,
  MdSwapHoriz,
} from "react-icons/md";
import { logout } from "../../features/auth/authSlice";

// ── Nav tree ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  // Dashboard
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: MdDashboard,
    module: "Dashboard",
    requiredAction: "read",
  },

  // Items
  {
    to: "/items",
    label: "Item Details",
    icon: MdInventory,
    module: "Items",
    requiredAction: "read",
  },

  // Sales
  {
    to: "/sale",
    label: "Sales Invoice",
    icon: MdReceipt,
    module: "Sale",
    requiredAction: "create",
  },

  // Purchase
  {
    to: "/purchase",
    label: "Purchase",
    icon: MdShoppingCart,
    module: "Purchase",
    requiredAction: "create",
  },

  // Stock Management
  {
    id: "stock",
    label: "Stock",
    icon: MdWarehouse,
    module: "Stock",
    children: [
      {
        to: "/stock/opening",
        label: "Opening Stock",
        icon: MdAddBox,
        module: "Item",
        requiredAction: "read",
      },
      {
        to: "/stock/reorder",
        label: "Reorder Stock",
        icon: MdRefresh,
        module: "Reorder",
        requiredAction: "read",
      },
      {
        to: "/stock/grn",
        label: "Goods Receipt",
        icon: MdReceipt,
        module: "Stock",
        requiredAction: "create",
      },
      {
        to: "/stock/transfer",
        label: "Stock Transfer",
        icon: MdSwapHoriz,
        module: "Stock",
        requiredAction: "transfer",
      },
      {
        to: "/stock/sales-return",
        label: "Sales Return",
        icon: MdRemoveCircle,
        module: "Sale Return",
        requiredAction: "read",
      },
      {
        to: "/stock/purchase-return",
        label: "Purchase Return",
        icon: MdRemoveCircle,
        module: "Purchase Return",
        requiredAction: "read",
      },
    ],
  },

  // Finance
  {
    id: "finance",
    label: "Finance",
    icon: MdAccountBalance,
    children: [
      {
        to: "/finance/supplier-payment",
        label: "Supplier Payment",
        icon: MdMonetizationOn,
        module: "Supplier Payment",
        requiredAction: "read",
      },
      {
        to: "/finance/amount-payable",
        label: "Amount Payable",
        icon: MdAssessment,
        module: "Supplier Payment",
        requiredAction: "read",
      },
      {
        to: "/finance/supplier-ledger",
        label: "Supplier Ledger",
        icon: MdReceipt,
        module: "Supplier Ledger",
        requiredAction: "read",
      },
      {
        to: "/finance/customer-payment",
        label: "Customer Payment",
        icon: MdMonetizationOn,
        module: "Customer Payment",
        requiredAction: "read",
      },
      {
        to: "/finance/amount-receivable",
        label: "Amount Receivable",
        icon: MdAssessment,
        module: "Customer Payment",
        requiredAction: "read",
      },
    ],
  },

  // Customer Management
  {
    id: "customer",
    label: "Customer",
    icon: MdPeople,
    module: "Customer",
    children: [
      {
        to: "/customer/registration",
        label: "Registration",
        icon: MdAccountBalance,
        module: "Customer",
        requiredAction: "read",
      },
      {
        to: "/customer/record",
        label: "Customer Record",
        icon: MdReceipt,
        module: "Customer",
        requiredAction: "read",
      },
    ],
  },

  // Bookings
  {
    to: "/booking-customers",
    label: "Bookings",
    icon: MdCalendarToday,
    module: "Booking",
    requiredAction: "read",
  },

  // Accounts (Expense Management)
  {
    id: "accounts",
    label: "Accounts",
    icon: MdMonetizationOn,
    children: [
      {
        to: "/daybook",
        label: "Day Book",
        icon: MdCalendarToday,
        module: "Day Book",
        requiredAction: "read",
      },
      {
        to: "/expense/head",
        label: "Expense Head",
        icon: MdAccountBalance,
        module: "Expense Head",
        requiredAction: "read",
      },
      {
        to: "/expense/voucher",
        label: "Expense Voucher",
        icon: MdReceipt,
        module: "Expense Voucher",
        requiredAction: "read",
      },
      {
        to: "/expense/report",
        label: "Expense Report",
        icon: MdAssessment,
        module: "Expense Report",
        requiredAction: "read",
      },
    ],
  },

  // Setup
  {
    id: "setup",
    label: "Setup",
    icon: MdSettings,
    children: [
      {
        to: "/setup/suppliers",
        label: "Suppliers",
        icon: MdLocalShipping,
        module: "Supplier",
        requiredAction: "read",
      },
      {
        to: "/setup/manufacturers",
        label: "Manufacturers",
        icon: MdFactory,
        module: "Manufacturer",
        requiredAction: "read",
      },
      {
        id: "setup-item",
        label: "Item",
        icon: MdWorkspaces,
        children: [
          {
            to: "/setup/item-category",
            label: "Item Category",
            icon: MdCategory,
            module: "Item Category",
            requiredAction: "read", // This will match "Read Category" because it contains "read"
          },
          {
            to: "/setup/item-subcategory",
            label: "Item Subcategory",
            icon: MdStyle,
            module: "Sub Category",
            requiredAction: "read",
          },
          {
            to: "/setup/item-type",
            label: "Item Type",
            icon: MdInventory,
            module: "Item Type",
            requiredAction: "read",
          },
          {
            to: "/setup/item-unit",
            label: "Item Unit",
            icon: MdLabel,
            module: "Item Unit",
            requiredAction: "read",
          },
          {
            to: "/expiry-tags",
            label: "Expiry Tags",
            icon: MdLocalOffer,
            module: "Setup",
            requiredAction: "read",
          },
          {
            to: "/setup/shelve-location",
            label: "Shelve Location",
            icon: MdLocationOn,
            module: "Shelve Location",
            requiredAction: "read",
          },
        ],
      },
      // ... rest
    ],
  },

  // Security
  {
    id: "security-settings",
    label: "Security",
    icon: MdSecurity,
    module: "Security",
    children: [
      {
        to: "/security",
        label: "Overview",
        icon: MdDashboard,
        module: "Security",
        requiredAction: "read",
      },
      {
        to: "/security/access-control",
        label: "Access Control",
        icon: MdSecurity,
        module: "Security",
        requiredAction: "read",
      },
    ],
  },
];

//filterNavItems function
function filterNavItems(items, permissions, isAdmin) {
  if (isAdmin) return items;

  const { modules = [], functionalities = [] } = permissions;

  function hasPermission(item) {
    // Check module access
    if (item.module) {
      const hasModule = modules.some((m) => {
        const moduleName = (m.module_name || m.slug || "").toLowerCase().trim();
        const requiredModule = item.module.toLowerCase().trim();
        return moduleName === requiredModule || 
               moduleName.includes(requiredModule) ||
               requiredModule.includes(moduleName);
      });
      if (!hasModule) return false;
    }

    // Check action permission - FLEXIBLE matching
    if (item.requiredAction) {
      const hasAction = functionalities.some((func) => {
        const funcName = (func.name || "").toLowerCase();
        const requiredAction = item.requiredAction.toLowerCase();
        
        // Simply check if the functionality name contains the required action
        // "Read Category" contains "read" → true ✅
        // "Create Sale" contains "create" → true ✅
        return funcName.includes(requiredAction);
      });
      if (!hasAction) return false;
    }

    return true;
  }

  return items.reduce((acc, item) => {
    if (item.children) {
      const visibleChildren = filterNavItems(item.children, permissions, isAdmin);
      if (visibleChildren.length > 0) {
        acc.push({ ...item, children: visibleChildren });
      }
      return acc;
    }

    if (hasPermission(item)) {
      acc.push(item);
    }
    return acc;
  }, []);
}
// ── Helpers ───────────────────────────────────────────────────────────────────
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

  return (
    <div>
      <button
        onClick={() => setOpenId(isOpen ? null : item.id)}
        style={
          isActive
            ? { backgroundColor: "#14b8a6", color: "#ffffff" }
            : undefined
        }
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
                `flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] transition-all duration-150 ${
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

// ── Children renderer ───────────────────────────────────────────────────────
function NestedChildren({ children, onNavigate }) {
  const [nestedOpenId, setNestedOpenId] = useState(() => {
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
          isActive
            ? { backgroundColor: "#14b8a6", color: "#ffffff" }
            : undefined
        }
        className={({ isActive }) =>
          `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-all duration-150 ${
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

// ── Level-1 sidebar item ──────────────────────────────────────────────────────
function SidebarItem({ item, openId, setOpenId, onNavigate }) {
  const location = useLocation();
  const isActive = pathMatchesItem(item, location.pathname);
  const isOpen = openId === item.id;

  if (item.to) {
    return (
      <NavLink
        to={item.to}
        onClick={onNavigate}
        style={({ isActive }) =>
          isActive
            ? { backgroundColor: "#14b8a6", color: "#ffffff" }
            : undefined
        }
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-150 ${
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

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setOpenId(isOpen ? null : item.id)}
        style={
          isActive
            ? { backgroundColor: "#14b8a6", color: "#ffffff" }
            : undefined
        }
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-150 ${
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
          <NestedChildren children={item.children} onNavigate={onNavigate} />
        </div>
      )}
    </div>
  );
}

// ── Sidebar shell ─────────────────────────────────────────────────────────────
function SidebarContent({ onNavigate }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, permissions } = useSelector((state) => state.auth);

  const isAdmin =
    user?.is_admin || user?.role === "admin" || permissions?.isAdmin || false;

  const filteredNavItems = filterNavItems(NAV_ITEMS, permissions, isAdmin);

  const [openId, setOpenId] = useState(() => {
    for (const item of filteredNavItems) {
      if (item.children && pathMatchesItem(item, location.pathname))
        return item.id;
    }
    return null;
  });

  // Debug logging (remove in production)
  useEffect(() => {
    console.log("Permissions:", permissions);
    console.log("Filtered Nav Items:", filteredNavItems);
  }, [permissions, filteredNavItems]);

  return (
    <div className="relative w-64 bg-white/92 dark:bg-slate-900/96 border-r border-gray-100 dark:border-slate-800 h-full flex flex-col shadow-md dark:shadow-none backdrop-blur transition-colors duration-300">
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-teal-200/70 to-transparent dark:via-teal-800/40" />

      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 dark:border-slate-800 shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm transition-colors duration-300">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30 shrink-0">
            <MdStorefront className="text-white text-xl" />
          </div>
          <div className="truncate">
            <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white leading-tight">
              POS System
            </h1>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 custom-scrollbar">
        {filteredNavItems.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            No modules available
          </div>
        ) : (
          filteredNavItems.map((item) => (
            <SidebarItem
              key={item.id || item.to}
              item={item}
              openId={openId}
              setOpenId={setOpenId}
              onNavigate={onNavigate}
            />
          ))
        )}
      </div>

      {/* User info + Logout */}
      <div className="border-t border-gray-100 dark:border-slate-800 p-3 shrink-0 transition-colors duration-300">
        {user && (
          <div className="flex items-center gap-2">
            <NavLink
              to="/profile"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex-1 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center shrink-0">
                <MdPerson className="text-teal-600 dark:text-teal-400 text-sm" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200 truncate">
                  {user.username || user.name}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate capitalize">
                  {isAdmin ? "Administrator" : user.role || "User"}
                </p>
              </div>
            </NavLink>

            <button
              title="Logout"
              onClick={() => dispatch(logout())}
              className="flex items-center justify-center w-10 h-10 rounded-lg text-red-500 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-900/20 transition-colors duration-150 group shrink-0"
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 dark:bg-rose-900/40 text-red-400 dark:text-rose-300 group-hover:bg-red-100 transition-colors">
                <MdLogout className="text-base" />
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
const Sidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const overlayRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => setMobileOpen(false), 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Hamburger (mobile) */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm text-gray-600 hover:bg-gray-50 transition-colors"
        aria-label="Open menu"
      >
        <MdMenu className="text-xl" />
      </button>

      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">
        <SidebarContent onNavigate={() => {}} />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            ref={overlayRef}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 flex h-full animate-in slide-in-from-left-4 duration-200">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
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
