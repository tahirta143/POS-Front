import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Layout = () => {
  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 lg:p-6 custom-scrollbar">
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
