import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Layout = () => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 font-sans text-gray-900 dark:text-slate-100 overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="relative flex-1 flex flex-col h-full overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-12rem] top-[-8rem] h-72 w-72 rounded-full bg-teal-100/40 blur-3xl dark:bg-teal-900/10" />
          <div className="absolute bottom-[-10rem] right-[-8rem] h-80 w-80 rounded-full bg-slate-200/50 blur-3xl dark:bg-slate-800/20" />
        </div>
        <Navbar />
        <main className="app-shell relative z-10 flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/80 dark:bg-slate-950/90 p-4 lg:p-6 custom-scrollbar transition-colors duration-300">
          <div className="w-full lg:max-w-7xl xl:max-w-8xl 2xl:max-w-9xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Layout;
