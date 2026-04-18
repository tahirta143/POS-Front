import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell.jsx";
import {
  MdBusiness,
  MdPeople,
  MdSecurity,
  MdVpnKey,
  MdHistory,
  MdViewModule,
  MdExtension,
  MdLockPerson,
  MdAppRegistration,
  MdGroupWork,
  MdSearch,
} from "react-icons/md";

// Route paths match App.jsx exactly
const MODULE_DATA = [
  // {
  //   path: "/security/company",
  //   category: "Organization",
  //   title: "Company",
  //   desc: "Manage company information",
  //   icon: <MdBusiness />,
  // },
  // {
  //   path: "/security/employee",
  //   category: "Organization",
  //   title: "Employee",
  //   desc: "Manage employee records",
  //   icon: <MdPeople />,
  // },
  {
    path: "/security/software-group",
    category: "Access Control",
    title: "Software Group",
    desc: "Configure software groups",
    icon: <MdGroupWork />,
  },
  {
    path: "/security/user",
    category: "User Management",
    title: "Users",
    desc: "Manage user accounts",
    icon: <MdLockPerson />,
  },

  {
    path: "/security/user-to-group",
    category: "User Management",
    title: "User to Group",
    desc: "Link users to groups",
    icon: <MdGroupWork />,
  },
  {
    path: "/security/security-log",
    category: "Monitoring",
    title: "Security Log",
    desc: "View security activities",
    icon: <MdHistory />,
  },
  {
    path: "/security/module-info",
    category: "System",
    title: "Modules",
    desc: "Manage system modules",
    icon: <MdViewModule />,
  },
  {
    path: "/security/module-functions",
    category: "System",
    title: "Module Functions",
    desc: "Configure functionalities",
    icon: <MdExtension />,
  },
  {
    path: "/security/group-rights",
    category: "Access Control",
    title: "Group Rights",
    desc: "Set group permissions",
    icon: <MdSecurity />,
  },
  {
    path: "/security/user-module",
    category: "Access Control",
    title: "Users Module Access",
    desc: "Manage user access",
    icon: <MdVpnKey />,
  },
];

export default function Security() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredModules = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return MODULE_DATA.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q),
    );
  }, [searchTerm]);

  return (
    <PageShell title="SECURITY MODULES" accent="from-teal-600 to-emerald-700">
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Search */}
        <div className="relative max-w-2xl">
          <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search security modules..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3.5 pl-12 pr-10 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500 shadow-sm transition-colors"
          />
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filteredModules.map((mod) => (
            <ModuleCard key={mod.path} mod={mod} />
          ))}
        </div>
      </div>
    </PageShell>
  );
}

function ModuleCard({ mod }) {
  return (
    <NavLink
      to={mod.path}
      className={({ isActive }) =>
        [
          "group p-5 rounded-xl border bg-white dark:bg-slate-900 transition-all cursor-pointer",
          "hover:border-teal-400 hover:shadow-lg hover:-translate-y-1",
          isActive
            ? "border-teal-400 shadow-md"
            : "border-slate-100 dark:border-slate-800",
        ].join(" ")
      }
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-full bg-teal-50 dark:bg-teal-900/30 px-2.5 py-0.5 text-[10px] font-bold uppercase text-teal-700 dark:text-teal-300">
          {mod.category}
        </span>
        <div className="text-2xl text-teal-600 group-hover:scale-110 transition-transform">
          {mod.icon}
        </div>
      </div>
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-50">
        {mod.title}
      </h3>
      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-200 leading-tight">
        {mod.desc}
      </p>
      <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center text-teal-600 dark:text-teal-300 font-bold text-[11px]">
        <span>Open Module</span>
        <span className="group-hover:translate-x-1 transition-transform">
          →
        </span>
      </div>
    </NavLink>
  );
}
