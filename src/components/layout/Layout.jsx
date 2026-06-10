import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-gray-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar />
      <div className="relative flex h-screen flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-12rem] top-[-8rem] h-72 w-72 rounded-full bg-teal-100/40 blur-3xl dark:bg-teal-900/10" />
          <div className="absolute bottom-[-10rem] right-[-8rem] h-80 w-80 rounded-full bg-slate-200/50 blur-3xl dark:bg-slate-800/20" />
        </div>
        <Navbar />
        <main className="app-shell relative z-10 flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/80 px-3 py-3 transition-colors duration-300 custom-scrollbar sm:px-4 sm:py-4 lg:px-6 lg:py-6 dark:bg-slate-950/90">
          <div className="mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
