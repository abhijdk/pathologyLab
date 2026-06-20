import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="layout-container">
      <Header toggleSidebar={toggleSidebar} />
      <div className="main-wrapper">
        <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;